// ============================================================
// src/lib/sitemapHelpers.mjs
// Helpers para el sitemap: lee los frontmatter de blog y guías
// para construir mapas de slugs traducidos (es ↔ en).
// Compatible con astro.config.mjs (Node.js ESM, no Astro runtime).
// ============================================================

import fs from "fs"
import path from "path"

/**
 * Lee el frontmatter YAML de un archivo .md o .mdx de forma simple.
 * Solo extrae los campos necesarios para SEO: translationSlug.
 * No dependemos de librerías externas para mantenerlo liviano.
 */
function parseFrontmatterField(content, field) {
  const regex = new RegExp(`^${field}:\\s*["']?([^"'\\n]+)["']?`, "m")
  const match = content.match(regex)
  return match ? match[1].trim() : null
}

/**
 * Construye el mapa de slugs traducidos del blog.
 * Retorna: { "es/ganarle-a-la-inflacion": "en/beating-inflation", ... }
 *
 * Utilizado en el sitemap serializer para generar hreflang correctos
 * cuando los slugs difieren entre idiomas.
 */
export function buildBlogSlugMap() {
  const blogDir = path.resolve("./src/content/blog")
  const map = {}

  for (const lang of ["es", "en"]) {
    const langDir = path.join(blogDir, lang)
    if (!fs.existsSync(langDir)) continue

    for (const slug of fs.readdirSync(langDir)) {
      const indexFile = path.join(langDir, slug, "index.md")
      if (!fs.existsSync(indexFile)) continue

      const content = fs.readFileSync(indexFile, "utf-8")
      const translationSlug = parseFrontmatterField(content, "translationSlug")

      if (translationSlug) {
        const otherLang = lang === "es" ? "en" : "es"
        map[`${lang}/${slug}`] = `${otherLang}/${translationSlug}`
      }
    }
  }

  return map
}

/**
 * Construye el mapa de slugs traducidos de las guías/operaciones.
 * Retorna: { "es/polymarket": "en/polymarket", ... }
 *
 * En la mayoría de casos las guías usan el mismo slug en ambos idiomas,
 * pero soportamos translationSlug por si cambian en el futuro.
 */
export function buildGuiasSlugMap() {
  const guiasDir = path.resolve("./src/content/guias")
  const map = {}

  for (const lang of ["es", "en"]) {
    const langDir = path.join(guiasDir, lang)
    if (!fs.existsSync(langDir)) continue

    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith(".mdx")) continue
      const slug = file.replace(".mdx", "")
      const filePath = path.join(langDir, file)
      const content = fs.readFileSync(filePath, "utf-8")
      const translationSlug = parseFrontmatterField(content, "translationSlug")
      const otherLang = lang === "es" ? "en" : "es"

      map[`${lang}/${slug}`] = `${otherLang}/${translationSlug || slug}`
    }
  }

  return map
}
