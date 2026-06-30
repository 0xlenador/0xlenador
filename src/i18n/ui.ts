// ============================================================
// src/i18n/ui.ts
// Sistema de carga de traducciones por namespace (micro-diccionarios)
// Reemplaza el monolito anterior de ~1517 líneas
// ============================================================

import type _404 from "./locales/es/404.json"
import type assets from "./locales/es/assets.json"
import type blog from "./locales/es/blog.json"
import type common from "./locales/es/common.json"
import type directory from "./locales/es/directory.json"
import type faucets from "./locales/es/faucets.json"
import type home from "./locales/es/home.json"
import type intrinsic from "./locales/es/intrinsic.json"
import type ops from "./locales/es/ops.json"
import type privacy from "./locales/es/privacy.json"
import type riskfolio from "./locales/es/riskfolio.json"
import type sfl from "./locales/es/sfl.json"
import type terms from "./locales/es/terms.json"
import type tools from "./locales/es/tools.json"

export const languages = {
  es: "Español",
  en: "English",
} as const

export const defaultLang = "es" as const
export type Lang = keyof typeof languages

// ---------------------------------------------------------------------------
// Diccionario de Rutas (Segmentos de URL) — sin cambios
// ---------------------------------------------------------------------------
export const routes = {
  en: {
    operaciones: "operations",
    herramientas: "tools",
    activos: "watchlist",
    directorio: "directory",
    privacidad: "privacy",
    terminos: "terms",
    intrinseco: "intrinsic",
    "sfl-mercado": "sfl-market",
    "sfl-mascotas": "sfl-pets",
    "sfl-cocinando": "sfl-cooking",
  },
  es: {
    operations: "operaciones",
    tools: "herramientas",
    watchlist: "activos",
    directory: "directorio",
    privacy: "privacidad",
    terms: "terminos",
    intrinsic: "intrinseco",
    "sfl-market": "sfl-mercado",
    "sfl-pets": "sfl-mascotas",
    "sfl-cooking": "sfl-cocinando",
  },
}

// ---------------------------------------------------------------------------
// Carga eager de todos los micro-diccionarios vía import.meta.glob
// Seguro para SSG (build-time): no hay I/O en runtime.
// ---------------------------------------------------------------------------
const localeModules = import.meta.glob<Record<string, string>>(
  "./locales/**/*.json",
  { eager: true, import: "default" }
)

/**
 * Construye un diccionario plano fusionando todos los JSON de un idioma.
 * Los archivos se cargan en build-time: costo cero en runtime.
 */
function buildDictionary(lang: Lang): Record<string, string> {
  const dict: Record<string, string> = {}
  for (const [path, mod] of Object.entries(localeModules)) {
    // path = "./locales/es/common.json" → "es"
    const fileLang = path.split("/")[2] as Lang
    if (fileLang === lang && mod && typeof mod === "object") {
      Object.assign(dict, mod)
    }
  }
  return dict
}

// Diccionario unificado pre-construido en build-time
export const ui: Record<Lang, Record<string, string>> = {
  es: buildDictionary("es"),
  en: buildDictionary("en"),
}

// El tipo UiKey se deriva estrictamente de la intersección de todos los JSON
// para proveer autocompletado y validación de tipos al usar t().
type AllTranslations = typeof _404 &
  typeof assets &
  typeof blog &
  typeof common &
  typeof directory &
  typeof faucets &
  typeof home &
  typeof intrinsic &
  typeof ops &
  typeof privacy &
  typeof riskfolio &
  typeof sfl &
  typeof terms &
  typeof tools

export type UiKey = keyof AllTranslations
