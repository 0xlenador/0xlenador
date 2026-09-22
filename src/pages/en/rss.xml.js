import rss from "@astrojs/rss"
import { getBlogPostsByLang } from "../../lib/content"

export async function GET(context) {
  // Obtenemos solo los artículos en inglés
  const posts = await getBlogPostsByLang("en")

  return rss({
    title: "0x Leñador | Blog (English)",
    description: "Analysis and tutorials on Layer 1, DeFi, investing and more.",
    site: context.site || "https://0xlenador.xyz",
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      // Construimos el enlace asumiendo la ruta base en inglés
      link: `/en/blog/${post.slug}/`,
    })),
    customData: `<language>en</language>`,
  })
}
