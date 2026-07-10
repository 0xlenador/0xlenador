// ============================================================
// src/lib/content.ts
// Helpers para consultar Content Collections filtradas por idioma.
// Centraliza toda la lógica de filtrado i18n para blog y guías.
// ============================================================

import { getCollection } from "astro:content"
import type { Lang } from "../i18n/utils"
import getReadingTime from "reading-time"

/**
 * Calcula dinámicamente el tiempo de lectura usando el body del post/guía
 * y lo inyecta en la propiedad data.readTime.
 */
function attachReadingTime(item: any) {
  if (!item.data.readTime) {
    const text = item.body || ""
    const rt = getReadingTime(text)
    const minutes = Math.max(1, Math.ceil(rt.minutes))
    item.data.readTime = `${minutes} min`
  }
  return item
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

/**
 * Retorna los posts del blog filtrados por idioma.
 * El ID de cada post tiene el formato "es/slug" o "en/slug",
 * por lo que filtramos con startsWith(`${lang}/`).
 *
 * El campo `slug` en cada post retornado es el slug limpio SIN el prefijo de idioma,
 * que es lo que se usa para construir las URLs: /blog/ganarle-a-la-inflacion
 *
 * @example
 * const posts = await getBlogPostsByLang("es")
 * // posts[0].id   → "es/ganarle-a-la-inflacion"
 * // posts[0].slug → "ganarle-a-la-inflacion"
 */
export async function getBlogPostsByLang(lang: Lang) {
  const posts = await getCollection("blog")
  return posts
    .filter((post) => post.id.startsWith(`${lang}/`))
    .map((post) => ({
      ...post,
      slug: post.id.replace(`${lang}/`, ""),
    }))
    .map(attachReadingTime)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
}

/**
 * Retorna un único post por idioma y slug limpio.
 * Para usar en getStaticPaths de las rutas de artículo.
 *
 * @example
 * const post = await getBlogPostBySlug("es", "ganarle-a-la-inflacion")
 */
export async function getBlogPostBySlug(lang: Lang, slug: string) {
  const posts = await getBlogPostsByLang(lang)
  return posts.find((post) => post.slug === slug) ?? null
}

// ---------------------------------------------------------------------------
// Guías Operativas
// ---------------------------------------------------------------------------

/**
 * Retorna las guías filtradas por idioma, ordenadas por prioridad descendente.
 * El campo `slug` es el ID limpio sin el prefijo de idioma.
 *
 * @example
 * const guias = await getGuiasByLang("es")
 * // guias[0].id   → "es/polymarket"
 * // guias[0].slug → "polymarket"
 */
export async function getGuiasByLang(lang: Lang) {
  const guias = await getCollection("guias")
  return guias
    .filter((guia) => guia.id.startsWith(`${lang}/`))
    .map((guia) => ({
      ...guia,
      slug: guia.id.replace(`${lang}/`, ""),
    }))
    .map(attachReadingTime)
    .sort((a, b) => (b.data.prioridad ?? 0) - (a.data.prioridad ?? 0))
}

/**
 * Retorna una única guía por idioma y slug limpio.
 *
 * @example
 * const guia = await getGuiaBySlug("es", "polymarket")
 */
export async function getGuiaBySlug(lang: Lang, slug: string) {
  const guias = await getGuiasByLang(lang)
  return guias.find((guia) => guia.slug === slug) ?? null
}
