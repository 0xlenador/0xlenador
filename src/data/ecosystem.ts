// ============================================================
// src/data/ecosystem.ts
// Catálogo Unificado y Dinámico del Ecosistema 0xLeñador
// Combina herramientas de software interactivas con las
// Content Collections dinámicas de Astro (blog, guías, watchlist).
// ============================================================

import { getCollection } from "astro:content"
import { getBlogPostsByLang, getGuiasByLang } from "../lib/content"
import type { Lang } from "../i18n/ui"

export type EcosystemCategory = "herramientas" | "activos" | "guias" | "directorio" | "blog"

export interface EcosystemCatalogItem {
  id: string
  name: string
  description: string
  url: string
  category: EcosystemCategory
  categoryLabel: string
  ecosystem: string
  ecosystemLabel: string
  tags: string[]
  icon?: string
  iconName?: string
  featured?: boolean
  inDirectoryTable?: boolean
}

// ------------------------------------------------------------
// 1. Catálogo Base de Herramientas de Software y Recursos Hub
// (Páginas interactivas .astro que no son colecciones Markdown)
// ------------------------------------------------------------
interface BaseSoftwareTool {
  id: string
  name: { es: string; en: string }
  description: { es: string; en: string }
  url: { es: string; en: string }
  category: EcosystemCategory
  categoryLabel: { es: string; en: string }
  ecosystem: string
  ecosystemLabel: { es: string; en: string }
  tags: string[]
  icon?: string
  iconName?: string
  featured?: boolean
  inDirectoryTable?: boolean
}

