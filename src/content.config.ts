import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders" // Requerido en Astro v6

const blog = defineCollection({
  // Estructura i18n: src/content/blog/{lang}/{slug}/index.md
  // generateId emite "es/ganarle-a-la-inflacion" o "en/beating-inflation"
  // permitiendo filtrar por idioma con: post.id.startsWith("es/")
  loader: glob({
    pattern: "**/index.md",
    base: "./src/content/blog",
    generateId: ({ entry }: { entry: string }) => entry.replace(/\/index\.md$/, ""),
  }),
  schema: ({ image: img }) =>
    z.object({
      title: z.string(), // manual
      description: z.string(), // manual
      category: z.string().default("Investigación"), // manual
      date: z.coerce.string(), // manual
      updatedDate: z.coerce.string().optional(), // manual
      author: z.string().default("0x Leñador"), // manual
      layout: z.string().optional(), // manual
      readTime: z.string().optional(), // automático (calculado por src/lib/content.ts si no lo pones)
      draft: z.boolean().optional().default(false), // manual
      coverImage: img().optional(), // manual
      coverAlt: z.string().optional(), // manual
      translationSlug: z.string().optional(), // manual
      faq: z // manual
        .array(
          z.object({
            pregunta: z.string(),
            respuesta: z.string(),
          })
        )
        .optional(),
    }),
})

const guias = defineCollection({
  // Estructura i18n: src/content/guias/{lang}/{slug}.mdx
  // generateId emite "es/polymarket" o "en/polymarket"
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/guias" }),
  schema: z.object({
    title: z.string(), // manual
    description: z.string(), // manual
    categoria: z.enum(["Airdrop", "DeFi", "Gaming", "Trading", "Mixta", "Predicciones", "Perpetuos", "L1", "L2"]), // manual
    estado: z.enum(["activa", "completada", "expirada"]).default("activa"), // manual
    temporada: z.string().optional(), // manual
    fechaLimite: z.coerce.string().optional(), // manual
    plataforma: z.string(), // manual
    imagen: z.string().optional(), // manual
    ogImage: z.string().optional(), // manual
    tags: z.array(z.string()).default([]), // manual
    dificultad: z.enum(["baja", "media", "alta"]).default("media"), // manual
    tiempoEstimado: z.string().optional(), // manual
    date: z.coerce.string(), // manual
    updatedDate: z.coerce.string().optional(), // manual
    author: z.string().default("0x Leñador"), // manual
    readTime: z.string().optional(), // automático (calculado por src/lib/content.ts)
    prioridad: z.number().default(0), // manual
    // Slug de la guía hermana en el otro idioma para hreflang cruzado.
    translationSlug: z.string().optional(), // manual
  }),
})

// ---------------------------------------------------------------------------
// Data Collections — Watchlist de Activos
// Loader: JSON directo. Schema: gradual (se refinará en Fase 5 con tipos strict).
// ---------------------------------------------------------------------------
const i18nString = z.object({
  es: z.string(),
  en: z.string(),
})
const i18nStringArray = z.object({
  es: z.array(z.string()),
  en: z.array(z.string()),
})
const stringOrI18n = z.union([z.string(), i18nString])

const watchlist = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/data/watchlist" }),
  schema: z.object({
    id: z.string(),
    ticker: z.string(),
    name: z.string(),
    type: z.string(),
    accentColor: z.string(),
    pageUrl: z.string(),
    image: z.string(),
    imageAlt: z.string().optional(),
    officialUrl: z.string().optional(),
    seo: z.object({
      title: i18nString,
      description: i18nString,
      keywords: i18nString,
      ogImage: z.string(),
    }),
    price: z
      .object({
        apiUrl: z.string(),
        apiPath: z.string(),
      })
      .optional(),
    definicion: i18nString,
    genesis: z
      .object({
        fechaInicio: z.string().optional(),
        creador: z.string().optional(),
        whitepaperUrl: z.string().optional(),
        descripcion: z.string().optional(),
        contrato: z.string().optional(),
      })
      .optional(),
    matematica: z.record(z.string(), stringOrI18n).optional(),
    arquitectura: z.array(z.object({ label: stringOrI18n, value: stringOrI18n })).optional(),
    floatingTags: i18nStringArray.optional(),
    datoOculto: z
      .object({
        teaser: i18nString,
        contenido: i18nStringArray,
      })
      .optional(),
    analisisCaracter: i18nString.optional(),
    tooling: z.record(z.string(), z.array(z.string())).optional(),
    investigacion: z
      .object({
        titulo: i18nString,
        subtitulo: i18nString,
        pilares: z.array(
          z.object({
            titulo: i18nString,
            secciones: z.array(
              z.object({
                subtitulo: i18nString,
                contenido: i18nString,
                lista: i18nStringArray.optional(),
                listaDetallada: z
                  .array(
                    z.object({
                      titulo: i18nString,
                      texto: i18nString,
                    }),
                  )
                  .optional(),
                tabla: z
                  .object({
                    headers: i18nStringArray,
                    highlightCol: z.number().optional(),
                    rows: z.object({
                      es: z.array(z.array(z.string())),
                      en: z.array(z.array(z.string())),
                    }),
                    rowColors: z.array(z.array(z.string())).optional(),
                  })
                  .optional(),
                riskCards: z
                  .array(
                    z.object({
                      titulo: i18nString,
                      texto: i18nString,
                    }),
                  )
                  .optional(),
                riskNote: i18nString.optional(),
                correlationTags: z
                  .array(
                    z.object({
                      label: i18nString,
                      value: i18nString,
                    }),
                  )
                  .optional(),
              }),
            ),
          }),
        ),
      })
      .optional(),
    faq: z
      .object({
        titulo: i18nString,
        subtitulo: i18nString,
        startId: z.number(),
        items: z.array(
          z.object({
            pregunta: i18nString,
            respuesta: i18nString,
          }),
        ),
      })
      .optional(),
    recursosRelacionados: z.array(z.any()).optional(),
    schemaFaq: z
      .array(
        z.object({
          pregunta: i18nString,
          respuesta: i18nString,
        }),
      )
      .optional(),
  }),
})

// ---------------------------------------------------------------------------
// Data Collections — SFL (Sunflower Land)
// Archivos: pets.json, recipes.json, resources.json, powerups.json
// Sin i18n por ahora — datos en español, se internacionalizarán en el futuro.
// ---------------------------------------------------------------------------
const sfl = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/data/sfl" }),
  // Schema permisivo: los JSON tienen arrays de objetos con forma heterogénea.
  // Se tipará de forma estricta cuando se defina el contrato de datos SFL.
  schema: z.record(z.any()),
})

export const collections = { blog, guias, watchlist, sfl }
