/**
 * Cloudflare Worker para 0xLeñador
 * - Intercepta /api/sfl_data.json y /api/sfl_dashboard.json desde Cloudflare KV
 * - Ejecuta un Cron Trigger cada 15 min para consultar la API de Sunflower Land
 * - Para cualquier otra ruta, delega directamente a los archivos estáticos de Astro (ASSETS)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 1. Interceptar /api/sfl_data.json
    if (url.pathname === "/api/sfl_data.json") {
      const cached = await env.SFL_KV.get("sfl_data")
      if (cached) {
        return new Response(cached, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=60, s-maxage=120",
            "X-Data-Source": "cloudflare-kv",
          },
        })
      }
      // Fallback al archivo estático en dist si KV aún no se ha inicializado
      return env.ASSETS.fetch(request)
    }

    // 2. Interceptar /api/sfl_dashboard.json
    if (url.pathname === "/api/sfl_dashboard.json") {
      const cached = await env.SFL_KV.get("sfl_dashboard")
      if (cached) {
        return new Response(cached, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=60, s-maxage=120",
            "X-Data-Source": "cloudflare-kv",
          },
        })
      }
      return env.ASSETS.fetch(request)
    }

    // 3. Endpoint manual para forzar actualización inmediata (testing o webhook)
    if (url.pathname === "/api/admin/refresh-sfl") {
      const result = await refreshSflData(env)
      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    // 4. Todo lo demás lo sirve la CDN estática de Astro
    return env.ASSETS.fetch(request)
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshSflData(env))
  },
}

/**
 * Función que consulta Sunflower Land y actualiza los precios en Cloudflare KV
 */
async function refreshSflData(env) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; 0xLenadorBot/1.0)",
  }
  if (env.SFL_API_KEY) {
    headers["x-api-key"] = env.SFL_API_KEY
  }

  const results = {
    executedAt: new Date().toISOString(),
    dashboard: "pending",
    sfl_data: "pending",
  }

  // A. Actualizar Dashboard de Tendencias (sfl_dashboard)
  try {
    const trendsRes = await fetch("https://api.sunflower-land.com/marketplace/trends", { headers })
    if (trendsRes.ok) {
      const trendsData = await trendsRes.text()
      await env.SFL_KV.put("sfl_dashboard", trendsData)
      results.dashboard = "success"
    } else {
      results.dashboard = `error: status ${trendsRes.status}`
    }
  } catch (e) {
    results.dashboard = `error: ${e.message}`
  }

  // B. Actualizar Precios en Vivo (sfl_data)
  try {
    const liveRes = await fetch("https://api.sunflower-land.com/data?type=marketplaceActivity", {
      headers,
    })
    if (liveRes.ok) {
      const liveJson = await liveRes.json()
      const reports = liveJson?.data?.reports
      const flowerPrice = liveJson?.data?.flowerPrice

      if (reports) {
        const reportKeys = Object.keys(reports)
        if (reportKeys.length > 0) {
          const liveItems = reports[reportKeys[0]].items

          // Obtener base previa (de KV o del archivo estático base)
          let baseData = null
          const cached = await env.SFL_KV.get("sfl_data")
          if (cached) {
            try {
              baseData = JSON.parse(cached)
            } catch (_) {}
          }

          if (!baseData) {
            const assetRes = await env.ASSETS.fetch(
              new Request("https://0xlenador.xyz/api/sfl_data.json"),
            )
            if (assetRes.ok) {
              baseData = await assetRes.json()
            }
          }

          if (baseData && baseData.items) {
            baseData.lastUpdated = new Date().toISOString()
            if (flowerPrice) baseData.flowerPrice = flowerPrice

            if (liveItems) {
              for (const [key, item] of Object.entries(liveItems)) {
                if (baseData.items[key]) {
                  if (item.latestSale !== undefined && item.latestSale !== null) {
                    baseData.items[key].currentPrice = item.latestSale
                  }
                  if (item.volume !== undefined) {
                    baseData.items[key].volume24h = item.volume
                  }
                  if (item.trades !== undefined) {
                    baseData.items[key].trades24h = item.trades
                  }
                }
              }
            }

            await env.SFL_KV.put("sfl_data", JSON.stringify(baseData))
            results.sfl_data = "success"
          } else {
            results.sfl_data = "error: no se encontró baseData para fusionar"
          }
        }
      }
    } else {
      results.sfl_data = `error: status ${liveRes.status}`
    }
  } catch (e) {
    results.sfl_data = `error: ${e.message}`
  }

  return results
}
