// ============================================================
// src/i18n/utils.ts
// Helper functions para internacionalización (i18n)
// Compatibles con Astro v6 static output + GitHub Pages
// ============================================================

import { ui, defaultLang, languages, type Lang, type UiKey, routes } from "./ui"

// ---------------------------------------------------------------------------
// Detección de idioma desde la URL
// ---------------------------------------------------------------------------

/**
 * Extrae el idioma actual desde la URL de Astro.
 * Ejemplo: /en/blog → "en" | /blog → "es" (defaultLang)
 */
export function getLangFromUrl(url: URL): Lang {
  const [, firstSegment] = url.pathname.split("/")
  if (firstSegment && firstSegment in languages) {
    return firstSegment as Lang
  }
  return defaultLang
}

// ---------------------------------------------------------------------------
// Función de traducción (t)
// ---------------------------------------------------------------------------

/**
 * Devuelve la función `t()` para el idioma dado.
 * Usa el idioma default como fallback si la clave no existe en el idioma solicitado.
 *
 * @example
 * const t = useTranslations("en")
 * t("nav.herramientas") // → "Tools"
 */
export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    // Intentar en el idioma solicitado, caer al default si no existe
    return (ui[lang] as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key
  }
}

// ---------------------------------------------------------------------------
// Rutas localizadas
// ---------------------------------------------------------------------------

/**
 * Mapa de rutas traducidas: slug en español → slug en inglés.
 * Solo para los segmentos que cambian entre idiomas.
 * Los slugs de contenido dinámico (blog/operations) usan los IDs originales.
 */
export const routeMap: Record<string, Record<Lang, string>> = {
  "/": { es: "/", en: "/en/" },
  "/herramientas": { es: "/herramientas/", en: "/en/tools/" },
  "/directorio": { es: "/directorio/", en: "/en/directory/" },
  "/activos": { es: "/activos/", en: "/en/watchlist/" },
  "/activos/bitcoin": { es: "/activos/bitcoin/", en: "/en/watchlist/bitcoin/" },
  "/activos/ethereum": { es: "/activos/ethereum/", en: "/en/watchlist/ethereum/" },
  "/activos/hyperliquid": { es: "/activos/hyperliquid/", en: "/en/watchlist/hyperliquid/" },
  "/activos/runestone": { es: "/activos/runestone/", en: "/en/watchlist/runestone/" },
  "/activos/sunflowerland": { es: "/activos/sunflowerland/", en: "/en/watchlist/sunflowerland/" },
  "/operaciones": { es: "/operaciones/", en: "/en/operations/" },
  "/blog": { es: "/blog/", en: "/en/blog/" },
  "/faucets": { es: "/faucets/", en: "/en/faucets/" },
  "/intrinseco": { es: "/intrinseco/", en: "/en/intrinsic/" },
  "/riskfolio": { es: "/riskfolio/", en: "/en/riskfolio/" },
  "/sfl-mercado": { es: "/sfl-mercado/", en: "/en/sfl-market/" },
  "/sfl-cocinando": { es: "/sfl-cocinando/", en: "/en/sfl-cooking/" },
  "/sfl-mascotas": { es: "/sfl-mascotas/", en: "/en/sfl-pets/" },
  "/privacidad": { es: "/privacidad/", en: "/en/privacy/" },
  "/terminos": { es: "/terminos/", en: "/en/terms/" },
}

/**
 * Garantiza que una ruta termine en "/" (excepto la raíz que ya lo tiene).
 * Imprescindible para que los hreflang coincidan exactamente con los <link rel="canonical">.
 */
function ensureTrailingSlash(path: string): string {
  if (path === "/" || path.endsWith("/")) return path
  return path + "/"
}

/**
 * Dada la URL actual, devuelve la URL equivalente en el otro idioma.
 * Usa el routeMap para mapear segmentos traducidos.
 * Siempre devuelve URLs con trailing slash para coincidir con el canonical.
 *
 * @example
 * getAlternateUrl(new URL("https://0xlenador.xyz/herramientas"), "en")
 * // → "/en/tools/"
 */
