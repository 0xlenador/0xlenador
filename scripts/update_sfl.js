import fs from "fs/promises"
import path from "path"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const sflIds = require("../src/content/data/sfl/resources.json")
const sflPowerUps = require("../src/content/data/sfl/powerups.json")
const sflCosmetics = require("../src/content/data/sfl/cosmetics.json")
const ALLOWED_KEYS = new Set([
  ...Object.keys(sflIds).map((id) => `collectibles-${id}`),
  ...Object.keys(sflPowerUps.power_ups.collectibles).map((id) => `collectibles-${id}`),
  ...(sflPowerUps.power_ups.wearables
    ? Object.keys(sflPowerUps.power_ups.wearables).map((id) => `wearables-${id}`)
    : []),
  ...(sflCosmetics.cosmetics.wearables
    ? Object.keys(sflCosmetics.cosmetics.wearables).map((id) => `wearables-${id}`)
    : []),
  ...(sflCosmetics.cosmetics.collectibles
    ? Object.keys(sflCosmetics.cosmetics.collectibles).map((id) => `collectibles-${id}`)
    : []),
])

function getDateString(daysOffset) {
  const dateObj = new Date()
  dateObj.setUTCDate(dateObj.getUTCDate() - daysOffset)
  const yyyy = dateObj.getUTCFullYear()
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dateObj.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// Helpers para Semestres
function getSemesterString(dateStr) {
  if (dateStr === "live") return "live"
  const [yyyy, mm] = dateStr.split("-")
  const month = parseInt(mm, 10)
  const half = month <= 6 ? "H1" : "H2"
  return `${yyyy}-${half}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status < 500) return res
      console.log(
        `  ↩ Intento ${attempt}/${maxRetries} falló con status ${res.status}. Reintentando...`,
      )
    } catch (e) {
      console.log(`  ↩ Intento ${attempt}/${maxRetries} falló (red): ${e.message}. Reintentando...`)
    }
    if (attempt < maxRetries) await sleep(1000 * Math.pow(2, attempt - 1))
  }
  return null
}

async function fetchSFLDate(dateStr) {
  const isLive = dateStr === "live"
  const url = isLive
    ? `https://api.sunflower-land.com/data?type=marketplaceActivity`
    : `https://api.sunflower-land.com/data?type=marketplaceActivity&date=${dateStr}`
  console.log(`⏳ Consultando: ${dateStr}`)
  try {
    const res = await fetchWithRetry(url)
    if (!res || !res.ok) return { items: null, flowerPrice: null }
    const data = await res.json()
    if (data && data.data && data.data.reports) {
      const flowerPrice = data.data.flowerPrice || null
      if (isLive) {
        const keys = Object.keys(data.data.reports)
        if (keys.length > 0) return { items: data.data.reports[keys[0]].items, flowerPrice }
      } else if (data.data.reports[dateStr]) {
        return { items: data.data.reports[dateStr].items, flowerPrice: null }
      }
    }
  } catch (e) {
    console.log(`Error al consultar ${dateStr}: ${e.message}`)
  }
  return { items: null, flowerPrice: null }
}

async function updateSFLData() {
  try {
    console.log("Iniciando motor avanzado de recolección SFL (Semestral)...")

    const historyDir = path.join(process.cwd(), "public", "api", "history")
    await fs.mkdir(historyDir, { recursive: true })

    let rawData = {}
    let hasChanges = false
    let semestersLoaded = new Set()
    let migratedDatesCount = 0

    // 1. MIGRACIÓN INICIAL (Si existe el archivo viejo, lo lee y lo inyecta a la memoria)
    const oldCachePath = path.join(process.cwd(), "public", "api", "raw_sfl_history.json")
    try {
      const oldCached = await fs.readFile(oldCachePath, "utf8")
      const oldData = JSON.parse(oldCached)
      for (const [dateStr, items] of Object.entries(oldData)) {
        if (items !== "error") {
          rawData[dateStr] = items
          semestersLoaded.add(getSemesterString(dateStr))
          migratedDatesCount++
        }
      }
      if (migratedDatesCount > 0) {
        console.log(
          `Migrando ${migratedDatesCount} días desde el archivo viejo a la nueva estructura semestral.`,
        )
        hasChanges = true
      }
    } catch (e) {
      // No existe archivo viejo, omitimos migración
    }

    // 2. CARGA INTELIGENTE (Solo cargar archivos recientes necesarios)
    const maxDays = 210 // 7 meses
    const recentSemesters = new Set()
    for (let offset = 0; offset <= maxDays; offset++) {
      recentSemesters.add(getSemesterString(getDateString(offset)))
    }

    for (const sem of recentSemesters) {
      if (!semestersLoaded.has(sem) && sem !== "live") {
        const semPath = path.join(historyDir, `${sem}.json`)
        try {
          const semData = JSON.parse(await fs.readFile(semPath, "utf8"))
          for (const [dateStr, items] of Object.entries(semData)) {
            rawData[dateStr] = items
          }
          semestersLoaded.add(sem)
          console.log(`Semestre ${sem} cargado de disco.`)
        } catch (e) {
          // Archivo no existe aún
          semestersLoaded.add(sem)
        }
      }
    }

    let currentFlowerPrice = null

    // 3. DESCARGA DE DÍAS FALTANTES
    for (let offset = 0; offset <= maxDays; offset++) {
      const dateStr = getDateString(offset)
      if (!rawData[dateStr] || rawData[dateStr] === "error") {
        const result = await fetchSFLDate(dateStr)
        if (result && result.items) {
          rawData[dateStr] = result.items
          if (offset === 0 && result.flowerPrice) {
            currentFlowerPrice = result.flowerPrice
          }
          hasChanges = true
          await sleep(500)
        } else {
          rawData[dateStr] = "error"
        }
      }
    }

    // 4. DATA EN VIVO
    const liveResult = await fetchSFLDate("live")
    if (liveResult && liveResult.items) {
      rawData["live"] = liveResult.items
      if (liveResult.flowerPrice) {
        currentFlowerPrice = liveResult.flowerPrice
      }
    }

    // 5. GUARDAR DATOS HISTÓRICOS (Solo si hubo cambios nuevos)
    if (hasChanges) {
      const semestersData = {}
      for (const [dateStr, items] of Object.entries(rawData)) {
        if (items === "error" || dateStr === "live") continue
        const sem = getSemesterString(dateStr)
        if (!semestersData[sem]) semestersData[sem] = {}
        semestersData[sem][dateStr] = items
      }

      for (const [sem, data] of Object.entries(semestersData)) {
        const semPath = path.join(historyDir, `${sem}.json`)
        await fs.writeFile(semPath, JSON.stringify(data))
        console.log(`✅ Semestre ${sem} guardado (${Object.keys(data).length} días).`)
      }

      // Borrar el archivo viejo tras migración exitosa
      if (migratedDatesCount > 0) {
        try {
          await fs.unlink(oldCachePath)
          console.log(`🗑️ Archivo viejo raw_sfl_history.json eliminado exitosamente.`)
        } catch (e) {
          console.log(`No se pudo borrar el archivo viejo.`)
        }
      }
    } else {
      console.log(`⚡ Sin cambios en historia (API al día). Omitiendo escritura semestral.`)
    }

    // 6. GENERAR sfl_data.json (Siempre se ejecuta para actualizar live)
    const dirPath = path.join(process.cwd(), "public", "api")

    let baseItems = rawData["live"] || rawData[getDateString(0)]
    if (!baseItems) {
      console.log(`Intentando fallback dinámico para 0d usando datos de ayer...`)
      const fallback = rawData[getDateString(1)]
      if (fallback) baseItems = fallback
      else throw new Error("No se pudo obtener la data principal.")
    }

    const filteredItems = {}
    for (const itemKey of ALLOWED_KEYS) {
      const itemData = baseItems[itemKey] || {}
      
      const getItemPrice = (offset) => {
        if (offset === 0 && rawData["live"])
          return rawData["live"][itemKey] ? rawData["live"][itemKey].latestSale : null
        const dStr = getDateString(offset)
        return rawData[dStr] && rawData[dStr][itemKey] ? rawData[dStr][itemKey].latestSale : null
      }

      const getItemTrades = (offset) => {
        if (offset === 0 && rawData["live"])
          return rawData["live"][itemKey] ? rawData["live"][itemKey].trades : null
        const dStr = getDateString(offset)
        return rawData[dStr] && rawData[dStr][itemKey] ? rawData[dStr][itemKey].trades : null
      }

      const p0 = getItemPrice(0) || itemData.latestSale || 0
      const t0 = getItemTrades(0) || itemData.trades || 0
      const t1 = getItemTrades(1) || getItemTrades(2) || getItemTrades(3) || 0
      const trades24h = t1 > 0 && t0 >= t1 ? t0 - t1 : 0

      const getSparklinePrice = (offset) => {
        if (offset === 0) return p0
        let p = getItemPrice(offset)
        if (p) return p
        for (let i = 1; i <= 30; i++) {
          p = getItemPrice(offset + i)
          if (p) return p
        }
        return null
      }

      filteredItems[itemKey] = {
        key: itemKey,
        currentPrice: p0,
        low: itemData.low || p0,
        volume: itemData.volume || 0,
        trades: t0,
        trades24h: trades24h,
        history: {
          "1d": getItemPrice(1) || getItemPrice(2) || getItemPrice(3) || null,
          "7d": getItemPrice(7) || getItemPrice(6) || getItemPrice(5) || getItemPrice(4) || null,
          "30d":
            getItemPrice(30) ||
            getItemPrice(31) ||
            getItemPrice(29) ||
            getItemPrice(32) ||
            getItemPrice(28) || null,
          "180d":
            getItemPrice(180) ||
            getItemPrice(181) ||
            getItemPrice(179) ||
            getItemPrice(182) ||
            getItemPrice(178) || null,
          sparkline7d: Array.from({ length: 8 }, (_, i) => 7 - i).map(o => getSparklinePrice(o)),
          sparkline30d: Array.from({ length: 31 }, (_, i) => 30 - i).map(o => getSparklinePrice(o)),
          sparkline180d: Array.from({ length: 181 }, (_, i) => 180 - i).map(o => getSparklinePrice(o)),
        },
      }
    }

    const finalJSON = {
      lastUpdated: new Date().toISOString(),
      flowerPrice: currentFlowerPrice,
      items: filteredItems,
    }

    const filePath = path.join(dirPath, "sfl_data.json")
    await fs.writeFile(filePath, JSON.stringify(finalJSON, null, 2))

    console.log(`🚀 API en vivo procesada y optimizada en: ${filePath}`)
  } catch (error) {
    console.error("Error crítico:", error)
    process.exit(1)
  }
}

updateSFLData()
