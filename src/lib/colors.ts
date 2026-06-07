/**
 * colors.ts — Mapa de colores de activos para el pipeline de Tailwind v4.
 *
 * REGLA CRÍTICA: Tailwind v4 (Vite) escanea el código fuente en tiempo de
 * compilación. Las clases generadas por INTERPOLACIÓN de strings no se
 * detectan y por tanto NO se incluyen en el CSS final.
 *
 * Cada valor en este mapa DEBE ser una cadena COMPLETA y ESTÁTICA. Nunca
 * uses fragmentos como `text500: "text-emerald-500"` para luego componer
 * `${c.text500}/70` — en su lugar, define la clase completa como `text500_70`.
 *
 * Para añadir un nuevo color de acento, duplica un bloque existente y
 * reemplaza todos los valores. Astro escaneará este archivo en build.
 */

export type AssetColor = "emerald" | "cyan"

export type ColorTokens = {
  // Fondos
  bg5: string
  bg10: string
  bg20: string
  bg30: string
  bg600: string
  bgFull: string
  // Bordes
  border20: string
  border30: string
  border40: string
  borderL: string
  // Textos
  text400: string
  text400_80: string
  text500: string
  text500_70: string
  text500_80: string
  // Clases compuestas — anteriormente generadas por interpolación dinámica
  groupHoverText10: string // group-hover:text-*-500/10  (números decorativos)
  hoverText500: string // hover:text-*-500            (botón cerrar overlay)
  groupHoverText500: string // group-hover:text-*-500      (badge "Próximamente")
  hoverBorder30: string // hover:border-*-500/30       (tarjeta "Próximamente")
  decorationCreator: string // decoration-*-500/30 decoration-dashed (campo Creador)
  // Efectos
  glow: string
  overlay: string
}

export const colorMap: Record<AssetColor, ColorTokens> = {
  emerald: {
    bg5: "bg-emerald-500/5",
    bg10: "bg-emerald-500/10",
    bg20: "bg-emerald-500/20",
    bg30: "bg-emerald-500/30",
    bg600: "bg-emerald-600",
    bgFull: "bg-emerald-500",
    border20: "border-emerald-500/20",
    border30: "border-emerald-500/30",
    border40: "border-emerald-500/40",
    borderL: "border-l-4 border-emerald-500",
    text400: "text-emerald-400",
    text400_80: "text-emerald-400/80",
    text500: "text-emerald-500",
    text500_70: "text-emerald-500/70",
    text500_80: "text-emerald-500/80",
    // Compuestas (antes interpoladas — ahora completas para el scanner de Tailwind)
    groupHoverText10: "group-hover:text-emerald-500/10",
    hoverText500: "hover:text-emerald-500",
    groupHoverText500: "group-hover:text-emerald-500",
    hoverBorder30: "hover:border-emerald-500/30",
    decorationCreator: "decoration-emerald-500/30 decoration-dashed",
    glow: "group-hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    overlay: "text-emerald-400 border-emerald-500/20",
  },
  cyan: {
    bg5: "bg-cyan-500/5",
    bg10: "bg-cyan-500/10",
    bg20: "bg-cyan-500/20",
    bg30: "bg-cyan-500/30",
    bg600: "bg-cyan-600",
    bgFull: "bg-cyan-500",
    border20: "border-cyan-500/20",
    border30: "border-cyan-500/30",
    border40: "border-cyan-500/40",
    borderL: "border-l-4 border-cyan-500",
    text400: "text-cyan-400",
    text400_80: "text-cyan-400/80",
    text500: "text-cyan-500",
    text500_70: "text-cyan-500/70",
    text500_80: "text-cyan-500/80",
    // Compuestas
    groupHoverText10: "group-hover:text-cyan-500/10",
    hoverText500: "hover:text-cyan-500",
    groupHoverText500: "group-hover:text-cyan-500",
    hoverBorder30: "hover:border-cyan-500/30",
    decorationCreator: "decoration-cyan-500/30 decoration-dashed",
    glow: "group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    overlay: "text-cyan-400 border-cyan-500/20",
  },
}
