import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import { remarkReadingTime } from "./remark-reading-time.mjs"
import { unified } from "@astrojs/markdown-remark"

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://0xlenador.xyz",
  base: "/",

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
    // Activos: movidos de la raíz a /activos/ para evitar el efecto catch-all.
    // Los redirects 301 aseguran que los enlaces externos y el SEO se preserven.
    "/bitcoin": "/activos/bitcoin",
    "/ethereum": "/activos/ethereum",
    "/sunflowerland": "/activos/sunflowerland",
  },
  integrations: [
    mdx(),
    sitemap({
      // Incluir ambos idiomas en el sitemap para SEO bilingüe.
      // Astro genera automáticamente las URLs /en/... junto con las ES.
      i18n: {
        defaultLocale: "es",
        locales: {
          es: "es-CO",
          en: "en-US",
        },
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
    }),
  },
})