const baseSoftwareTools: BaseSoftwareTool[] = [
  // --- HERRAMIENTAS INTERACTIVAS (Flagships & Utilities) ---
  {
    id: "sfl-mercado",
    name: { es: "SFL Mercado P2P", en: "SFL P2P Market" },
    description: {
      es: "Calculadora de comisiones, precios en tiempo real y arbitraje P2P para Sunflower Land.",
      en: "Fee calculator, real-time prices, and P2P arbitrage for Sunflower Land.",
    },
    url: { es: "/sfl-mercado/", en: "/en/sfl-market/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "calculator",
      "sfl",
      "mercado",
      "p2p",
      "arbitraje",
      "precios",
      "comisiones",
      "trading",
      "juegos",
      "gaming",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/123/exchange.png",
    featured: true,
    inDirectoryTable: true,
  },
  {
    id: "sfl-cocinando",
    name: { es: "SFL Cocinando", en: "SFL Cooking" },
    description: {
      es: "Calculadora de rentabilidad, XP y consumo de ingredientes para recetas en Sunflower Land.",
      en: "Profitability, XP, and ingredient consumption calculator for recipes in Sunflower Land.",
    },
    url: { es: "/sfl-cocinando/", en: "/en/sfl-cooking/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "calculator",
      "sfl",
      "cocinando",
      "cooking",
      "recetas",
      "comida",
      "food",
      "xp",
      "juegos",
      "gaming",
      "crafting",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/food/Pizza%20Margherita.png",
    featured: true,
    inDirectoryTable: true,
  },
  {
    id: "intrinseco",
    name: { es: "Valor Intrínseco", en: "Intrinsic Value" },
    description: {
      es: "Calculadora de valoración fundamental por flujos de caja y múltiplos para acciones y activos.",
      en: "Fundamental valuation calculator via cash flows and multiples for stocks and assets.",
    },
    url: { es: "/intrinseco/", en: "/en/intrinsic/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "general",
    ecosystemLabel: { es: "TradFi / Análisis", en: "TradFi / Analysis" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "calculator",
      "intrinseco",
      "valor",
      "dcf",
      "valuacion",
      "acciones",
      "stocks",
      "flujos",
      "warren buffett",
      "finanzas",
      "tradfi",
      "inversion",
    ],
    iconName: "lucide:calculator",
    featured: true,
    inDirectoryTable: true,
  },
  {
    id: "riskfolio",
    name: { es: "Riskfolio", en: "Riskfolio" },
    description: {
      es: "Optimizador cuantitativo de carteras con paridad de riesgo y frontera eficiente.",
      en: "Quantitative portfolio optimizer with risk parity and efficient frontier.",
    },
    url: { es: "/riskfolio/", en: "/en/riskfolio/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "general",
    ecosystemLabel: { es: "Cuantitativo / Riesgo", en: "Quantitative / Risk" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "calculator",
      "riskfolio",
      "cartera",
      "portafolio",
      "riesgo",
      "markowitz",
      "optimizacion",
      "sharpe",
      "cuantitativo",
      "finanzas",
    ],
    iconName: "lucide:pie-chart",
    featured: false,
    inDirectoryTable: true,
  },
  {
    id: "sfl-mascotas",
    name: { es: "SFL Mascotas", en: "SFL Pets" },
    description: {
      es: "Simulador de afinidad, recompensas y comida requerida para tus mascotas en Sunflower Land.",
      en: "Affinity, reward, and required food simulator for your pets in Sunflower Land.",
    },
    url: { es: "/sfl-mascotas/", en: "/en/sfl-pets/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "sfl",
      "mascotas",
      "pets",
      "afinidad",
      "comida",
      "simulador",
      "juegos",
      "gaming",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/123/ramsey.webp",
    inDirectoryTable: true,
  },
  {
    id: "sfl-betty",
    name: { es: "SFL Betty Home", en: "SFL Betty Home" },
    description: {
      es: "Planificador de pedidos diarios de Betty y optimización de entrega de cultivos.",
      en: "Daily Betty order planner and crop delivery optimization.",
    },
    url: { es: "/sfl-betty/", en: "/en/sfl-betty/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "sfl",
      "betty",
      "pedidos",
      "entregas",
      "cultivos",
      "monedas",
      "juegos",
      "gaming",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/123/coins.png",
    inDirectoryTable: true,
  },
  {
    id: "sfl-cueva",
    name: { es: "SFL Cueva de la Isla", en: "SFL Desert Island Cave" },
    description: {
      es: "Calculadora de recursos necesarios, mineral de hierro y recompensas en la cueva.",
      en: "Calculator for resources, iron ore, and rewards in the desert cave.",
    },
    url: { es: "/sfl-cueva/", en: "/en/sfl-cave/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "calculadora",
      "sfl",
      "cueva",
      "isla",
      "desierto",
      "recursos",
      "hierro",
      "juegos",
      "gaming",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/tools/sand_shovel.png",
    inDirectoryTable: true,
  },
  {
    id: "fishing",
    name: { es: "SFL Pesca", en: "SFL Fishing" },
    description: {
      es: "Guía y optimizador de cebos, mareas y captura de peces en Sunflower Land.",
      en: "Bait, tide, and fish catch optimizer for Sunflower Land.",
    },
    url: { es: "/fishing/", en: "/en/fishing/" },
    category: "herramientas",
    categoryLabel: { es: "Herramientas", en: "Tools" },
    ecosystem: "sunflowerland",
    ecosystemLabel: { es: "Sunflower Land", en: "Sunflower Land" },
    tags: [
      "herramienta",
      "herramientas",
      "tool",
      "tools",
      "sfl",
      "pesca",
      "fishing",
      "cebos",
      "peces",
      "chum",
      "juegos",
      "gaming",
      "sunflower land",
    ],
    icon: "/img/sunflowerland/fish/Anchovy.png",
    inDirectoryTable: true,
  },

  // --- DIRECTORIO & RECURSOS HUB ---
  {
    id: "faucets",
    name: { es: "Directorio Faucets", en: "Faucets Directory" },
    description: {
      es: "Directorio curado de grifos para reclamar tokens de prueba (testnet) y redes principales (mainnet).",
      en: "Curated directory of faucets to claim testnet and mainnet tokens.",
    },
    url: { es: "/faucets/", en: "/en/faucets/" },
    category: "directorio",
    categoryLabel: { es: "Directorio", en: "Directory" },
    ecosystem: "general",
    ecosystemLabel: { es: "General / Dev", en: "General / Dev" },
    tags: [
      "directorio",
      "directory",
      "recursos",
      "faucets",
      "grifos",
      "tokens",
      "testnet",
      "mainnet",
      "gas",
      "desarrollo",
      "gratis",
      "free",
      "sepolia",
    ],
    iconName: "lucide:droplet",
    featured: true,
    inDirectoryTable: true,
  },
  {
    id: "lista-web3",
    name: { es: "Recursos Web3", en: "Web3 Resources" },
    description: {
      es: "Colección curada de exchanges, puentes (bridges), exploradores y herramientas útiles.",
      en: "Curated collection of exchanges, bridges, explorers, and tools.",
    },
    url: { es: "/lista-web3/", en: "/en/web3-list/" },
    category: "directorio",
    categoryLabel: { es: "Directorio", en: "Directory" },
    ecosystem: "general",
    ecosystemLabel: { es: "General / Web3", en: "General / Web3" },
    tags: [
      "directorio",
      "directory",
      "recursos",
      "web3",
      "exchanges",
      "puentes",
      "bridges",
      "exploradores",
      "herramientas",
      "stack",
    ],
    iconName: "lucide:globe",
    featured: true,
    inDirectoryTable: true,
  },
  {
    id: "infravalorados",
    name: { es: "Activos Infravalorados", en: "Undervalued Assets" },
    description: {
      es: "Explorador de oportunidades y tokens cotizando por debajo de su valor fundamental.",
      en: "Explorer of opportunities and tokens trading below fair value.",
    },
    url: { es: "/infravalorados/", en: "/en/undervalued/" },
    category: "directorio",
    categoryLabel: { es: "Directorio", en: "Directory" },
    ecosystem: "general",
    ecosystemLabel: { es: "General / Trading", en: "General / Trading" },
    tags: [
      "directorio",
      "directory",
      "infravalorados",
      "undervalued",
      "tokens",
      "analisis",
      "gemas",
      "oportunidades",
      "metricas",
      "precio",
    ],
    iconName: "lucide:gem",
    inDirectoryTable: true,
  },
  {
    id: "contenido-social",
    name: { es: "Contenido Social", en: "Social Content" },
    description: {
      es: "Feed de nuestra actividad, videos y análisis en YouTube y X.",
      en: "Feed of our activity, videos, and analysis on YouTube and X.",
    },
    url: { es: "/contenido-social/", en: "/en/social-content/" },
    category: "directorio",
    categoryLabel: { es: "Directorio", en: "Directory" },
    ecosystem: "general",
    ecosystemLabel: { es: "Comunidad", en: "Community" },
    tags: [
      "directorio",
      "directory",
      "social",
      "youtube",
      "twitter",
      "x",
      "videos",
      "analisis",
      "comunidad",
      "feed",
    ],
    iconName: "lucide:share-2",
    inDirectoryTable: true,
  },
  {
    id: "yakkamon",
    name: { es: "Yakkamon Hub", en: "Yakkamon Hub" },
    description: {
      es: "Herramientas de cría y optimización de recursos para Yakkamon.",
      en: "Breeding tools and resource optimization for Yakkamon.",
    },
    url: { es: "/yakkamon/", en: "/en/yakkamon/" },
    category: "directorio",
    categoryLabel: { es: "Directorio", en: "Directory" },
    ecosystem: "yakkamon",
    ecosystemLabel: { es: "Yakkamon", en: "Yakkamon" },
    tags: [
      "directorio",
      "directory",
      "juego",
      "juegos",
      "game",
      "gaming",
      "yakkamon",
      "cria",
      "batallas",
      "combate",
      "hub",
      "herramientas",
    ],
    icon: "/img/cripto/yakkamon.webp",
    inDirectoryTable: true,
  },
  {
    id: "blog-hub",
    name: { es: "Diario del Leñador (Blog)", en: "Lumberjack Journal (Blog)" },
    description: {
      es: "Reflexiones profundas, tesis macro, seguridad y tutoriales paso a paso.",
      en: "Deep reflections, macro thesis, security, and step-by-step tutorials.",
    },
    url: { es: "/blog/", en: "/en/blog/" },
    category: "directorio",
    categoryLabel: { es: "Blog", en: "Blog" },
    ecosystem: "general",
    ecosystemLabel: { es: "Educación", en: "Education" },
    tags: [
      "blog",
      "articulos",
      "educacion",
      "diario",
      "tutoriales",
      "guias",
      "analisis",
      "articles",
      "news",
    ],
    iconName: "lucide:book-open",
    inDirectoryTable: true,
  },
]

// ------------------------------------------------------------
// 2. Función Generadora Dinámica del Catálogo
// Integra Content Collections de Astro en tiempo de build (SSG)
// ------------------------------------------------------------
export async function getEcosystemCatalog(lang: Lang): Promise<EcosystemCatalogItem[]> {
  const isEn = lang === "en"

  // A. Herramientas de software y hubs interactivos
  const toolItems: EcosystemCatalogItem[] = baseSoftwareTools.map((t) => ({
    id: t.id,
    name: t.name[lang],
    description: t.description[lang],
    url: t.url[lang],
    category: t.category,
    categoryLabel: t.categoryLabel[lang],
    ecosystem: t.ecosystem,
    ecosystemLabel: t.ecosystemLabel[lang],
    tags: t.tags,
    icon: t.icon,
    iconName: t.iconName,
    featured: t.featured ?? false,
    inDirectoryTable: t.inDirectoryTable ?? true,
  }))

  // B. Watchlist de Activos (Data Collection)
  const rawAssets = await getCollection("watchlist")
  const assetItems: EcosystemCatalogItem[] = rawAssets.map((asset) => {
    const def = asset.data.definicion
      ? isEn
        ? asset.data.definicion.en
        : asset.data.definicion.es
      : ""
    const keywords = asset.data.seo?.keywords
      ? isEn
        ? asset.data.seo.keywords.en
        : asset.data.seo.keywords.es
      : ""
    const keywordTags = typeof keywords === "string" ? keywords.split(",").map((k) => k.trim()) : []

    const isFeatured = ["bitcoin", "ethereum", "hyperliquid"].includes(asset.id)
    const isSfl = asset.id === "sunflowerland"

    return {
      id: asset.id,
      name: asset.data.name,
      description: def,
      url: isEn ? `/en/watchlist/${asset.id}/` : `/activos/${asset.id}/`,
      category: "activos",
      categoryLabel: isEn ? "Assets" : "Activos",
      ecosystem: isSfl ? "sunflowerland" : asset.id,
      ecosystemLabel: asset.data.name,
      tags: [
        "activo",
        "activos",
        "asset",
        "assets",
        asset.data.name.toLowerCase(),
        asset.data.ticker ? asset.data.ticker.toLowerCase() : "",
        ...(asset.data.type ? [asset.data.type.toLowerCase()] : []),
        ...keywordTags,
      ].filter(Boolean),
      icon: asset.data.image,
      featured: isFeatured,
      inDirectoryTable: true,
    }
  })

  // C. Guías Operativas dinámicas (Content Collection guias)
  const rawGuias = await getGuiasByLang(lang)
  const guiaItems: EcosystemCatalogItem[] = rawGuias.map((guia) => {
    const isSfl = guia.slug.includes("sfl") || guia.slug.includes("sunflower")
    const isYakkamon = guia.slug.includes("yakkamon")
    const eco = isSfl ? "sunflowerland" : isYakkamon ? "yakkamon" : "general"
    const ecoLabel = isSfl
      ? "Sunflower Land"
      : isYakkamon
        ? "Yakkamon"
        : guia.data.plataforma || (isEn ? "Operations" : "Operaciones")

    const tags = [
      "guia",
      "guias",
      "guide",
      "guides",
      "operacion",
      "operaciones",
      "operations",
      guia.slug,
      ...guia.slug.split("-"),
      guia.data.categoria || "",
      guia.data.plataforma || "",
      ...(guia.data.tags || []),
    ].filter(Boolean)

    return {
      id: `guia-${guia.slug}`,
      name: guia.data.title,
      description: guia.data.description,
      url: isEn ? `/en/operations/${guia.slug}/` : `/operaciones/${guia.slug}/`,
      category: "guias",
      categoryLabel: isEn ? "Guides" : "Guías",
      ecosystem: eco,
      ecosystemLabel: ecoLabel,
      tags,
      icon: guia.data.imagen,
      iconName: guia.data.imagen ? undefined : "lucide:compass",
      featured: guia.data.estado === "activa" && (guia.data.prioridad ?? 0) >= 50,
      inDirectoryTable: true,
    }
  })

  // D. Artículos de Blog dinámicos (Content Collection blog)
  const rawBlogPosts = await getBlogPostsByLang(lang)
  const blogItems: EcosystemCatalogItem[] = rawBlogPosts.map((post) => {
    // Si la portada es un objeto ImageMetadata de Astro, extraemos su src optimizado
    const coverSrc = post.data.coverImage
      ? typeof post.data.coverImage === "string"
        ? post.data.coverImage
        : post.data.coverImage.src
      : undefined

    const tags = [
      "blog",
      "articulo",
      "articulos",
      "article",
      "articles",
      "educacion",
      "investigacion",
      post.slug,
      ...post.slug.split("-"),
      post.data.category || "",
    ].filter(Boolean)

    return {
      id: `blog-${post.slug}`,
      name: post.data.title,
      description: post.data.description,
      url: isEn ? `/en/blog/${post.slug}/` : `/blog/${post.slug}/`,
      category: "blog",
      categoryLabel: isEn ? "Education" : "Educación",
      ecosystem: "general",
      ecosystemLabel: post.data.category || (isEn ? "Education" : "Educación"),
      tags,
      icon: coverSrc,
      iconName: coverSrc ? undefined : "lucide:book-open",
      featured: false,
      inDirectoryTable: true,
    }
  })

  return [...toolItems, ...assetItems, ...guiaItems, ...blogItems]
}
