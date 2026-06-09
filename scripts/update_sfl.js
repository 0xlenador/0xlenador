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
  const url = `https://api.sunflower-land.com/data?type=marketplaceActivity&date=${dateStr}`;
  console.log(`⏳ Consultando: ${dateStr}`);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.data && data.data.reports && data.data.reports[dateStr]) {
      return data.data.reports[dateStr].items;
    }
  } catch (e) {
    console.log(`Error al consultar ${dateStr}: ${e.message}`);
  }
  return null;
}

async function updateSFLData() {
  try {
    console.log("Iniciando motor de recolección de precios históricos SFL...");

    // Offsets de días que queremos (incluyendo días extra para sparklines de 30d y 180d)
    const offsets = [0, 1, 2, 3, 4, 5, 6, 7, 14, 21, 28, 29, 30, 31, 32, 60, 90, 120, 150, 178, 179, 180, 181, 182];
    const rawData = {}; // key: daysOffset, value: items obj

    for (const offset of offsets) {
      const dateStr = getDateString(offset);
      const items = await fetchSFLDate(dateStr);
      if (items) {
        rawData[offset] = items;
      } else {
        console.log(`⚠️ Datos no encontrados para ${dateStr}`);
        // Si es el offset 0 (hoy), intentaremos la fecha estática de fallback si falla todo
        if (offset === 0) {
           console.log(`Intentando fallback estático para 0d...`);
           const fallback = await fetchSFLDate("2026-06-06");
           if(fallback) rawData[0] = fallback;
        }
      }
      await sleep(300); // 300ms delay para respetar rate limits de la API
    }

    if (!rawData[0]) {
      throw new Error("No se pudo obtener la data principal (offset 0).");
    }

    // Procesar la data para el formato súper eficiente del frontend
    const processedItems = {};
    const baseItems = rawData[0];

    for (const [itemKey, itemData] of Object.entries(baseItems)) {
      // Helper para extraer precios seguros
      const getPrice = (offset) => rawData[offset] && rawData[offset][itemKey] ? rawData[offset][itemKey].latestSale : null;

      const p0 = getPrice(0);
      if (!p0) continue;

      processedItems[itemKey] = {
        key: itemKey,
        currentPrice: p0,
        low: itemData.low || p0,
        volume: itemData.volume || 0,
        trades: itemData.trades || 0,
        history: {
          // Fallbacks: si falla 1d, busca 2d, 3d, etc.
          "1d": getPrice(1) || getPrice(2) || getPrice(3),
          "7d": getPrice(7) || getPrice(6) || getPrice(5) || getPrice(4),
          "30d": getPrice(30) || getPrice(31) || getPrice(29) || getPrice(32) || getPrice(28),
          "180d": getPrice(180) || getPrice(181) || getPrice(179) || getPrice(182) || getPrice(178),
          // Sparklines
          "sparkline7d": [7,6,5,4,3,2,1,0].map(getPrice),
          "sparkline30d": [30,28,21,14,7,3,0].map(getPrice),
          "sparkline180d": [180,150,120,90,60,30,0].map(getPrice)
        }
      };
    }

    const finalJSON = {
      lastUpdated: new Date().toISOString(),
      items: processedItems
    };

    const dirPath = path.join(process.cwd(), 'public', 'api');
    await fs.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, 'sfl_data.json');
    await fs.writeFile(filePath, JSON.stringify(finalJSON, null, 2));
    
    console.log(`✅ Historial procesado y guardado en: ${filePath}`);

  } catch (error) {
    console.error("Error crítico:", error);
    process.exit(1);
  }
}

updateSFLData();
