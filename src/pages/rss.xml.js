import rss from "@astrojs/rss"
import { getBlogPostsByLang } from "../lib/content"

export async function GET(context) {
  // Obtenemos solo los artículos en español para el feed principal
  const posts = await getBlogPostsByLang("es")

  return rss({
    title: "0x Leñador | Blog",
    description: "Análisis y tutoriales sobre Layer 1, DeFi, inversiones y más.",
    site: context.site || "https://0xlenador.xyz",
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      // Construimos el enlace asumiendo la ruta base en español
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>es</language>`,
  })
}
