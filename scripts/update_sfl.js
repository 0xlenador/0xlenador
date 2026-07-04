import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Solo los IDs que queremos mostrar en el frontend (reducirá el JSON de ~8MB a ~500KB)
const sflIds = require('../src/content/data/sfl/resources.json');
const sflPowerUps = require('../src/content/data/sfl/powerups.json');
const sflCosmetics = require('../src/content/data/sfl/cosmetics.json');
const ALLOWED_KEYS = new Set([
  ...Object.keys(sflIds).map(id => `collectibles-${id}`),
  ...Object.keys(sflPowerUps.power_ups.collectibles).map(id => `collectibles-${id}`),
  ...(sflPowerUps.power_ups.wearables ? Object.keys(sflPowerUps.power_ups.wearables).map(id => `wearables-${id}`) : []),
  ...(sflCosmetics.cosmetics.wearables ? Object.keys(sflCosmetics.cosmetics.wearables).map(id => `wearables-${id}`) : []),
  ...(sflCosmetics.cosmetics.collectibles ? Object.keys(sflCosmetics.cosmetics.collectibles).map(id => `collectibles-${id}`) : [])
]);

// Problema 5 — Forzar siempre UTC para que coincida con el servidor de GitHub Actions
// y con el ciclo de reportes diarios de la API de Sunflower Land
function getDateString(daysOffset) {
  const dateObj = new Date();
  dateObj.setUTCDate(dateObj.getUTCDate() - daysOffset);
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Problema 6 — Reintentos automáticos con backoff exponencial
// Si la red falla un instante, espera 1s, 2s, 4s antes de rendirse
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // Errores de servidor (5xx) → reintentamos; errores de cliente (4xx) → no
      if (res.status < 500) return res;
      console.log(`  ↩ Intento ${attempt}/${maxRetries} falló con status ${res.status}. Reintentando...`);
    } catch (e) {
      console.log(`  ↩ Intento ${attempt}/${maxRetries} falló (red): ${e.message}. Reintentando...`);
    }
    if (attempt < maxRetries) await sleep(1000 * Math.pow(2, attempt - 1)); // 1s, 2s, 4s
  }
  return null; // Todos los intentos fallaron
}

async function fetchSFLDate(dateStr) {
  const isLive = dateStr === "live";
  const url = isLive 
    ? `https://api.sunflower-land.com/data?type=marketplaceActivity` 
    : `https://api.sunflower-land.com/data?type=marketplaceActivity&date=${dateStr}`;
  console.log(`⏳ Consultando: ${dateStr}`);
  try {
    const res = await fetchWithRetry(url);
    if (!res || !res.ok) return { items: null, flowerPrice: null };
    const data = await res.json();
    if (data && data.data && data.data.reports) {
      const flowerPrice = data.data.flowerPrice || null;
      if (isLive) {
        const keys = Object.keys(data.data.reports);
        if (keys.length > 0) return { items: data.data.reports[keys[0]].items, flowerPrice };
      } else if (data.data.reports[dateStr]) {
        return { items: data.data.reports[dateStr].items, flowerPrice: null }; // El historial no guarda flowerPrice por ahora
      }
    }
  } catch (e) {
    console.log(`Error al consultar ${dateStr}: ${e.message}`);
  }
  return { items: null, flowerPrice: null };
}

