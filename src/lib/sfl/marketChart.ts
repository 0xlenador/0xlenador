// ============================================================================
// src/lib/sfl/marketChart.ts
// Motor del Modal de Trading Pro y gráficas SVG (individual y comparativa)
// para SflMarketView.astro.
// ============================================================================

export type GraphPeriod = "7d" | "30d" | "180d"

export interface MarketItemHistory {
  "1d"?: number | null
  "7d"?: number | null
  "30d"?: number | null
  "180d"?: number | null
  sparkline7d?: (number | null)[]
  sparkline30d?: (number | null)[]
  sparkline180d?: (number | null)[]
  [k: string]: unknown
}

export interface BudTraits {
  type?: string
  stem?: string
  aura?: string
  ears?: string
  colour?: string
  mainBoost?: string
  stemBoost?: string
  auraBoost?: string
}

export interface MarketItemRecord {
  key: string
  name: string
  category: string
  currentPrice: number
  supply?: number
  trades?: number
  trades7d?: number
  volume?: number
  volume7d?: number
  volume7dUsd?: number
  image?: string
  boost?: string
  isWearable?: boolean
  budId?: string
  type?: string
  stem?: string
  aura?: string
  ears?: string
  mainBoost?: string
  stemBoost?: string
  auraBoost?: string
  budTraits?: BudTraits
  history?: MarketItemHistory
}

export interface ChangeResult {
  val: number
  text: string
  isPositive: boolean | null
  pastPrice: number | null
}

export interface ModalChartLabels {
  maxCompare: string
  noItemsFound: string
  clearComparison: string
  selectItemToCompare: string
  supply: string
  stemLabel: string
  collectible: string
  noSalesDataChart: string
}

export interface ModalChartContext {
  clientLang: string
  getMarketData: () => MarketItemRecord[]
  getSflUsdPrice: () => number
  getItemImageSrc: (item: MarketItemRecord) => string
  parseBoosts: (str: string) => string[]
  formatModalPrice: (p: number) => string
  formatModalUsd: (p: number) => string
  formatNumber: (num: number, decimals?: number) => string
  calculateChange: (current: number, past: number | null | undefined) => ChangeResult
  labels: ModalChartLabels
}

interface ComparePaletteEntry {
  stroke: string
  name: string
  text: string
}

interface PreparedCompareItem {
  item: MarketItemRecord
  validData: number[]
  pctData: number[]
  color: string
  startVal: number
  finalPct: number
  pts: [number, number][]
  yCoords: number[]
  startX: number
  startY: number
  endX: number
  endY: number
  dLine: string
  dArea: string
  imgSrc: string
  avatarX: number
  avatarY: number
  hasOffset: boolean
}

declare global {
  interface Window {
    toggleCompareDropdown?: (forceState?: boolean) => void
    filterCompareList?: (query: string) => void
    selectCompareItem?: (itemKey: string) => void
    removeCompareItem?: (itemKey: string) => void
    clearModalComparison?: () => void
    openTradingModal?: (item: MarketItemRecord) => void
    closeTradingModal?: () => void
    setModalGraphPeriod?: (period: GraphPeriod) => void
    __initSflTradingModal?: (ctx: ModalChartContext) => void
    __sflMarketModalCtx?: ModalChartContext
  }
}

const COMPARE_PALETTE: ComparePaletteEntry[] = [
  { stroke: "#10b981", name: "Emerald", text: "text-emerald-400" },
  { stroke: "#c084fc", name: "Violet", text: "text-purple-300" },
  { stroke: "#38bdf8", name: "Sky", text: "text-sky-300" },
  { stroke: "#f59e0b", name: "Amber", text: "text-amber-300" },
  { stroke: "#f43f5e", name: "Rose", text: "text-rose-300" },
]

let activeCtx: ModalChartContext | null = null
let activeModalItem: MarketItemRecord | null = null
let activeModalPeriod: GraphPeriod = "7d"
let compareModalItems: MarketItemRecord[] = []
let lastRenderedSvgW = 0
let lastRenderedSvgH = 0
let chartResizeTimer: ReturnType<typeof setTimeout> | null = null
let activeResizeObserver: ResizeObserver | null = null
let activeHideOverlays: (() => void) | null = null
let globalListenersBound = false

function getCatmullRomVal(pts: number[], i: number, t: number): number {
  if (pts.length === 0) return 0
  if (pts.length === 1) return pts[0]
  if (pts.length === 2) return pts[0] + t * (pts[1] - pts[0])
  const p0 = pts[Math.max(0, i - 1)]
  const p1 = pts[i]
  const p2 = pts[Math.min(pts.length - 1, i + 1)]
  const p3 = pts[Math.min(pts.length - 1, i + 2)]
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  )
}

function getCurvePath(pts: [number, number][]): string {
  if (pts.length <= 1) return ""
  if (pts.length === 2) return ` L ${pts[1][0].toFixed(2)} ${pts[1][1].toFixed(2)}`
  let d = ""
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2 >= pts.length ? i + 1 : i + 2]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return d
}

