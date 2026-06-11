import fs from 'fs/promises';
import path from 'path';

// Helper para obtener YYYY-MM-DD a partir de hoy menos N días
function getDateString(daysOffset) {
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() - daysOffset); // Empezamos desde hoy (offset 0)
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSFLDate(dateStr) {
  const isLive = dateStr === "live";
  const url = isLive 
    ? `https://api.sunflower-land.com/data?type=marketplaceActivity` 
    : `https://api.sunflower-land.com/data?type=marketplaceActivity&date=${dateStr}`;
  console.log(`⏳ Consultando: ${dateStr}`);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.data && data.data.reports) {
      if (isLive) {
        const keys = Object.keys(data.data.reports);
        if (keys.length > 0) return data.data.reports[keys[0]].items;
      } else if (data.data.reports[dateStr]) {
        return data.data.reports[dateStr].items;
      }
    }
  } catch (e) {
    console.log(`Error al consultar ${dateStr}: ${e.message}`);
  }
  return null;
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

    const maxDays = 182;
    for (let offset = 0; offset <= maxDays; offset++) {
      const dateStr = getDateString(offset);
      if (!rawData[dateStr] || rawData[dateStr] === "error") {
        const items = await fetchSFLDate(dateStr);
        if (items) {
          rawData[dateStr] = items;
        } else {
          // Guardamos "error" temporalmente en RAM para no reintentar en este mismo bucle
          // pero no lo guardaremos en cache para que reintente mañana.
          console.log(`⚠️ Datos no encontrados para ${dateStr}`);
        }
        await sleep(300); // 300ms delay para respetar rate limits de la API
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
    const liveItems = await fetchSFLDate("live");
    if (liveItems) {
      rawData["live"] = liveItems;
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

    const finalJSON = {
      lastUpdated: new Date().toISOString(),
      items: processedItems
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
