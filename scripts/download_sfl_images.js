import fs from 'fs/promises';
import path from 'path';

async function downloadImages() {
  try {
    const idsPath = path.join(process.cwd(), 'src', 'data', 'sfl_ids.json');
    const idsContent = await fs.readFile(idsPath, 'utf8');
    const idsObj = JSON.parse(idsContent);

    const destDir = path.join(process.cwd(), 'public', 'img', 'sunflowerland');
    await fs.mkdir(destDir, { recursive: true });

    const names = Object.values(idsObj);
    console.log(`Descargando ${names.length} imágenes...`);

    let downloaded = 0;
    for (const name of names) {
      // Reemplazar espacios para nombres como "Merino Wool"
      const urlName = encodeURIComponent(name);
      const url = `https://www.sfl.world/img/source/${urlName}.png`;
      const filePath = path.join(destDir, `${name}.png`);

      // Solo descargar si no existe
      try {
        await fs.access(filePath);
        // console.log(`Omitiendo ${name}.png (ya existe)`);
      } catch {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            await fs.writeFile(filePath, buffer);
            console.log(`✅ Descargado: ${name}.png`);
            downloaded++;
          } else {
            console.log(`⚠️ No encontrado: ${url}`);
          }
        } catch (e) {
          console.log(`❌ Error descargando ${name}: ${e.message}`);
        }
      }
    }
    
    console.log(`¡Proceso completado! Se descargaron ${downloaded} imágenes nuevas.`);
  } catch (error) {
    console.error('Error crítico:', error);
  }
}

downloadImages();
