import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import { getAlternateUrl } from "./src/i18n/utils.ts"
import { buildBlogSlugMap, buildGuiasSlugMap } from "./src/lib/sitemapHelpers.mjs"

// ─── Mapas de slugs traducidos (cargados en build-time, costo cero en runtime) ─
// Estructura: { "es/ganarle-a-la-inflacion": "en/beating-inflation", ... }
const blogSlugMap = buildBlogSlugMap()
const guiasSlugMap = buildGuiasSlugMap()

// Garantiza trailing slash en cualquier URL (Astro genera /ruta/ siempre)
const ts = (path) => (path === "/" || path.endsWith("/") ? path : path + "/")

/**
 * Dada una URL de blog (ej. /blog/ganarle-a-la-inflacion/) o de operaciones,
 * devuelve las URLs traducidas usando el mapa de slugs.
 * Retorna null si no es una ruta de blog/operaciones dinámica.
 */
function getTranslatedDynamicUrl(pathname) {
  // Blog posts ES: /blog/{slug}/ → /en/blog/{enSlug}/
  const esBlogMatch = pathname.match(/^\/blog\/([^/]+)\/$/)
  if (esBlogMatch) {
    const esKey = `es/${esBlogMatch[1]}`
    const enEntry = blogSlugMap[esKey]
    if (enEntry) {
      const [, enSlug] = enEntry.split("/")
      return {
        es: `/blog/${esBlogMatch[1]}/`,
        en: `/en/blog/${enSlug}/`,
      }
    }
    // Sin translationSlug: apuntar al mismo slug en EN (fallback)
    return { es: pathname, en: `/en/blog/${esBlogMatch[1]}/` }
  }

  // Blog posts EN: /en/blog/{slug}/ → /blog/{esSlug}/
  const enBlogMatch = pathname.match(/^\/en\/blog\/([^/]+)\/$/)
  if (enBlogMatch) {
    const enKey = `en/${enBlogMatch[1]}`
    const esEntry = blogSlugMap[enKey]
    if (esEntry) {
      const [, esSlug] = esEntry.split("/")
      return {
        es: `/blog/${esSlug}/`,
        en: `/en/blog/${enBlogMatch[1]}/`,
      }
    }
    return { es: `/blog/${enBlogMatch[1]}/`, en: pathname }
  }

  // Operaciones ES: /operaciones/{slug}/ → /en/operations/{enSlug}/
  const esOpsMatch = pathname.match(/^\/operaciones\/([^/]+)\/$/)
  if (esOpsMatch) {
    const esKey = `es/${esOpsMatch[1]}`
    const enEntry = guiasSlugMap[esKey]
    const [, enSlug] = enEntry ? enEntry.split("/") : ["en", esOpsMatch[1]]
    return {
      es: `/operaciones/${esOpsMatch[1]}/`,
      en: `/en/operations/${enSlug}/`,
    }
  }

  // Operaciones EN: /en/operations/{slug}/ → /operaciones/{esSlug}/
  const enOpsMatch = pathname.match(/^\/en\/operations\/([^/]+)\/$/)
  if (enOpsMatch) {
    const enKey = `en/${enOpsMatch[1]}`
    const esEntry = guiasSlugMap[enKey]
    const [, esSlug] = esEntry ? esEntry.split("/") : ["es", enOpsMatch[1]]
    return {
      es: `/operaciones/${esSlug}/`,
      en: `/en/operations/${enOpsMatch[1]}/`,
    }
  }

  return null
}

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://0xlenador.xyz",
  base: "/",
  trailingSlash: "ignore",

  // ─── Internacionalización (i18n) ────────────────────────────────────────
  // Español = idioma default (sin prefijo de URL)
  // Inglés  = bajo el prefijo /en/
  // Compatible con output estático de GitHub Pages sin configuración extra.
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      // prefixDefaultLocale: false → / = español, /en/ = inglés
      // Mantiene todas las URLs actuales intactas (SEO preservado).
      prefixDefaultLocale: false,
    },
  },

  redirects: {
    // /tesis migrada como artículo del blog (301 = Moved Permanently, preserva SEO)
    "/tesis": "/blog/tesis-de-inversion",
    "/simulador": "/riskfolio",
    "/tweets": "/contenido-social/",
    "/en/tweets": "/en/social-content/",
    // Activos: movidos de la raíz a /activos/ para evitar el efecto catch-all.
    // Los redirects 301 aseguran que los enlaces externos y el SEO se preserven.
    "/bitcoin": "/activos/bitcoin",
    "/ethereum": "/activos/ethereum",
    "/sunflowerland": "/activos/sunflowerland/",
    "/hyperliquid": "/activos/hyperliquid/",

    // Redirecciones SEO de artículos de WordPress al blog en español
    "/que-es-polkadot": "/blog/",
    "/que-es-una-wallet-de-criptomonedas-y-como-funciona-realmente": "/blog/",
    "/que-son-las-acciones-tokenizadas": "/blog/",
    "/que-es-ethereum-y-por-que-es-clave-en-el-futuro-digital": "/blog/",
    "/que-son-los-nfts": "/blog/",
    "/que-es-blockchain-y-como-funciona-esta-tecnologia": "/blog/",
    "/que-es-una-altcoin-y-por-que-deberias-entenderlo-hoy": "/blog/",
    "/satoshi-nakamoto-el-enigma-que-transformo-el-dinero-digital": "/blog/",
    "/que-es-defi-invierte-gana-rendimientos-y-recibe-airdrops": "/blog/",
    "/que-es-solana-y-por-que-esta-revolucionando-el-mundo-cripto": "/blog/",
    "/inteligencia-artificial-en-criptomonedas": "/blog/",
    "/que-es-un-metaverso-mas-alla-de-lo-digital": "/blog/",
    "/stablecoins-guia-completa-criptomonedas-estables": "/blog/",
    "/que-es-un-airdrop-de-criptomonedas": "/blog/",
    "/que-es-una-memecoin-o-criptomoneda-meme": "/blog/",
    "/que-son-los-real-world-assets-rwa": "/blog/",

    // Redirecciones específicas de airdropdegen a Hyperliquid
    "/airdropdegen/hyperpie": "/activos/hyperliquid/",
    "/airdropdegen/hypurrfi": "/activos/hyperliquid/",
    "/airdropdegen/hyperlend": "/activos/hyperliquid/",
    "/airdropdegen/kite-ai": "/activos/hyperliquid/",

    // Redirecciones del resto de airdropdegen a la sección de activos
    "/airdropdegen/dawn": "/activos/",
    "/airdropdegen/gte": "/activos/",
    "/airdropdegen/valhalla": "/activos/",
    "/airdropdegen/backpack": "/activos/",
    "/airdropdegen/succinct": "/activos/",
    "/airdropdegen/meta-toy-dragonz-saga": "/activos/",
    "/airdropdegen/cess": "/activos/",
    "/airdropdegen/li-fi": "/activos/",
    "/airdropdegen/oro-ai": "/activos/",
    "/airdropdegen/opengradient": "/activos/",
    "/airdropdegen/farcaster": "/activos/",
    "/airdropdegen/towns": "/activos/",
    "/airdropdegen/mythos": "/activos/",
    "/airdropdegen/paradex": "/activos/",
    "/airdropdegen/dscvr": "/activos/",
    "/airdropdegen/pluralis-research": "/activos/",
    "/airdropdegen/arichain": "/activos/",
    "/airdropdegen/binance": "/activos/",
    "/airdropdegen/allo": "/activos/",
    "/airdropdegen/teko": "/activos/",
    "/airdropdegen/kaia": "/activos/",
    "/airdropdegen/bybit": "/activos/",
    "/airdropdegen/jupiter": "/activos/",
    "/airdropdegen/sophon": "/activos/",
    "/airdropdegen/beamable": "/activos/",
    "/airdropdegen/lumiterra": "/activos/",
    "/airdropdegen/kiichain": "/activos/",
    "/airdropdegen/somnia-network": "/activos/",
    "/airdropdegen/bronto": "/activos/",
    "/airdropdegen/bless": "/activos/",
    "/airdropdegen/awe": "/activos/",
    "/airdropdegen/fragmetric": "/activos/",
    "/airdropdegen/gradient": "/activos/",
    "/airdropdegen/humanity-protocol": "/activos/",
    "/airdropdegen/laminar": "/activos/",
    "/airdropdegen/resolv": "/activos/",
    "/airdropdegen/lighter": "/activos/",
    "/airdropdegen/immutable": "/activos/",
    "/airdropdegen/zeeverse": "/activos/",
    "/airdropdegen/metamask": "/activos/",
    "/airdropdegen/dexari": "/activos/",
    "/airdropdegen/sleepagotchi": "/activos/",
    "/airdropdegen/grass": "/activos/",

    // Redirecciones de páginas generales y recursos
    "/en/blog/ganarle-a-la-inflacion": "/blog/ganarle-a-la-inflacion/",
    "/all-airdrops": "/activos/",
    "/check-airdrops": "/activos/",
    "/recursos": "/herramientas/",
    "/data-perps": "/",
    "/faucets.html": "/faucets/",
    "/comunidad": "/",

    // Redirecciones de miniapps al home
    "/miniapps": "/",
    "/miniapps/cosmic-bomber": "/",
    "/miniapps/blum": "/",
    "/miniapps/captain-tsubasa-rivals": "/",
    "/miniapps/fameverse": "/",
    "/miniapps/evaa-protocol": "/",
    "/miniapps/puparty": "/",
    "/miniapps/bombie": "/",
    "/miniapps/slime-miner": "/",
    "/miniapps/elderglade": "/",
    "/miniapps/billionzombies": "/",
  },
  integrations: [
    mdx(),
    sitemap({
      // Filtrar páginas que no deben estar en el sitemap:
      // - Páginas 404
      // - Páginas redirect legacy (bitcoin/, ethereum/, sunflowerland/, simulador/, tesis/)
      // - Páginas legales (no aportan tráfico orgánico, diluyen calidad del sitemap)
      // - Páginas de autor (sin valor de búsqueda)
      filter: (page) => {
        const { pathname } = new URL(page)
        return (
          !pathname.includes("/404") &&
          !pathname.match(/^\/(bitcoin|ethereum|sunflowerland|simulador|tesis)\/$/) &&
          !pathname.match(/^\/(privacidad|terminos)\/$/) &&
          !pathname.match(/^\/en\/(privacy|terms)\/$/) &&
          !pathname.match(/^\/(autor)\/$/) &&
          !pathname.match(/^\/en\/(author)\/$/)
        )
      },

      serialize(item) {
        const urlObj = new URL(item.url)
        const pathname = urlObj.pathname

        // 1. Intentar resolución específica para rutas dinámicas (blog, operaciones)
        //    que tienen slugs distintos entre idiomas.
        const dynamic = getTranslatedDynamicUrl(pathname)

        let esPath, enPath

        if (dynamic) {
          esPath = dynamic.es
          enPath = dynamic.en
        } else {
          // 2. Fallback: usar getAlternateUrl para rutas estáticas del routeMap
          esPath = ts(getAlternateUrl(urlObj, "es"))
          enPath = ts(getAlternateUrl(urlObj, "en"))
        }

        // Construir hreflang con URLs absolutas y trailing slash garantizado
        item.links = [
          { lang: "es", url: new URL(ts(esPath), urlObj.origin).href },
          { lang: "en", url: new URL(ts(enPath), urlObj.origin).href },
          { lang: "x-default", url: new URL(ts(esPath), urlObj.origin).href },
        ]

        return item
      },
    }),
  ],
})
