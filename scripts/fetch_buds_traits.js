import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUDS_JSON_PATH = path.join(__dirname, "../public/api/sfl_buds.json")
const TRAITS_JSON_PATH = path.join(__dirname, "../src/content/data/sfl/buds.json")

const DEFAULT_TYPE_BOOSTS = {
  Plaza: "+0.3 Basic Crops",
  Castle: "+0.3 Medium Crops",
  Snow: "+0.3 Advanced Crops",
  Saphiro: "-10% Crop Time",
  Cave: "+0.2 Minerals",
  Beach: "+0.2 Fruit",
  Woodlands: "+0.2 Wood",
  Port: "+10% Fish XP",
  Sea: "+10% Extra Fish",
  Retreat: "Animal Speed Boost",
}

function parseBudAttributes(attributes = []) {
  let type = ""
  let stem = ""
  let aura = ""
  let ears = ""
  let colour = ""
  let mainBoost = ""
  let stemBoost = ""
  let auraBoost = ""

  for (const attr of attributes) {
    if (!attr || !attr.trait_type) continue

    if (attr.trait_type === "Type") {
      type = attr.value || ""
    } else if (attr.trait_type === "Stem") {
      stem = attr.value || ""
    } else if (attr.trait_type === "Aura") {
      aura = attr.value !== "No Aura" ? attr.value : ""
    } else if (attr.trait_type === "Ears") {
      ears = attr.value === "Ears" ? "Goblin" : "Bumpkin"
    } else if (attr.trait_type === "Colour") {
      colour = attr.value || ""
    } else if (attr.trait_type === "Bud Boost Increase") {
      auraBoost = `+${attr.value}% Aura`
    } else if (attr.trait_type.includes("(Stem)")) {
      const clean = attr.trait_type.replace("Increase Yield of ", "").replace(" (Stem)", "")
      stemBoost = `Stem: +${attr.value} ${clean}`
    } else if (attr.display_type === "boost_percentage") {
      if (attr.trait_type === "Reduced Crop Growth Time") {
        mainBoost = `-${attr.value}% Crop Time`
      } else if (attr.trait_type === "XP Boost when eating Fish") {
        mainBoost = `+${attr.value}% Fish XP`
      } else if (attr.trait_type === "Chance of getting 1 extra Fish") {
        mainBoost = `+${attr.value}% Extra Fish`
      } else {
        mainBoost = `+${attr.value}% ${attr.trait_type}`
      }
    } else if (attr.display_type === "boost_number") {
      const clean = attr.trait_type.replace("Increase Yield of ", "")
      mainBoost = `+${attr.value} ${clean}`
    }
  }

  if (!mainBoost && type) {
    mainBoost = DEFAULT_TYPE_BOOSTS[type] || type
  }

  // Componer string compacto de boost para la tabla
  const parts = []
  if (mainBoost) parts.push(mainBoost)
  if (stemBoost) parts.push(stemBoost)
  if (auraBoost) parts.push(`(${auraBoost})`)

  return {
    type,
    stem,
    aura,
    ears,
    colour,
    boost: parts.join(" | ") || (type ? `${type} Bud` : "Bud"),
    mainBoost,
    stemBoost,
    auraBoost,
  }
}

async function fetchBudMetadata(id, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`https://api.sunflower-land.com/buds/metadata/${id}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; 0xLenadorBot/1.0)",
          Accept: "application/json",
        },
      })
      if (res.ok) {
        const json = await res.json()
        return parseBudAttributes(json.attributes)
      }
      if (res.status === 404) return null
    } catch {
      if (attempt === retries) return null
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  return null
}

async function main() {
  console.log("🔍 Leyendo catálogo de Buds...")
  const rawBuds = await fs.readFile(BUDS_JSON_PATH, "utf8")
  const budsData = JSON.parse(rawBuds)
  const budKeys = Object.keys(budsData.items || {})
  console.log(`📋 Total Buds en catálogo: ${budKeys.length}`)

  let existingTraits = {}
  try {
    const rawTraits = await fs.readFile(TRAITS_JSON_PATH, "utf8")
    existingTraits = JSON.parse(rawTraits)
  } catch {
    existingTraits = {}
  }

  const idsToFetch = []
  for (const key of budKeys) {
    const id = key.replace("buds-", "")
    if (!existingTraits[id]) {
      idsToFetch.push(id)
    }
  }

  console.log(`⚡ Buds pendientes de traits: ${idsToFetch.length} (ya en caché: ${Object.keys(existingTraits).length})`)

  if (idsToFetch.length === 0) {
    console.log("✅ Todos los Buds ya tienen sus potenciadores al día.")
    return
  }

  const BATCH_SIZE = 15
  let completed = 0

  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batch = idsToFetch.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (id) => {
      const data = await fetchBudMetadata(id)
      if (data) {
        existingTraits[id] = data
      }
    })

    await Promise.all(promises)
    completed += batch.length
    if (completed % 45 === 0 || completed === idsToFetch.length) {
      console.log(`  ⏳ Procesados ${completed}/${idsToFetch.length} buds...`)
      // Guardado incremental cada 45 para no perder progreso
      await fs.writeFile(TRAITS_JSON_PATH, JSON.stringify(existingTraits, null, 2), "utf8")
    }
    // Pequeño respiro para evitar rate-limits
    await new Promise((r) => setTimeout(r, 200))
  }

  await fs.writeFile(TRAITS_JSON_PATH, JSON.stringify(existingTraits, null, 2), "utf8")
  console.log(`🎉 ¡Completado! Guardados ${Object.keys(existingTraits).length} buds en ${TRAITS_JSON_PATH}`)
}

main().catch((err) => {
  console.error("Error al obtener traits de buds:", err)
  process.exit(1)
})
