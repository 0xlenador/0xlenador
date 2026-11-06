/**
 * Cloudflare Worker para 0xLeñador
 * - Intercepta /api/sfl_data.json y /api/sfl_dashboard.json desde Cloudflare KV
 * - Ejecuta un Cron Trigger cada 15 min para consultar la API de Sunflower Land
 * - Para cualquier otra ruta, delega directamente a los archivos estáticos de Astro (ASSETS)
 */

// Redirecciones 301 permanentes (migración WordPress / URLs legacy a Astro)
const REDIRECTS_301 = {
  "/que-es-polkadot": "/blog/que-es-polkadot/",
  "/que-es-ethereum-y-por-que-es-clave-en-el-futuro-digital": "/blog/que-es-ethereum-y-por-que-es-clave-en-el-futuro-digital/",
  "/que-es-blockchain-y-como-funciona-esta-tecnologia": "/blog/que-es-blockchain-y-como-funciona-esta-tecnologia/",
  "/satoshi-nakamoto-el-enigma-que-transformo-el-dinero-digital": "/blog/satoshi-nakamoto-el-enigma-que-transformo-el-dinero-digital/",
  "/que-es-defi-invierte-gana-rendimientos-y-recibe-airdrops": "/blog/que-es-defi-invierte-gana-rendimientos-y-recibe-airdrops/",
  "/que-es-solana-y-por-que-esta-revolucionando-el-mundo-cripto": "/blog/que-es-solana-y-por-que-esta-revolucionando-el-mundo-cripto/",
  "/faucets.html": "/faucets/",
  "/en/blog/ganarle-a-la-inflacion": "/en/blog/beating-inflation/",
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 0. Redirecciones 301 permanentes (legacy / WordPress a Astro)
    const normalizedPath =
      url.pathname.endsWith("/") && url.pathname.length > 1
        ? url.pathname.slice(0, -1)
        : url.pathname

    const targetRedirect = REDIRECTS_301[normalizedPath] || REDIRECTS_301[url.pathname]
    if (targetRedirect) {
      const targetUrl = new URL(targetRedirect, url.origin)
      targetUrl.search = url.search
      return Response.redirect(targetUrl.toString(), 301)
    }

    // 1. Interceptar /api/sfl_data.json
    if (url.pathname === "/api/sfl_data.json") {
      // Parámetro para forzar purga de caché bajo demanda (?purge=1)
      if (url.searchParams.get("purge") === "1") {
        await env.SFL_KV.delete("sfl_data")
        return env.ASSETS.fetch(request)
      }

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
      // Fallback al archivo estático en dist si KV aún no se ha inicializado o fue purgado
      return env.ASSETS.fetch(request)
    }

    // 2. Interceptar /api/sfl_dashboard.json
    if (url.pathname === "/api/sfl_dashboard.json") {
      if (url.searchParams.get("purge") === "1") {
        await env.SFL_KV.delete("sfl_dashboard")
        return env.ASSETS.fetch(request)
      }

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
      const purge = url.searchParams.get("purge") === "1"
      if (purge) {
        await env.SFL_KV.delete("sfl_data")
        await env.SFL_KV.delete("sfl_dashboard")
      }
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

  // Consultar el reporte de actividad de mercado (Community API oficial con x-api-key)
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
          const report = reports[reportKeys[0]]
          const liveItems = report.items
          const totals = report.totals

          // 1. Actualizar sfl_data.json en KV
          // Siempre cargar primero el archivo base desde ASSETS (dist/api/sfl_data.json)
          // Esto garantiza que cualquier ítem nuevo (recursos, coleccionables, wearables)
          // añadido al repositorio se integre automáticamente a la KV.
          let baseData = null
          try {
            const assetRes = await env.ASSETS.fetch(
              new Request("https://0xlenador.xyz/api/sfl_data.json"),
            )
            if (assetRes.ok) {
              baseData = await assetRes.json()
            }
          } catch (_) {}

          // Fallback a KV si ASSETS no responde
          if (!baseData) {
            const cachedData = await env.SFL_KV.get("sfl_data")
            if (cachedData) {
              try {
                baseData = JSON.parse(cachedData)
              } catch (_) {}
            }
          } else {
            // Si ASSETS cargó correctamente pero KV ya tenía cotizaciones previas,
            // conservar las métricas más recientes de KV para los ítems existentes
            const cachedData = await env.SFL_KV.get("sfl_data")
            if (cachedData) {
              try {
                const kvJson = JSON.parse(cachedData)
                if (kvJson?.items) {
                  for (const [key, kvItem] of Object.entries(kvJson.items)) {
                    if (baseData.items[key] && kvItem.currentPrice) {
                      baseData.items[key].currentPrice = kvItem.currentPrice
                      if (kvItem.volume24h !== undefined) baseData.items[key].volume24h = kvItem.volume24h
                      if (kvItem.trades24h !== undefined) baseData.items[key].trades24h = kvItem.trades24h
                    }
                  }
                }
              } catch (_) {}
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

          // 2. Actualizar sfl_dashboard.json en KV (volumen y trades oficiales)
          let baseDashboard = null
          try {
            const assetDashRes = await env.ASSETS.fetch(
              new Request("https://0xlenador.xyz/api/sfl_dashboard.json"),
            )
            if (assetDashRes.ok) {
              baseDashboard = await assetDashRes.json()
            }
          } catch (_) {}

          if (!baseDashboard) {
            const cachedDash = await env.SFL_KV.get("sfl_dashboard")
            if (cachedDash) {
              try {
                baseDashboard = JSON.parse(cachedDash)
              } catch (_) {}
            }
          }

          if (baseDashboard) {
            if (totals?.volume) baseDashboard.volume = totals.volume
            if (totals?.trades) baseDashboard.trades = totals.trades
            await env.SFL_KV.put("sfl_dashboard", JSON.stringify(baseDashboard))
            results.dashboard = "success (community-totals)"
          } else {
            results.dashboard = "skipped: base dashboard no disponible"
          }
        }
      }
    } else {
      results.sfl_data = `error: status ${liveRes.status}`
      results.dashboard = `skipped: api status ${liveRes.status}`
    }
  } catch (e) {
    results.sfl_data = `error: ${e.message}`
    results.dashboard = `error: ${e.message}`
  }

  return results
}