async function updateSFLData() {
  try {
    console.log("Iniciando motor de recolección de precios históricos SFL...");

    let rawData = {}; // key: dateStr, value: items obj
    const cachePath = path.join(process.cwd(), 'public', 'api', 'raw_sfl_history.json');
    try {
      const cached = await fs.readFile(cachePath, 'utf8');
      rawData = JSON.parse(cached);
      console.log(`Caché cargado con ${Object.keys(rawData).length} días.`);
    } catch (e) {
      console.log("Caché no encontrado, se descargará todo el historial inicial.");
    }

    let currentFlowerPrice = null;

    const maxDays = 182;
    for (let offset = 0; offset <= maxDays; offset++) {
      const dateStr = getDateString(offset);
      if (!rawData[dateStr] || rawData[dateStr] === "error") {
        const result = await fetchSFLDate(dateStr);
        if (result && result.items) {
          rawData[dateStr] = result.items;
          if (offset === 0 && result.flowerPrice) {
            currentFlowerPrice = result.flowerPrice;
          }
          await sleep(500); // 500ms entre llamadas exitosas
        } else {
          rawData[dateStr] = "error";
        }
      }
    }

    // Limpiar errores antes de guardar el caché
    const cacheToSave = {};
    for (const [k, v] of Object.entries(rawData)) {
      if (v !== "error") cacheToSave[k] = v;
    }
    const dirPath = path.join(process.cwd(), 'public', 'api');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cacheToSave));

    // Obtener data en vivo (último reporte generado)
    const liveResult = await fetchSFLDate("live");
    if (liveResult && liveResult.items) {
      rawData["live"] = liveResult.items;
      if (liveResult.flowerPrice) {
        currentFlowerPrice = liveResult.flowerPrice;
      }

    }

    // Validar el día actual (o fallback)
    let baseItems = rawData["live"] || rawData[getDateString(0)];
    if (!baseItems) {
      console.log(`Intentando fallback dinámico para 0d usando datos de ayer...`);
      // ¡Usamos los datos que ya están en la RAM en lugar de descargarlos de nuevo!
      const fallback = rawData[getDateString(1)]; 
      if (fallback) baseItems = fallback;
      else throw new Error("No se pudo obtener la data principal (offset 0 y 1 fallaron).");
    }

    // Procesar la data para el formato súper eficiente del frontend
    const processedItems = {};

    for (const [itemKey, itemData] of Object.entries(baseItems)) {
      // Helper para extraer precios seguros
      const getPrice = (offset) => {
        if (offset === 0 && rawData["live"]) return rawData["live"][itemKey] ? rawData["live"][itemKey].latestSale : null;
        
        const dStr = getDateString(offset);
        return cacheToSave[dStr] && cacheToSave[dStr][itemKey] ? cacheToSave[dStr][itemKey].latestSale : null;
      };

      const p0 = getPrice(0) || itemData.latestSale;
      if (!p0) continue;

      processedItems[itemKey] = {
        key: itemKey,
        currentPrice: p0,
        low: itemData.low || p0,
        volume: itemData.volume || 0,
        trades: itemData.trades || 0,
        history: {
          // Fallbacks de porcentajes
          "1d": getPrice(1) || getPrice(2) || getPrice(3),
          "7d": getPrice(7) || getPrice(6) || getPrice(5) || getPrice(4),
          "30d": getPrice(30) || getPrice(31) || getPrice(29) || getPrice(32) || getPrice(28),
          "180d": getPrice(180) || getPrice(181) || getPrice(179) || getPrice(182) || getPrice(178),
          
          // Sparklines continuos (invierten el array para que el más antiguo esté a la izquierda)
          "sparkline7d": Array.from({length: 8}, (_, i) => 7 - i).map(getPrice),
          "sparkline30d": Array.from({length: 31}, (_, i) => 30 - i).map(getPrice),
          "sparkline180d": Array.from({length: 181}, (_, i) => 180 - i).map(getPrice)
        }
      };
    }

    // Filtrar para conservar SOLO los items que están en sfl_ids.json
    const filteredItems = {};
    for (const [key, val] of Object.entries(processedItems)) {
      if (ALLOWED_KEYS.has(key)) {
        filteredItems[key] = val;
      }
    }

    console.log(`📦 Items en bruto: ${Object.keys(processedItems).length} → Items filtrados: ${Object.keys(filteredItems).length}`);

    const finalJSON = {
      lastUpdated: new Date().toISOString(),
      flowerPrice: currentFlowerPrice,
      items: filteredItems
    };

    const filePath = path.join(dirPath, 'sfl_data.json');
    await fs.writeFile(filePath, JSON.stringify(finalJSON, null, 2));
    
    console.log(`✅ Historial procesado y guardado en: ${filePath}`);

  } catch (error) {
    console.error("Error crítico:", error);
    process.exit(1);
  }
}

updateSFLData();