function getModalChartDims(
  svg: SVGSVGElement,
  svgArea: HTMLElement,
): { width: number; height: number } {
  // Dimensiones 1:1 en píxeles CSS reales para evitar distorsión de círculos/avatares/textos en móvil
  const rawW = svgArea.clientWidth || svgArea.getBoundingClientRect().width || 320
  const rawH = svgArea.clientHeight || svgArea.getBoundingClientRect().height || 190
  const width = Math.max(260, Math.round(rawW))
  const height = Math.max(130, Math.round(rawH))
  lastRenderedSvgW = width
  lastRenderedSvgH = height
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
  return { width, height }
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/** Escapa caracteres HTML especiales antes de interpolar datos externos en `innerHTML`. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch)
}

function formatChartDateLabel(daysAgo: number, clientLang: string): string {
  const now = new Date()
  const datePoint = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(datePoint.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }
  return datePoint.toLocaleDateString(clientLang === "es" ? "es-ES" : "en-US", dateOptions)
}

function hideModalChartOverlays(
  crosshairX: HTMLElement | null,
  crosshairY: HTMLElement | null,
  badgeX: HTMLElement | null,
  badgeY: HTMLElement | null,
  tooltip: HTMLElement | null,
  dotIds: string[] = [],
): void {
  if (crosshairX) crosshairX.classList.add("hidden")
  if (crosshairY) crosshairY.classList.add("hidden")
  if (badgeX) badgeX.classList.add("hidden")
  if (badgeY) badgeY.classList.add("hidden")
  if (tooltip) tooltip.classList.add("hidden")
  dotIds.forEach((id) => {
    const dot = document.getElementById(id)
    if (dot) dot.classList.add("hidden")
  })
}

function positionModalTooltip(
  tooltip: HTMLElement,
  pxX: number,
  anchorY: number,
  rect: DOMRect,
): void {
  tooltip.classList.remove("hidden")
  const tipWidth = tooltip.offsetWidth || 180
  const tipHeight = tooltip.offsetHeight || 70
  let leftPos = pxX + 12
  if (leftPos + tipWidth > rect.width - 6) {
    leftPos = pxX - tipWidth - 12
  }
  tooltip.style.left = `${Math.max(6, Math.min(rect.width - tipWidth - 6, leftPos))}px`
  tooltip.style.top = `${Math.max(6, Math.min(rect.height - tipHeight - 6, anchorY))}px`
}

function clearChartPointerHandlers(svgArea: HTMLElement): void {
  svgArea.onpointerdown = null
  svgArea.onpointermove = null
  svgArea.onpointerleave = null
  svgArea.onpointercancel = null
  activeHideOverlays = null
}

function bindChartPointerHandlers(
  svgArea: HTMLElement,
  updateAtPointer: (e: PointerEvent) => void,
  hideOverlays: () => void,
): void {
  hideOverlays()
  activeHideOverlays = hideOverlays
  svgArea.onpointerdown = (e: PointerEvent) => {
    updateAtPointer(e)
  }
  svgArea.onpointermove = (e: PointerEvent) => {
    updateAtPointer(e)
  }
  svgArea.onpointerleave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      hideOverlays()
    }
  }
  svgArea.onpointercancel = () => {
    hideOverlays()
  }
}

function updateCompareUI(): void {
  if (!activeCtx) return
  const ctx = activeCtx
  const compareBtn = document.getElementById("modalCompareBtn")
  const compareActions = document.getElementById("modalCompareActions")
  const addBtn = document.getElementById("modalCompareAddBtn")
  const chipsList = document.getElementById("modalCompareChipsList")
  const dropdownTitle = document.getElementById("modalCompareDropdownTitle")

  if (compareModalItems.length > 0) {
    if (compareBtn) compareBtn.classList.add("hidden")
    if (compareActions) {
      compareActions.classList.remove("hidden")
      compareActions.classList.add("flex")
    }
    if (addBtn) {
      if (compareModalItems.length < 4) {
        addBtn.classList.remove("hidden")
        addBtn.classList.add("flex")
      } else {
        addBtn.classList.add("hidden")
        addBtn.classList.remove("flex")
      }
    }
    if (chipsList) {
      chipsList.classList.remove("hidden")
      chipsList.classList.add("flex")

      chipsList.innerHTML = compareModalItems
        .map((item, idx) => {
          const pal = COMPARE_PALETTE[idx + 1] || COMPARE_PALETTE[1]
          const imgSrc = ctx.getItemImageSrc(item)
          const safeKey = (item.key || item.name).replace(/'/g, "\\'")
          return `
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-mono shrink-0" style="border-color: ${pal.stroke}40; background-color: ${pal.stroke}15; color: ${pal.stroke};">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${pal.stroke}"></span>
              <img src="${imgSrc}" class="w-3.5 h-3.5 object-contain rounded pixelated bg-black/40" />
              <span class="font-bold truncate max-w-[75px] sm:max-w-[110px] text-white">${item.name}</span>
              <button type="button" onclick="window.removeCompareItem('${safeKey}')" class="ml-0.5 hover:text-white cursor-pointer px-0.5 opacity-70 hover:opacity-100 leading-none" title="${ctx.labels.clearComparison}">✕</button>
            </div>
          `
        })
        .join("")
    }
  } else {
    if (compareBtn) compareBtn.classList.remove("hidden")
    if (compareActions) {
      compareActions.classList.add("hidden")
      compareActions.classList.remove("flex")
    }
    if (chipsList) {
      chipsList.classList.add("hidden")
      chipsList.classList.remove("flex")
      chipsList.innerHTML = ""
    }
  }

  if (dropdownTitle) {
    dropdownTitle.textContent =
      compareModalItems.length >= 4
        ? ctx.labels.maxCompare
        : `${ctx.labels.selectItemToCompare} (${compareModalItems.length + 1}/5)`
  }
}

function renderCompareChart(period: GraphPeriod): void {
  if (!activeCtx) return
  const ctx = activeCtx
  const svg = document.getElementById("modalChartSvg") as SVGSVGElement | null
  const svgArea = document.getElementById("modalChartSvgArea")
  const tooltip = document.getElementById("modalChartTooltip")
  const crosshairX = document.getElementById("modalChartCrosshairX")
  const crosshairY = document.getElementById("modalChartCrosshairY")
  const badgeX = document.getElementById("modalCrosshairBadgeX")
  const badgeY = document.getElementById("modalCrosshairBadgeY")
  if (!svg || !svgArea || !activeModalItem || compareModalItems.length === 0) return

  const allItems = [activeModalItem, ...compareModalItems]
  const sparkKey = `sparkline${period}` as "sparkline7d" | "sparkline30d" | "sparkline180d"
  const expectedLength = period === "180d" ? 181 : period === "30d" ? 31 : 8

  const itemsData: PreparedCompareItem[] = allItems.map((item, idx) => {
    const rawPoints = (item.history && item.history[sparkKey]) || []
    let validData = Array.isArray(rawPoints)
      ? rawPoints.filter((p): p is number => p !== null && p !== undefined && typeof p === "number")
      : []
    if (validData.length === 0 && item.currentPrice > 0) {
      validData = [item.currentPrice, item.currentPrice]
    }
    if (item.currentPrice > 0 && validData.length > 0) {
      validData[validData.length - 1] = item.currentPrice
    }

    const startVal = validData[0] || item.currentPrice || 1
    const pctData = validData.map((v) => ((v - startVal) / startVal) * 100)
    const pal = COMPARE_PALETTE[idx] || COMPARE_PALETTE[idx % COMPARE_PALETTE.length]

    return {
      item,
      validData,
      pctData,
      color: pal.stroke,
      startVal,
      finalPct: pctData.length > 0 ? pctData[pctData.length - 1] : 0,
      pts: [],
      yCoords: [],
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      dLine: "",
      dArea: "",
      imgSrc: ctx.getItemImageSrc(item),
      avatarX: 0,
      avatarY: 0,
      hasOffset: false,
    }
  })

  // Actualizar HUD arriba antes de medir svgArea
  const hudEl = document.getElementById("modalChartHud")
  if (hudEl) {
    const hudItemsHtml = itemsData
      .map((d) => {
        const pctStr = `${d.finalPct >= 0 ? "+" : ""}${d.finalPct.toFixed(1)}%`
        const pctColor = d.finalPct >= 0 ? d.color : "#f87171"
        return `
          <div class="flex items-center gap-1.5 font-bold">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${d.color}"></span>
            <span class="text-white truncate max-w-[70px] sm:max-w-[100px]">${d.item.name}</span>
            <span style="color: ${d.color}" class="text-[10px]">${ctx.formatModalPrice(d.item.currentPrice)}</span>
            <span style="color: ${pctColor}" class="text-[9px]">(${pctStr})</span>
          </div>
        `
      })
      .join("")

    let extraHud = ""
    if (itemsData.length === 2) {
      const ratioVal = itemsData[0].item.currentPrice / (itemsData[1].item.currentPrice || 0.0001)
      const ratioStr =
        ratioVal >= 100 ? ctx.formatNumber(ratioVal, 0) : ctx.formatNumber(ratioVal, 2)
      extraHud = `<span class="text-white/30 text-[9px] ml-1">1 ${itemsData[0].item.name.slice(0, 6)} = ${ratioStr} ${itemsData[1].item.name.slice(0, 6)}</span>`
    }
    hudEl.innerHTML = hudItemsHtml + extraHud
  }

  const { width, height } = getModalChartDims(svg, svgArea)

  if (itemsData.every((d) => d.validData.length < 2)) {
    svg.innerHTML = `<text x="${(width / 2).toFixed(0)}" y="${(height / 2).toFixed(0)}" fill="rgba(255,255,255,0.25)" font-size="12" font-family="monospace" text-anchor="middle" letter-spacing="2">${ctx.labels.noSalesDataChart}</text>`
    clearChartPointerHandlers(svgArea)
    hideModalChartOverlays(crosshairX, crosshairY, badgeX, badgeY, tooltip)
    return
  }

  const allPcts = itemsData.flatMap((d) => d.pctData).concat([0])
  const minPct = Math.min(...allPcts)
  const maxPct = Math.max(...allPcts)
  const spanPct = maxPct - minPct || 10
  const padMargin = spanPct * 0.16
  const yMin = minPct - padMargin
  const yMax = maxPct + padMargin
  const rangeY = yMax - yMin

  const padTop = 16
  const padBottom = 16
  const padLeft = 22
  const padRight = 58

  const getY = (pct: number) => padTop + (1 - (pct - yMin) / rangeY) * (height - padTop - padBottom)
  const getX = (validDataLen: number, i: number) => {
    const daysAgo = validDataLen - 1 - i
    const xProgress = 1 - daysAgo / Math.max(1, expectedLength - 1)
    return padLeft + xProgress * (width - padLeft - padRight)
  }

  itemsData.forEach((d) => {
    d.pts = d.validData.map((_v, i) => [getX(d.validData.length, i), getY(d.pctData[i])])
    d.yCoords = d.pts.map((p) => p[1])
    d.startX = d.pts[0][0]
    d.startY = d.pts[0][1]
    d.endX = d.pts[d.pts.length - 1][0]
    d.endY = d.pts[d.pts.length - 1][1]
    d.dLine = `M ${d.startX.toFixed(2)} ${d.startY.toFixed(2)}${getCurvePath(d.pts)}`
    d.dArea = `${d.dLine} L ${d.endX.toFixed(2)} ${height - padBottom} L ${d.startX.toFixed(2)} ${height - padBottom} Z`
  })

  // Escalonar avatares manteniendo separación uniforme dentro de los márgenes verticales
  const minAvY = padTop + 2
  const maxAvY = height - padBottom - 2
  itemsData.forEach((d) => {
    const closeItems = itemsData.filter(
      (other) => Math.abs(other.startX - d.startX) < 20 && Math.abs(other.startY - d.startY) < 20,
    )
    if (closeItems.length > 1) {
      const rank = closeItems.indexOf(d)
      const count = closeItems.length
      const stepAv = Math.min(
        20,
        Math.max(15, Math.floor((maxAvY - minAvY) / Math.max(1, count - 1))),
      )
      const totalSpan = (count - 1) * stepAv
      let blockTop = d.startY - totalSpan / 2
      if (blockTop < minAvY) blockTop = minAvY
      if (blockTop + totalSpan > maxAvY) blockTop = Math.max(minAvY, maxAvY - totalSpan)
      d.avatarX = d.startX
      d.avatarY = blockTop + rank * stepAv
      d.hasOffset = Math.abs(d.avatarY - d.startY) > 2
    } else {
      d.avatarX = d.startX
      d.avatarY = Math.max(minAvY, Math.min(maxAvY, d.startY))
      d.hasOffset = Math.abs(d.avatarY - d.startY) > 2
    }
  })

  const yZero = getY(0)

  // Niveles de escala para el grid técnico TradingView
  const gridLevels = [maxPct, maxPct * 0.5, minPct * 0.5, minPct].filter(
    (lvl) => Math.abs(lvl) > 1.5,
  )

  const gridLinesHtml = gridLevels
    .map(
      (lvl) => `
      <line x1="${padLeft}" y1="${getY(lvl).toFixed(2)}" x2="${width - padRight}" y2="${getY(lvl).toFixed(2)}" stroke="rgba(255,255,255,0.035)" stroke-dasharray="2,2" />
      <text x="${width - padRight + 6}" y="${(getY(lvl) + 3).toFixed(2)}" fill="rgba(255,255,255,0.28)" font-size="9" font-family="monospace">${lvl >= 0 ? "+" : ""}${lvl.toFixed(1)}%</text>
    `,
    )
    .join("")

  // Píldoras de rendimiento en el eje derecho con resolución de colisiones
  const pillBadges = itemsData.map((d) => ({
    color: d.color,
    pct: d.finalPct,
    rawY: d.endY,
    y: Math.max(padTop - 2, Math.min(height - padBottom + 2, d.endY)),
  }))

  pillBadges.sort((a, b) => a.rawY - b.rawY)
  for (let i = 1; i < pillBadges.length; i++) {
    if (pillBadges[i].y - pillBadges[i - 1].y < 15) {
      pillBadges[i].y = pillBadges[i - 1].y + 15
    }
  }
  for (let i = pillBadges.length - 1; i >= 0; i--) {
    if (pillBadges[i].y > height - padBottom + 4) {
      pillBadges[i].y = height - padBottom + 4
      if (i > 0 && pillBadges[i].y - pillBadges[i - 1].y < 15) {
        pillBadges[i - 1].y = pillBadges[i].y - 15
      }
    }
  }

  const pillsHtml = pillBadges
    .map(
      (p) => `
      <rect x="${width - padRight + 4}" y="${(p.y - 7.5).toFixed(2)}" width="52" height="15" rx="2.5" fill="${p.color}" />
      <text x="${width - padRight + 30}" y="${(p.y + 3).toFixed(2)}" fill="#000000" font-size="9" font-family="monospace" text-anchor="middle" font-weight="900">${p.pct >= 0 ? "+" : ""}${p.pct.toFixed(1)}%</text>
    `,
    )
    .join("")

  const defsHtml = itemsData
    .map(
      (d, k) => `
      <clipPath id="clipAvatarComp${k}">
        <circle cx="${d.avatarX.toFixed(2)}" cy="${d.avatarY.toFixed(2)}" r="8" />
      </clipPath>
      <linearGradient id="compGrad${k}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${d.color}" stop-opacity="0.08" />
        <stop offset="100%" stop-color="${d.color}" stop-opacity="0.0" />
      </linearGradient>
    `,
    )
    .join("")

  const areasHtml = itemsData
    .map(
      (d, k) => `
      <path d="${d.dArea}" fill="url(#compGrad${k})" />
    `,
    )
    .join("")

  const linesHtml = itemsData
    .map(
      (d) => `
      <path d="${d.dLine}" fill="none" stroke="${d.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    `,
    )
    .join("")

  const endCirclesHtml = itemsData
    .map(
      (d) => `
      <circle cx="${d.endX.toFixed(2)}" cy="${d.endY.toFixed(2)}" r="3.5" fill="${d.color}" stroke="#0c1015" stroke-width="1.5" />
    `,
    )
    .join("")

  const connectorsHtml = itemsData
    .filter((d) => d.hasOffset)
    .map(
      (d) => `
      <line x1="${d.startX.toFixed(2)}" y1="${d.startY.toFixed(2)}" x2="${d.avatarX.toFixed(2)}" y2="${d.avatarY.toFixed(2)}" stroke="${d.color}" stroke-width="1" stroke-dasharray="2,2" opacity="0.6" />
    `,
    )
    .join("")

  const avatarsHtml = itemsData
    .map(
      (d, k) => `
      <g class="cursor-pointer">
        <circle cx="${d.avatarX.toFixed(2)}" cy="${d.avatarY.toFixed(2)}" r="9" fill="#0c1015" />
        <image href="${d.imgSrc}" x="${(d.avatarX - 7.5).toFixed(2)}" y="${(d.avatarY - 7.5).toFixed(2)}" width="15" height="15" clip-path="url(#clipAvatarComp${k})" preserveAspectRatio="xMidYMid slice" style="image-rendering: pixelated;" />
        <circle cx="${d.avatarX.toFixed(2)}" cy="${d.avatarY.toFixed(2)}" r="8.5" fill="none" stroke="${d.color}" stroke-width="1.5" />
      </g>
    `,
    )
    .join("")

  const hoverDotsHtml = itemsData
    .map(
      (d, k) => `
      <circle id="modalHoverDot${k}" cx="0" cy="0" r="3.5" fill="#ffffff" stroke="${d.color}" stroke-width="1.5" class="hidden pointer-events-none" />
    `,
    )
    .join("")

  svg.innerHTML = `
      <defs>
        ${defsHtml}
      </defs>

      <!-- Rejilla Técnica de Fondo (Grid) -->
      ${gridLinesHtml}

      <!-- Línea Base 0.0% -->
      <line x1="${padLeft}" y1="${yZero.toFixed(2)}" x2="${width - padRight}" y2="${yZero.toFixed(2)}" stroke="rgba(255,255,255,0.14)" stroke-dasharray="3,3" />
      <rect x="${width - padRight + 4}" y="${(yZero - 7.5).toFixed(2)}" width="52" height="15" rx="2.5" fill="#141920" stroke="rgba(255,255,255,0.15)" />
      <text x="${width - padRight + 30}" y="${(yZero + 3).toFixed(2)}" fill="rgba(255,255,255,0.65)" font-size="9" font-family="monospace" text-anchor="middle" font-weight="bold">0.0%</text>

      <!-- Áreas suaves de fondo -->
      ${areasHtml}

      <!-- Líneas de tendencia ultrafinas -->
      ${linesHtml}

      <!-- Puntos finales -->
      ${endCirclesHtml}

      <!-- Píldoras de rendimiento final ancladas en el eje derecho -->
      ${pillsHtml}

      <!-- Conectores si hay solapamiento al inicio -->
      ${connectorsHtml}

      <!-- Avatares en su punto de partida -->
      ${avatarsHtml}

      <!-- Puntos interactivos hover continuos y ultra precisos -->
      ${hoverDotsHtml}
    `

  const hoverDotIds = itemsData.map((_, k) => `modalHoverDot${k}`)
  const hideOverlays = () => {
    hideModalChartOverlays(crosshairX, crosshairY, badgeX, badgeY, tooltip, hoverDotIds)
  }

  // Interacción continua en hover y tap táctil con cálculo Catmull-Rom exacto
  const updateAtPointer = (e: PointerEvent) => {
    const rect = svgArea.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const svgX = (mouseX / (rect.width || 1)) * width
    const clampedSvgX = Math.max(padLeft, Math.min(width - padRight, svgX))

    // 1. Fecha histórica exacta sincronizada con la línea de tiempo global
    const progressGlobal = Math.max(
      0,
      Math.min(1, (clampedSvgX - padLeft) / (width - padLeft - padRight || 1)),
    )
    const dateLabel = formatChartDateLabel(
      (1 - progressGlobal) * (expectedLength - 1),
      ctx.clientLang,
    )

    // Posiciones de píxeles
    const pxX = (clampedSvgX / width) * rect.width
    const pxYCursor = Math.max(0, Math.min(rect.height, mouseY))
    const svgYCursor = (pxYCursor / (rect.height || 1)) * height
    const cursorPct = yMin + (1 - (svgYCursor - padTop) / (height - padTop - padBottom)) * rangeY

    // Crosshairs duales (X e Y) estilo TradingView
    if (crosshairX) {
      crosshairX.style.left = `${pxX}px`
      crosshairX.classList.remove("hidden")
    }
    if (crosshairY) {
      crosshairY.style.top = `${pxYCursor}px`
      crosshairY.classList.remove("hidden")
    }
    if (badgeY) {
      badgeY.style.top = `${pxYCursor}px`
      badgeY.textContent = `${cursorPct >= 0 ? "+" : ""}${cursorPct.toFixed(1)}%`
      badgeY.classList.remove("hidden")
    }
    if (badgeX) {
      badgeX.style.left = `${pxX}px`
      badgeX.textContent = dateLabel
      badgeX.classList.remove("hidden")
    }

    // Interpolación para cada ítem y posicionamiento de puntos hover
    const rowsTooltip: string[] = []
    const hoverVals: Record<number, number> = {}
    let minPixelY = rect.height

    itemsData.forEach((d, k) => {
      const dot = document.getElementById(`modalHoverDot${k}`)
      if (clampedSvgX < d.startX - 3) {
        if (dot) dot.classList.add("hidden")
        return
      }

      const activeWidth = d.endX - d.startX || 1
      const progress = Math.max(0, Math.min(1, (clampedSvgX - d.startX) / activeWidth))
      const totalSegments = Math.max(1, d.validData.length - 1)
      const exactIndex = progress * totalSegments
      const i0 = Math.min(totalSegments - 1, Math.floor(exactIndex))
      const t = exactIndex - i0

      const ptSvgY = Math.max(
        padTop - 8,
        Math.min(height - padBottom + 8, getCatmullRomVal(d.yCoords, i0, t)),
      )
      const val = getCatmullRomVal(d.validData, i0, t)
      const pct = getCatmullRomVal(d.pctData, i0, t)
      hoverVals[k] = val

      const pxY = (ptSvgY / height) * rect.height
      if (pxY < minPixelY) minPixelY = pxY

      if (dot) {
        dot.setAttribute("cx", clampedSvgX.toFixed(2))
        dot.setAttribute("cy", ptSvgY.toFixed(2))
        dot.classList.remove("hidden")
      }

      rowsTooltip.push(`
          <div class="flex items-center justify-between gap-3 py-0.5">
            <div class="flex items-center gap-1.5 font-bold">
              <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${d.color}"></span>
              <span class="text-white truncate max-w-[85px] sm:max-w-[110px]">${d.item.name}</span>
            </div>
            <div class="font-mono text-[10.5px] text-right">
              <span class="text-white font-bold">${ctx.formatModalPrice(val)}</span>
              <span style="color: ${pct >= 0 ? d.color : "#f87171"}" class="ml-1 text-[9.5px]">${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</span>
            </div>
          </div>
        `)
    })

    if (tooltip) {
      let ratioHeader = ""
      if (itemsData.length === 2 && hoverVals[0] !== undefined && hoverVals[1] !== undefined) {
        const ratioNow = hoverVals[0] / (hoverVals[1] || 0.0001)
        const ratioStr =
          ratioNow >= 100 ? ctx.formatNumber(ratioNow, 0) : ctx.formatNumber(ratioNow, 2)
        ratioHeader = `<span class="text-white/40 font-normal">1 ${itemsData[0].item.name.slice(0, 6)} = ${ratioStr} ${itemsData[1].item.name.slice(0, 6)}</span>`
      }

      tooltip.innerHTML = `
          <div class="text-[10px] text-cyan-400 font-bold mb-1 pb-1 border-b border-white/10 flex justify-between gap-3">
            <span>${dateLabel}</span>
            ${ratioHeader}
          </div>
          ${rowsTooltip.join("")}
        `
      positionModalTooltip(tooltip, pxX, minPixelY - 20, rect)
    }
  }

  bindChartPointerHandlers(svgArea, updateAtPointer, hideOverlays)
}

function renderModalChart(
  rawPoints: (number | null)[] | undefined,
  period: GraphPeriod,
  currentPrice: number,
): void {
  if (!activeCtx) return
  const ctx = activeCtx
  const svg = document.getElementById("modalChartSvg") as SVGSVGElement | null
  const svgArea = document.getElementById("modalChartSvgArea")
  const tooltip = document.getElementById("modalChartTooltip")
  const crosshairX = document.getElementById("modalChartCrosshairX")
  const crosshairY = document.getElementById("modalChartCrosshairY")
  const badgeX = document.getElementById("modalCrosshairBadgeX")
  const badgeY = document.getElementById("modalCrosshairBadgeY")
  if (!svg || !svgArea) return

  if (compareModalItems.length > 0) {
    renderCompareChart(period)
    return
  }

  const expectedLength =
    period === "180d"
      ? 181
      : period === "30d"
        ? 31
        : Array.isArray(rawPoints) && rawPoints.length > 8
          ? rawPoints.length
          : 8

  // Filtrar solo datos válidos reales
  let validData = Array.isArray(rawPoints)
    ? rawPoints.filter((p): p is number => p !== null && p !== undefined && typeof p === "number")
    : []

  if (validData.length === 0 && currentPrice > 0) {
    validData = [currentPrice, currentPrice]
  }

  const lastPrice =
    validData.length > 0 ? (currentPrice > 0 ? currentPrice : validData[validData.length - 1]) : 0
  if (currentPrice > 0 && validData.length > 0) {
    validData[validData.length - 1] = currentPrice
  }

  const isPositive = validData.length > 0 ? lastPrice >= validData[0] : true

  // Actualizar HUD técnico individual antes de medir svgArea
  const hudEl = document.getElementById("modalChartHud")
  if (hudEl && activeModalItem) {
    const pctChange =
      validData.length > 0 ? ((lastPrice - validData[0]) / (validData[0] || 1)) * 100 : 0
    const pctStr = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%`
    hudEl.innerHTML = `
        <div class="flex items-center gap-1.5 font-bold">
          <span class="w-2 h-2 rounded-full shrink-0 ${isPositive ? "bg-emerald-400" : "bg-red-400"}"></span>
          <span class="text-white">${activeModalItem.name}</span>
          <span class="${isPositive ? "text-emerald-400" : "text-red-400"}">${ctx.formatModalPrice(lastPrice)} FLOWER</span>
          <span class="${isPositive ? "text-emerald-400" : "text-red-400"} text-[9.5px]">(${pctStr})</span>
        </div>
      `
  }

  const { width, height } = getModalChartDims(svg, svgArea)

  if (validData.length < 2 && currentPrice <= 0) {
    svg.innerHTML = `
        <text x="${(width / 2).toFixed(0)}" y="${(height / 2).toFixed(0)}" fill="rgba(255,255,255,0.25)" font-size="12" font-family="monospace" text-anchor="middle" letter-spacing="2">${ctx.labels.noSalesDataChart}</text>
      `
    clearChartPointerHandlers(svgArea)
    hideModalChartOverlays(crosshairX, crosshairY, badgeX, badgeY, tooltip)
    return
  }

  const padTop = 16
  const padBottom = 18
  const padLeft = 14
  const padRight = 58

  const min = Math.min(...validData)
  const max = Math.max(...validData)
  const range = max - min || max * 0.1 || 1

  // getX calcula la posición temporal real dejando vacío el pasado de ítems nuevos
  const getX = (i: number) => {
    const daysAgo = validData.length - 1 - i
    const xProgress = 1 - daysAgo / Math.max(1, expectedLength - 1)
    return padLeft + xProgress * (width - padLeft - padRight)
  }
  const getY = (v: number) => padTop + (1 - (v - min) / range) * (height - padTop - padBottom)

  const strokeColor = isPositive ? "#10b981" : "#ef4444"
  const fillGradientId = `modalGrad_${isPositive ? "green" : "red"}`

  const pointsArray: [number, number][] = validData.map((v, i) => [getX(i), getY(v)])
  const startX = pointsArray[0][0]
  const endX = pointsArray[pointsArray.length - 1][0]

  const dLine = `M ${startX.toFixed(2)} ${pointsArray[0][1].toFixed(2)}${getCurvePath(pointsArray)}`
  const dArea = `${dLine} L ${endX.toFixed(2)} ${height - padBottom} L ${startX.toFixed(2)} ${height - padBottom} Z`

  const midPrice = min + range / 2
  const sflUsd = ctx.getSflUsdPrice() || 0.085

  const formatAxisPrice = (v: number) => {
    if (typeof v !== "number" || isNaN(v)) return "0"
    if (v < 0.09 || range < 0.09) return ctx.formatNumber(v, 4)
    if (v < 1 || range < 1) return ctx.formatNumber(v, 2)
    return ctx.formatNumber(v, 1)
  }

  const lastPriceY = Math.max(padTop - 2, Math.min(height - padBottom + 2, getY(lastPrice)))

  svg.innerHTML = `
      <defs>
        <linearGradient id="${fillGradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.10" />
          <stop offset="85%" stop-color="${strokeColor}" stop-opacity="0.01" />
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Rejilla Técnica TradingView -->
      <line x1="${padLeft}" y1="${getY(max).toFixed(2)}" x2="${width - padRight}" y2="${getY(max).toFixed(2)}" stroke="rgba(255,255,255,0.035)" stroke-dasharray="2,2" />
      <text x="${width - padRight + 6}" y="${(getY(max) + 3).toFixed(2)}" fill="rgba(255,255,255,0.28)" font-size="9" font-family="monospace">${formatAxisPrice(max)}</text>

      <line x1="${padLeft}" y1="${getY(midPrice).toFixed(2)}" x2="${width - padRight}" y2="${getY(midPrice).toFixed(2)}" stroke="rgba(255,255,255,0.035)" stroke-dasharray="2,2" />
      <text x="${width - padRight + 6}" y="${(getY(midPrice) + 3).toFixed(2)}" fill="rgba(255,255,255,0.28)" font-size="9" font-family="monospace">${formatAxisPrice(midPrice)}</text>

      <line x1="${padLeft}" y1="${getY(min).toFixed(2)}" x2="${width - padRight}" y2="${getY(min).toFixed(2)}" stroke="rgba(255,255,255,0.035)" stroke-dasharray="2,2" />
      <text x="${width - padRight + 6}" y="${(getY(min) + 3).toFixed(2)}" fill="rgba(255,255,255,0.28)" font-size="9" font-family="monospace">${formatAxisPrice(min)}</text>

      <!-- Área y Trazo Suavizado Ultrafino -->
      <path d="${dArea}" fill="url(#${fillGradientId})" />
      <path d="${dLine}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Punto final actual -->
      <circle cx="${endX.toFixed(2)}" cy="${getY(lastPrice).toFixed(2)}" r="3.5" fill="${strokeColor}" stroke="#0c1015" stroke-width="1.5" />

      <!-- Píldora de precio actual anclada al eje derecho (TradingView Style) -->
      <rect x="${width - padRight + 4}" y="${(lastPriceY - 8).toFixed(2)}" width="52" height="16" rx="2.5" fill="${strokeColor}" />
      <text x="${width - padRight + 30}" y="${(lastPriceY + 3).toFixed(2)}" fill="#000000" font-size="9" font-family="monospace" text-anchor="middle" font-weight="900">${formatAxisPrice(lastPrice)}</text>

      <!-- Punto interactivo activo en hover continuo -->
      <circle id="modalHoverDot" cx="0" cy="0" r="3.5" fill="#ffffff" stroke="${strokeColor}" stroke-width="1.5" class="hidden pointer-events-none" />
    `

  const hideOverlays = () => {
    hideModalChartOverlays(crosshairX, crosshairY, badgeX, badgeY, tooltip, ["modalHoverDot"])
  }

  const updateAtPointer = (e: PointerEvent) => {
    const rect = svgArea.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const svgX = (mouseX / (rect.width || 1)) * width
    const clampedSvgX = Math.max(padLeft, Math.min(width - padRight, svgX))

    if (clampedSvgX < startX - 3) {
      hideModalChartOverlays(crosshairX, crosshairY, badgeX, badgeY, tooltip, ["modalHoverDot"])
      return
    }

    const activeSvgX = Math.max(startX, Math.min(endX, clampedSvgX))
    const activeWidth = endX - startX || 1
    const progress = Math.max(0, Math.min(1, (activeSvgX - startX) / activeWidth))

    const totalSegments = Math.max(1, validData.length - 1)
    const exactIndex = progress * totalSegments
    const i0 = Math.min(totalSegments - 1, Math.floor(exactIndex))
    const t = exactIndex - i0

    const val = getCatmullRomVal(validData, i0, t)
    const ptSvgX = activeSvgX
    const ptSvgY = Math.max(padTop - 8, Math.min(height - padBottom + 8, getY(val)))

    const pxX = (ptSvgX / width) * rect.width
    const pxY = (ptSvgY / height) * rect.height
    const pxYCursor = Math.max(0, Math.min(rect.height, mouseY))
    const svgYCursor = (pxYCursor / (rect.height || 1)) * height
    const cursorPrice = min + (1 - (svgYCursor - padTop) / (height - padTop - padBottom)) * range

    if (crosshairX) {
      crosshairX.style.left = `${pxX}px`
      crosshairX.classList.remove("hidden")
    }
    if (crosshairY) {
      crosshairY.style.top = `${pxYCursor}px`
      crosshairY.classList.remove("hidden")
    }
    if (badgeY) {
      badgeY.style.top = `${pxYCursor}px`
      badgeY.textContent = formatAxisPrice(cursorPrice)
      badgeY.classList.remove("hidden")
    }

    const hoverDot = document.getElementById("modalHoverDot")
    if (hoverDot) {
      hoverDot.setAttribute("cx", ptSvgX.toFixed(2))
      hoverDot.setAttribute("cy", ptSvgY.toFixed(2))
      hoverDot.setAttribute("stroke", strokeColor)
      hoverDot.classList.remove("hidden")
    }

    if (tooltip) {
      const usdVal = val * sflUsd
      const dateLabel = formatChartDateLabel(totalSegments - exactIndex, ctx.clientLang)

      if (badgeX) {
        badgeX.style.left = `${pxX}px`
        badgeX.textContent = dateLabel
        badgeX.classList.remove("hidden")
      }

      tooltip.innerHTML = `
          <div class="flex items-center gap-1.5 font-bold">
            <img src="/img/sunflowerland/flower.jpg" class="w-3.5 h-3.5 rounded-full object-cover" />
            <span class="text-white">${ctx.formatModalPrice(val)} FLOWER</span>
          </div>
          <div class="text-[10px] text-white/50 mt-0.5 flex justify-between gap-3">
            <span>${ctx.formatModalUsd(usdVal)}</span>
            <span class="text-cyan-400 font-bold">${dateLabel}</span>
          </div>
        `
      positionModalTooltip(tooltip, pxX, pxY - 35, rect)
    }
  }

  bindChartPointerHandlers(svgArea, updateAtPointer, hideOverlays)
}

function bindModalResizeObserver(): void {
  if (activeResizeObserver) {
    activeResizeObserver.disconnect()
    activeResizeObserver = null
  }
  if (typeof ResizeObserver === "undefined") return

  const svgAreaObs = document.getElementById("modalChartSvgArea")
  if (!svgAreaObs) return

  activeResizeObserver = new ResizeObserver((entries) => {
    if (!activeModalItem) return
    const entry = entries[0]
    if (!entry) return
    const w = Math.round(entry.contentRect.width)
    const h = Math.round(entry.contentRect.height)
    if (
      w > 40 &&
      h > 40 &&
      (Math.abs(w - lastRenderedSvgW) > 2 || Math.abs(h - lastRenderedSvgH) > 2)
    ) {
      if (chartResizeTimer) clearTimeout(chartResizeTimer)
      chartResizeTimer = setTimeout(() => {
        if (activeModalItem && window.setModalGraphPeriod) {
          window.setModalGraphPeriod(activeModalPeriod)
        }
      }, 40)
    }
  })
  activeResizeObserver.observe(svgAreaObs)
}

function bindGlobalModalListeners(): void {
  if (globalListenersBound) return
  globalListenersBound = true

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("modalCompareDropdown")
    const compContainer = document.getElementById("modalCompareContainer")
    if (!dropdown || dropdown.classList.contains("hidden")) return
    const target = e.target as Node | null
    if (target && dropdown.contains(target)) return
    if (target && compContainer && compContainer.contains(target)) return
    if (window.toggleCompareDropdown) window.toggleCompareDropdown(false)
  })

  document.addEventListener("pointerdown", (e) => {
    if (!activeModalItem || !activeHideOverlays) return
    const svgArea = document.getElementById("modalChartSvgArea")
    const target = e.target as Node | null
    if (svgArea && target && !svgArea.contains(target)) {
      activeHideOverlays()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && window.closeTradingModal) {
      window.closeTradingModal()
    }
  })
}

export function initSflTradingModal(ctx: ModalChartContext): void {
  activeCtx = ctx
  activeModalItem = null
  compareModalItems = []
  lastRenderedSvgW = 0
  lastRenderedSvgH = 0

  window.toggleCompareDropdown = (forceState?: boolean) => {
    const dropdown = document.getElementById("modalCompareDropdown")
    if (!dropdown) return
    const isHidden = dropdown.classList.contains("hidden")
    const show = typeof forceState === "boolean" ? forceState : isHidden
    if (show) {
      dropdown.classList.remove("hidden")
      dropdown.classList.add("flex")
      const searchInput = document.getElementById(
        "modalCompareSearchInput",
      ) as HTMLInputElement | null
      if (searchInput) {
        searchInput.value = ""
        setTimeout(() => searchInput.focus(), 60)
      }
      if (window.filterCompareList) window.filterCompareList("")
    } else {
      dropdown.classList.add("hidden")
      dropdown.classList.remove("flex")
    }
  }

  window.filterCompareList = (query: string) => {
    const currentCtx = activeCtx
    if (!currentCtx) return
    const listEl = document.getElementById("modalCompareItemsList")
    if (!listEl) return
    const q = (query || "").trim().toLowerCase()

    const currentItemKey = activeModalItem ? activeModalItem.key || activeModalItem.name : ""
    const selectedKeys = new Set(compareModalItems.map((i) => i.key || i.name))
    selectedKeys.add(currentItemKey)

    if (compareModalItems.length >= 4) {
      listEl.innerHTML = `<div class="p-3 text-center text-cyan-400/80 font-mono text-xs">${currentCtx.labels.maxCompare}</div>`
      return
    }

    const availableItems = (currentCtx.getMarketData() || []).filter((item) => {
      const k = item.key || item.name
      return !selectedKeys.has(k)
    })

    const filtered = q
      ? availableItems.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.category && item.category.toLowerCase().includes(q)),
        )
      : availableItems

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="p-3 text-center text-white/40 text-xs">${currentCtx.labels.noItemsFound}</div>`
      return
    }

    filtered.sort((a, b) => (b.volume7d || 0) - (a.volume7d || 0))

    listEl.innerHTML = filtered
      .slice(0, 40)
      .map((item) => {
        const isBuds = item.category === "buds"
        const imgSrc = currentCtx.getItemImageSrc(item)
        const priceStr = currentCtx.formatModalPrice(item.currentPrice)
        const safeKey = (item.key || item.name).replace(/'/g, "\\'")
        return `
        <div
          onclick="window.selectCompareItem('${safeKey}')"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded bg-black/60 border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
              <img src="${imgSrc}" class="w-full h-full object-contain pixelated ${isBuds ? "scale-150" : ""}" />
            </div>
            <div class="min-w-0">
              <div class="font-bold text-white text-xs truncate group-hover:text-cyan-400 transition-colors">${item.name}</div>
              <div class="text-[9.5px] text-white/40 uppercase font-mono">${item.category}</div>
            </div>
          </div>
          <div class="text-right font-mono text-xs shrink-0 pl-2">
            <span class="text-white font-bold">${priceStr}</span>
            <span class="text-[9px] text-white/40 block">FLOWER</span>
          </div>
        </div>
      `
      })
      .join("")
  }

  window.selectCompareItem = (itemKey: string) => {
    const currentCtx = activeCtx
    if (!currentCtx || compareModalItems.length >= 4) return
    const item = (currentCtx.getMarketData() || []).find((i) => (i.key || i.name) === itemKey)
    if (!item) return
    const k = item.key || item.name
    if (compareModalItems.some((i) => (i.key || i.name) === k)) return
    compareModalItems.push(item)
    if (window.toggleCompareDropdown) window.toggleCompareDropdown(false)
    updateCompareUI()
    if (window.setModalGraphPeriod) window.setModalGraphPeriod(activeModalPeriod)
  }

  window.removeCompareItem = (itemKey: string) => {
    compareModalItems = compareModalItems.filter((i) => (i.key || i.name) !== itemKey)
    updateCompareUI()
    if (window.setModalGraphPeriod) window.setModalGraphPeriod(activeModalPeriod)
  }

  window.clearModalComparison = () => {
    compareModalItems = []
    updateCompareUI()
    if (window.setModalGraphPeriod) window.setModalGraphPeriod(activeModalPeriod)
  }

  window.openTradingModal = (item: MarketItemRecord) => {
    const currentCtx = activeCtx
    if (!item || !currentCtx) return
    activeModalItem = item
    compareModalItems = []
    updateCompareUI()
    if (window.toggleCompareDropdown) window.toggleCompareDropdown(false)
    activeModalPeriod = "7d"

    const modal = document.getElementById("tradingModal")
    if (!modal) return

    // 1. Cabecera
    const imgEl = document.getElementById("modalItemImg") as HTMLImageElement | null
    const nameEl = document.getElementById("modalItemName")
    const badgeEl = document.getElementById("modalItemCategoryBadge")
    const subTitleEl = document.getElementById("modalItemSubtitle")

    if (imgEl) {
      imgEl.src = currentCtx.getItemImageSrc(item)
      imgEl.alt = item.name
      const imgContainer = document.getElementById("modalItemImgContainer")
      imgEl.style.imageRendering = "pixelated"
      if (item.category === "buds") {
        imgEl.style.transform = "scale(2.25)"
        if (imgContainer) {
          imgContainer.className =
            "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/80 border border-cyan-500/40 flex items-center justify-center p-0 overflow-hidden shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        }
      } else {
        imgEl.style.transform = "none"
        if (imgContainer) {
          imgContainer.className =
            "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner"
        }
      }
    }
    if (nameEl) nameEl.textContent = item.name
    if (badgeEl) {
      badgeEl.textContent =
        item.category === "buds"
          ? "Buds NFT"
          : item.category === "powerups"
            ? "Power Up"
            : item.category === "cosmetics"
              ? "Cosmetic"
              : "Resource"
      badgeEl.className = `text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${item.category === "buds" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"}`
    }
    const boostsContainer = document.getElementById("modalItemBoostsContainer")
    if (boostsContainer) {
      boostsContainer.innerHTML = ""
      boostsContainer.classList.add("hidden")
    }

    if (subTitleEl) {
      if (item.category === "buds") {
        const bId = item.budId || item.name.replace(/\D/g, "")
        const trait = item.budTraits || {}
        const metaParts: string[] = []
        const type = trait.type || item.type || ""
        const stem = trait.stem || item.stem || ""
        const aura = trait.aura || item.aura || ""
        const ears = trait.ears || item.ears || ""
        if (type) metaParts.push(type)
        if (stem) metaParts.push(stem)
        if (aura) metaParts.push(`Aura ${aura}`)
        if (ears) metaParts.push(ears)
        const traitText = metaParts.length > 0 ? metaParts.join(" • ") : `NFT #${bId}`
        subTitleEl.innerHTML = `<span class="text-white/60">${traitText}</span>`

        // Badges ordenados para potenciadores
        let mainB = trait.mainBoost || item.mainBoost || ""
        let stemB = trait.stemBoost || item.stemBoost || ""
        let auraB = trait.auraBoost || item.auraBoost || ""

        if (!mainB && item.boost) {
          const parts = item.boost.split(" | ")
          parts.forEach((p) => {
            const cleanP = p.replace(/^\(|\)$/g, "").trim()
            if (cleanP.includes("Stem:")) stemB = cleanP
            else if (cleanP.includes("Aura")) auraB = cleanP
            else if (!mainB) mainB = cleanP
          })
        }

        const badgesHtml: string[] = []
        if (mainB) {
          badgesHtml.push(
            `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10.5px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)] shrink-0"><img src="/img/sunflowerland/123/energy.png" alt="Boost" class="w-3.5 h-3.5 object-contain pixelated shrink-0 inline-block" /><span>${mainB}</span></span>`,
          )
        }
        if (stemB) {
          const cleanStem = stemB.replace(/^Stem:\s*/i, "")
          const stemLabel = currentCtx.labels.stemLabel
          badgesHtml.push(
            `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10.5px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0"><span class="text-[11px] leading-none">🌱</span><span>${stemLabel}: ${cleanStem}</span></span>`,
          )
        }
        if (auraB) {
          const cleanAura = auraB.replace(/^\(|\)$/g, "").trim()
          badgesHtml.push(
            `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10.5px] font-bold shadow-[0_0_10px_rgba(168,85,247,0.1)] shrink-0"><span class="text-[11px] leading-none">✨</span><span>${cleanAura}</span></span>`,
          )
        }

        if (boostsContainer && badgesHtml.length > 0) {
          boostsContainer.innerHTML = badgesHtml.join("")
          boostsContainer.classList.remove("hidden")
        }
      } else if (item.category === "powerups" && item.boost) {
        const itemTypeLabel = item.isWearable ? "Wearable" : currentCtx.labels.collectible
        subTitleEl.textContent = `Sunflower Land • ${itemTypeLabel}`

        const parts = currentCtx.parseBoosts(item.boost)
        const badgesHtml = parts.map((part) => {
          const isCondition = /^(?:Disabled|requires|Affects)/i.test(part)
          const iconHtml = isCondition
            ? `<span class="text-[11px] leading-none">ℹ️</span>`
            : `<img src="/img/sunflowerland/123/energy.png" alt="Boost" class="w-3.5 h-3.5 object-contain pixelated shrink-0 inline-block" />`
          const colorClasses = isCondition
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${colorClasses} font-mono text-[10.5px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0">${iconHtml}<span>${part}</span></span>`
        })

        if (boostsContainer && badgesHtml.length > 0) {
          boostsContainer.innerHTML = badgesHtml.join("")
          boostsContainer.classList.remove("hidden")
        }
      } else {
        subTitleEl.textContent = "Sunflower Land P2P"
      }
    }

    // 2. KPIs
    const floorPriceEl = document.getElementById("modalFloorPrice")
    const floorUsdEl = document.getElementById("modalFloorUsd")
    const change24hEl = document.getElementById("modalChange24h")
    const pastPriceEl = document.getElementById("modalPastPrice")
    const vol7dEl = document.getElementById("modalVolume7d")
    const vol7dUsdEl = document.getElementById("modalVolume7dUsd")
    const tradesCountEl = document.getElementById("modalTradesCount")
    const supplyEl = document.getElementById("modalSupply")

    const sflUsd = currentCtx.getSflUsdPrice() || 0.085
    if (floorPriceEl) {
      floorPriceEl.textContent =
        item.currentPrice > 0 ? currentCtx.formatModalPrice(item.currentPrice) : "--"
    }
    if (floorUsdEl) {
      floorUsdEl.textContent =
        item.currentPrice > 0 ? currentCtx.formatModalUsd(item.currentPrice * sflUsd) : "$0.00"
    }

    const chg24 = currentCtx.calculateChange(
      item.currentPrice,
      item.history ? item.history["1d"] : null,
    )
    if (change24hEl) {
      if (chg24.isPositive === null) {
        change24hEl.textContent = "-"
        change24hEl.className = "text-xs sm:text-sm font-bold font-mono leading-none text-white/40"
      } else {
        change24hEl.textContent = chg24.text
        change24hEl.className = `text-xs sm:text-sm font-bold font-mono leading-none ${chg24.isPositive ? "text-emerald-400" : "text-red-400"}`
      }
    }
    if (pastPriceEl) {
      pastPriceEl.textContent = chg24.pastPrice
        ? `Prev: ${currentCtx.formatModalPrice(chg24.pastPrice)}`
        : "Prev: --"
    }

    if (vol7dEl) {
      vol7dEl.textContent = item.volume7d ? currentCtx.formatNumber(item.volume7d, 0) : "0"
    }
    if (vol7dUsdEl) {
      vol7dUsdEl.textContent = item.volume7dUsd
        ? `~$${currentCtx.formatNumber(item.volume7dUsd, 0)}`
        : item.volume7d
          ? `~$${currentCtx.formatNumber(item.volume7d * sflUsd, 0)}`
          : "$0"
    }

    if (tradesCountEl) {
      tradesCountEl.textContent =
        item.trades7d !== undefined
          ? currentCtx.formatNumber(item.trades7d, 0)
          : String(item.trades || 0)
    }
    if (supplyEl) {
      supplyEl.textContent =
        item.category === "buds"
          ? `${currentCtx.labels.supply}: 1 NFT`
          : `${currentCtx.labels.supply}: ${item.supply !== undefined ? currentCtx.formatNumber(item.supply, 0) : "∞"}`
    }

    // 3. Mostrar Modal
    modal.classList.remove("hidden")
    modal.classList.add("flex")
    document.body.style.overflow = "hidden"

    // 4. Render Chart
    if (window.setModalGraphPeriod) window.setModalGraphPeriod("7d")
  }

  window.closeTradingModal = () => {
    const modal = document.getElementById("tradingModal")
    if (!modal) return
    modal.classList.add("hidden")
    modal.classList.remove("flex")
    document.body.style.overflow = ""
    activeModalItem = null
    compareModalItems = []
    lastRenderedSvgW = 0
    lastRenderedSvgH = 0
    if (activeHideOverlays) {
      activeHideOverlays()
      activeHideOverlays = null
    }
    updateCompareUI()
    if (window.toggleCompareDropdown) window.toggleCompareDropdown(false)
  }

  window.setModalGraphPeriod = (period: GraphPeriod) => {
    activeModalPeriod = period
    document.querySelectorAll(".modal-period-btn").forEach((b) => {
      b.classList.remove("bg-white/10", "text-white")
      b.classList.add("text-white/40")
    })
    const btn = document.getElementById(`modalBtn${period}`)
    if (btn) {
      btn.classList.add("bg-white/10", "text-white")
      btn.classList.remove("text-white/40")
    }
    const badge = document.getElementById("modalPeriodBadge")
    if (badge) badge.textContent = period.toUpperCase()

    if (activeModalItem && activeModalItem.history) {
      const sparkKey = `sparkline${period}` as "sparkline7d" | "sparkline30d" | "sparkline180d"
      const rawPoints = activeModalItem.history[sparkKey] || []
      renderModalChart(rawPoints, period, activeModalItem.currentPrice)
    }
  }

  bindGlobalModalListeners()
  bindModalResizeObserver()
}
