import fs from 'fs/promises';
import path from 'path';

async function updateSFLData() {
  try {
    console.log("Consultando API del mercado P2P de Sunflower Land...");
    
    // SFL genera los reportes completos del día anterior
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const targetDate = `${yyyy}-${mm}-${dd}`;
    
    const url = `https://api.sunflower-land.com/data?type=marketplaceActivity&date=${targetDate}`;
    console.log(`Intentando fetch para: ${targetDate}`);
    
    let data;
    const response = await fetch(url);
    
    if (response.ok) {
      data = await response.json();
    }
    
    // Fallback a una fecha estática conocida por si el reporte de hoy/ayer no se ha generado aún
    if (!data || !data.data || !data.data.reports || !data.data.reports[targetDate]) {
       console.log(`Datos no disponibles para ${targetDate}, usando datos de respaldo (2026-06-06)`);
       const fallbackRes = await fetch(`https://api.sunflower-land.com/data?type=marketplaceActivity&date=2026-06-06`);
       if (!fallbackRes.ok) throw new Error("Fallback fetch falló.");
       data = await fallbackRes.json();
    }
    
    if (data && data.data && data.data.reports) {
      await saveData(data);
    } else {
      throw new Error("Formato de datos no reconocido.");
    }
    
  } catch (error) {
    console.error("Error en la automatización SFL:", error);
    process.exit(1);
  }
}

async function saveData(data) {
  // Guardamos el JSON en la carpeta 'public' para que Astro lo sirva como un asset estático 
  const dirPath = path.join(process.cwd(), 'public', 'api');
  await fs.mkdir(dirPath, { recursive: true });
  
  const filePath = path.join(dirPath, 'sfl_data.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Datos guardados correctamente en: ${filePath}`);
}

updateSFLData();
