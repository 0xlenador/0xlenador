// ============================================================
// src/i18n/ui.ts
// Sistema de carga de traducciones por namespace (micro-diccionarios)
// Reemplaza el monolito anterior de ~1517 líneas
// ============================================================

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

// El tipo UiKey queda relajado a string para compatibilidad
// con las claves dinámicas de los micro-diccionarios.
// La seguridad de tipos queda garantizada por los JSON individuales.
export type UiKey = string
