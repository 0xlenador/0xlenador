// ============================================================
// src/i18n/index.ts
// Punto de entrada central del módulo i18n
// Importa todo desde aquí: import { t, lang } from "@/i18n"
// ============================================================

export { languages, defaultLang, type Lang, type UiKey, ui } from "./ui"
export {
  getLangFromUrl,
  useTranslations,
  getAlternateUrl,
  getLocalizedPath,
  routeMap,
  formatDate,
  formatDateLong,
  getBilingual,
  type BilingualField,
} from "./utils"
