import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import icon from "astro-icon"
import rehypeExternalLinks from "rehype-external-links"
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

  // Redirects eliminados intencionalmente (2026-10-01):
  // En output estático (GitHub Pages), Astro genera redirects como páginas HTML
  // con meta-refresh + noindex (status 200), lo cual confunde a Google más que
  // un 404 limpio. Googlebot gastaba crawl budget rastreando 80+ páginas
  // meta-refresh en vez de indexar las páginas reales.
  // Referencia: diagnóstico de Search Console — 80 URLs en "No se ha encontrado (404)"
  // que en realidad devolvían 200 + noindex.
  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["nofollow", "noopener", "noreferrer"],
        },
      ],
    ],
  },
  integrations: [
    mdx(),
    icon(),
    sitemap({
      // Filtrar páginas que no deben estar en el sitemap:
      // - Páginas 404
      // - Páginas redirect legacy (simulador/, tesis/)
      // - Páginas legales (no aportan tráfico orgánico, diluyen calidad del sitemap)
      // - Páginas de autor (sin valor de búsqueda)
      filter: (page) => {
        const { pathname } = new URL(page)
        return (
          !pathname.includes("/404") &&
          !pathname.match(/^\/(simulador|tesis|design)\/$/) &&
          !pathname.match(/^\/(privacidad|terminos)\/$/) &&
          !pathname.match(/^\/en\/(privacy|terms)\/$/)
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
