import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, "../src/content/data")
const JSON_FILE = path.resolve(__dirname, "../src/content/data/directory.json")

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
}

const TARGET_FILES = [
  { name: "0xL-links-ref.tsv", sponsored: true },
  { name: "0xL-links-noref.tsv", sponsored: false }
]

function processTsvFiles() {
  const result = []
  let processedCount = 0

  for (const target of TARGET_FILES) {
    const tsvPath = path.join(DATA_DIR, target.name)
    
    if (!fs.existsSync(tsvPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${target.name}. Se omitirá.`)
      continue
    }

    const content = fs.readFileSync(tsvPath, "utf-8")
    const lines = content.split(/\r?\n/).filter(Boolean)

    if (lines.length < 2) {
      console.warn(`⚠️ El archivo ${target.name} está vacío o no tiene suficientes datos. Se omitirá.`)
      continue
    }

    const headers = lines[0].split("\t").map(h => h.trim().toLowerCase())
    
    // Al buscar por nombre de columna, las columnas extra como 'palabras clave' o 'frase' 
    // simplemente son ignoradas porque no las buscamos aquí.
    const nameIdx = headers.indexOf("nombre")
    const catIdx = headers.indexOf("categoria")
    const tagsIdx = headers.indexOf("tags")
    const urlIdx = headers.indexOf("enlace")

    if (nameIdx === -1 || urlIdx === -1) {
      console.warn(`⚠️ El archivo ${target.name} debe tener al menos las columnas 'nombre' y 'enlace'. Se omitirá.`)
      continue
    }

    let count = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split("\t")
      const nombre = cols[nameIdx]?.trim()
      if (!nombre) continue

      const url = cols[urlIdx]?.trim() || ""
      const categoria = catIdx !== -1 ? cols[catIdx]?.trim() : ""
      const tagsStr = tagsIdx !== -1 ? cols[tagsIdx]?.trim() : ""

      const tagsArr = tagsStr
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const id = slugify(nombre)
      const isSponsored = target.sponsored

      result.push({
        id,
        name: nombre,
        url,
        category: categoria,
        tags: tagsArr,
        sponsored: isSponsored,
        logo: `/img/cripto/${id}.webp`,
        alt_logo: `Logo de ${nombre}`
      })
      count++
    }
    console.log(`📄 Archivo procesado: ${target.name} (${count} enlaces extraídos)`)
    processedCount++
  }

  if (processedCount === 0) {
    console.error("❌ No se encontró ninguno de los archivos TSV requeridos en: ", DATA_DIR)
    console.log("👉 Asegúrate de guardar '0xL-links-ref.tsv' o '0xL-links-noref.tsv'.")
    process.exit(1)
  }

  fs.writeFileSync(JSON_FILE, JSON.stringify(result, null, 2))
  console.log(`✅ ¡Éxito! ${result.length} enlaces totales guardados en directory.json.`)
}

processTsvFiles()
