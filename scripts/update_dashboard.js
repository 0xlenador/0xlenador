import fs from "fs/promises"
import path from "path"

const JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg2QWU3MzNDYTM3ZTcxODZFNkM0M0VENGQ0MDM5Mzk4MUYwMjVDM2Y2IiwiZmFybUlkIjoyNzQ5NjA4NzU3OTEzMjg1LCJ1c2VyQWNjZXNzIjp7InZlcmlmaWVkIjp0cnVlfSwiaWF0IjoxNzg2NzYwMTg2LCJleHAiOjE3ODkzNTIxODZ9.4SkPl6dOBS7ptKaWF7PVJy4lYcPLubDqNWDCCLxfWpE"

async function updateDashboardData() {
  console.log("Iniciando obtención de datos del Dashboard SFL (Trends)...")
  
  try {
    const url = "https://api.sunflower-land.com/marketplace/trends"
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Authorization": JWT_TOKEN
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Validar que la data tenga las llaves esperadas
    if (!data.volume || !data.topTrades) {
      throw new Error("La API respondió pero el JSON no contiene los datos esperados de trends.")
    }
    
    const savePath = path.join(process.cwd(), "public", "api", "sfl_dashboard.json")
    await fs.writeFile(savePath, JSON.stringify(data, null, 2), "utf8")
    
    console.log(`✅ Datos de Dashboard guardados exitosamente en ${savePath}`)
    console.log(`Resumen: ${data.topTrades.length} Whale Traders, Vol: ${data.volume}`)
    
  } catch (e) {
    console.error("❌ Error actualizando datos del dashboard:", e.message)
  }
}

updateDashboardData()