export function getAlternateUrl(url: URL, targetLang: Lang): string {
  const { pathname } = url

  // Normalizar: si viene de /en/..., extraer la ruta limpia sin prefijo
  const isEnPath = pathname.startsWith("/en/") || pathname === "/en"
  let cleanPath = isEnPath ? pathname.replace(/^\/en/, "") || "/" : pathname

  // Normalizar cleanPath quitando trailing slash para buscar en routeMap (excepto raíz)
  const cleanPathNorm = cleanPath === "/" ? "/" : cleanPath.replace(/\/$/, "")

  // Buscar en routeMap por la ruta ES o EN (con o sin trailing slash)
  for (const [esPath, translations] of Object.entries(routeMap)) {
    const enPath = translations.en.replace(/\/$/, "")
    if (cleanPathNorm === esPath || cleanPathNorm === esPath.replace(/\/$/, "") ||
        pathname.replace(/\/$/, "") === enPath || cleanPathNorm === enPath.replace(/^\/en/, "")) {
      return translations[targetLang]
    }
  }

  // Traducción por segmentos para rutas dinámicas (ej. /operations/slug -> /operaciones/slug)
  const segments = cleanPathNorm.split("/").filter(Boolean)
  const translatedSegments = segments.map((segment) => {
    // @ts-ignore - Indexing routes object dynamically
    return routes[targetLang]?.[segment] || segment
  })
  cleanPath = "/" + translatedSegments.join("/")

  // Fallback: construir la ruta manualmente
  if (targetLang === defaultLang) {
    return ensureTrailingSlash(cleanPath || "/")
  } else {
    return ensureTrailingSlash(`/en${cleanPath === "/" ? "" : cleanPath}`)
  }
}

/**
 * Devuelve la ruta localizada para un idioma dado.
 * Si el idioma es el default (es), devuelve la ruta sin prefijo.
 *
 * @example
 * getLocalizedPath("/blog", "en") // → "/en/blog/"
 * getLocalizedPath("/blog", "es") // → "/blog/"
 */
export function getLocalizedPath(
  path: string,
  lang: Lang,
  useTranslatedSlug = true
): string {
  if (lang === defaultLang) return ensureTrailingSlash(path)

  if (useTranslatedSlug) {
    // Buscar en el routeMap si hay una traducción directa
    const mapping = routeMap[path] || routeMap[path.replace(/\/$/, "")]
    if (mapping) return mapping[lang]
    
    // Traducción por segmentos (rutas dinámicas como /operaciones/slug)
    const segments = path.replace(/\/$/, "").split("/").filter(Boolean)
    const translatedSegments = segments.map((segment) => {
      // @ts-ignore
      return routes[lang]?.[segment] || segment
    })
    const translatedPath = "/" + translatedSegments.join("/")
    
    return ensureTrailingSlash(`/en${translatedPath === "/" ? "" : translatedPath}`)
  }

  // Fallback: solo agregar /en prefix
  return ensureTrailingSlash(`/en${path === "/" ? "" : path}`)
}

// ---------------------------------------------------------------------------
// Formato de fechas locale-aware
// ---------------------------------------------------------------------------

/**
 * Formatea una fecha según el idioma.
 * @example
 * formatDate("2026-04-22", "en") // → "Apr 22, 2026"
 * formatDate("2026-04-22", "es") // → "22 abr. 2026"
 */
export function formatDate(
  dateInput: string | Date,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = lang === "en" ? "en-US" : "es-CO"
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }
  return new Date(dateInput).toLocaleDateString(locale, {
    ...defaultOptions,
    ...options,
  })
}

/**
 * Formatea una fecha con mes largo (para guías y operaciones).
 * @example
 * formatDateLong("2026-04-22", "en") // → "April 22, 2026"
 * formatDateLong("2026-04-22", "es") // → "22 de abril de 2026"
 */
export function formatDateLong(dateInput: string | Date, lang: Lang): string {
  return formatDate(dateInput, lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Helpers de contenido JSON bilingüe
// ---------------------------------------------------------------------------

/**
 * Tipo para campos bilingües en los archivos JSON de activos.
 * Permite tanto un valor genérico (string, array) como un objeto bilingüe { es, en }.
 */
export type BilingualField<T = string> = T | { es: T; en: T }

/**
 * Extrae el valor del idioma correcto de un campo bilingüe.
 * Compatible con campos simples (backward-compat) y objetos { es, en }.
 *
 * @example
 * getBilingual({ es: "Definición", en: "Definition" }, "en") // → "Definition"
 * getBilingual("texto simple", "en") // → "texto simple"
 * getBilingual({ es: ["A"], en: ["B"] }, "en") // → ["B"]
 */
export function getBilingual<T = string>(field: BilingualField<T>, lang: Lang): T {
  if (field === null || field === undefined) return field as T;
  if (typeof field === "object" && !Array.isArray(field) && "es" in field) {
    return (field as any)[lang] ?? (field as any)[defaultLang];
  }
  return field as T;
}

// ---------------------------------------------------------------------------
// Exportar todo desde un único punto de entrada
// ---------------------------------------------------------------------------
export { languages, defaultLang, type Lang }
