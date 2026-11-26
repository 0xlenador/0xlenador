// ============================================================================
// src/lib/sfl/marketView.ts
// Controlador principal tipado para SflMarketView.astro: carga de datos,
// filtros, búsqueda, ordenamiento, paginación infinita, fila $FLOWER,
// lazy-render móvil, sticky header e indicadores de scroll.
// ============================================================================

import bettyPricesRaw from "../../content/data/sfl/betty_prices.json"
import sflCosmeticsRaw from "../../content/data/sfl/cosmetics.json"
import sflPowerUpsRaw from "../../content/data/sfl/powerups.json"
import sflIdsRaw from "../../content/data/sfl/resources.json"
import { createSparklineSVG, formatNumber, initSparklineHover } from "../../utils/sparklines"
import { calculateOilDrillCost, DEFAULT_OIL_MULTIPLIER } from "./constants"
import * as SflMarket from "./market"
import {
  initSflTradingModal,
  type BudTraits,
  type ChangeResult,
  type GraphPeriod,
  type MarketItemHistory,
  type ModalChartLabels,
} from "./marketChart"
import {
  initSflMarketDashboard,
  renderSflDashboard,
  updateDash61Changes,
  type BudsSummary,
  type CoinGeckoDataMap,
  type DashboardLabels,
  type DashboardMarketItem,
  type MarketDashboardData,
} from "./marketDashboard"

export interface SflMarketTableLabels {
  emptySearch: string
  colPrice: string
  col24h: string
  col7d: string
  col30d: string
  col180d: string
  colMarketcap: string
  hideFlower: string
  modalViewChart: string
}

export interface SflMarketConfig {
  clientLang: string
  tableLabels: SflMarketTableLabels
  dashboardLabels: DashboardLabels
  modalLabels: ModalChartLabels
}

interface CatalogItemMeta {
  name: string
  boost?: string
  image?: string
  supply?: number
}

interface PowerUpsCatalog {
  power_ups: {
    collectibles?: Record<string, CatalogItemMeta>
    wearables?: Record<string, CatalogItemMeta>
  }
}

interface CosmeticsCatalog {
  cosmetics?: {
    collectibles?: Record<string, CatalogItemMeta>
    wearables?: Record<string, CatalogItemMeta>
  }
}

type BettyPricesMap = Record<string, { sellPrice: number }>

interface RawApiMarketItem {
  key: string
  currentPrice: number
  supply?: number
  trades?: number
  trades7d?: number
  volume?: number
  volume7d?: number
  volume7dUsd?: number
  volume24h?: number
  boost?: string
  type?: string
  stem?: string
  aura?: string
  ears?: string
  colour?: string
  mainBoost?: string
  stemBoost?: string
  auraBoost?: string
  history?: MarketItemHistory
  [k: string]: unknown
}

interface RawBudsApiResponse {
  items?: Record<string, RawApiMarketItem>
}

interface RawMarketApiResponse {
  flowerPrice?: string | number
  budsSummary?: BudsSummary
  items: Record<string, RawApiMarketItem>
}

interface MarketRowElement extends HTMLDivElement {
  _itemData?: DashboardMarketItem
  _isFlowerRow?: boolean
}

interface SortState {
  column: string
  direction: "none" | "asc" | "desc"
}

type SubCategory = "collectibles" | "wearables"

declare global {
  interface Window {
    activeGraphPeriod?: GraphPeriod
    toggleGraph?: (period: GraphPeriod) => void
    currentSort?: SortState
    isUserSorted?: boolean
    __budsLoaded?: boolean
    __budsLoading?: boolean
    loadBudsData?: () => Promise<void>
    handleCategory?: (category: string) => Promise<void>
    toggleSubCategory?: (subCategory: SubCategory) => void
    handleSort?: (column: string) => void
    scrollToItem?: (itemName: string, event?: Event) => void
    reRenderTable?: () => void
    closeFlowerRow?: () => void
    __showFlowerRow?: boolean
    __flowerData?: DashboardMarketItem
    __currentFilteredData?: DashboardMarketItem[]
    __sflMarketInitialized?: boolean
    __sflVisibilityListenerRegistered?: boolean
  }
}

const sflIds = sflIdsRaw as Record<string, string>
const sflPowerUps = sflPowerUpsRaw as PowerUpsCatalog
const sflCosmetics = sflCosmeticsRaw as CosmeticsCatalog
const bettyPrices = bettyPricesRaw as BettyPricesMap

const ITEMS_PER_PAGE = 30
const SPARKLINE_KEYS: readonly ("sparkline7d" | "sparkline30d" | "sparkline180d")[] = [
  "sparkline7d",
  "sparkline30d",
  "sparkline180d",
]

let activeConfig: SflMarketConfig | null = null
let marketData: DashboardMarketItem[] = []
let dashboardData: MarketDashboardData | null = null
let currentCategory = "resources"
let currentSubCategories: SubCategory[] = ["collectibles", "wearables"]
let currentPage = 1
let loadMoreObserver: IntersectionObserver | null = null
let stickyHeaderObserver: IntersectionObserver | null = null
let scrollHintsAborter: AbortController | null = null
let globalHooksBound = false
let lifecycleListenersBound = false

let searchInput: HTMLInputElement | null = null
let tableBody: HTMLElement | null = null
let searchIcon: HTMLElement | null = null
let clearSearchBtn: HTMLElement | null = null
let fetchBtn: HTMLButtonElement | null = null
let loadingState: HTMLElement | null = null
let errorState: HTMLElement | null = null
let errorMsg: HTMLElement | null = null
let dataContainer: HTMLElement | null = null

function readMarketConfig(): SflMarketConfig | null {
  const configEl = document.getElementById("sflMarketConfig")
  if (!configEl?.textContent) return null
  try {
    return JSON.parse(configEl.textContent) as SflMarketConfig
  } catch (err) {
    console.error("[marketView] Error al leer sflMarketConfig:", err)
    return null
  }
}

function refreshDomRefs(): void {
  searchInput = document.getElementById("searchInput") as HTMLInputElement | null
  tableBody = document.getElementById("tableBody")
  searchIcon = document.getElementById("searchIcon")
  clearSearchBtn = document.getElementById("clearSearchBtn")
  fetchBtn = document.getElementById("fetchBtn") as HTMLButtonElement | null
  loadingState = document.getElementById("loadingState")
  errorState = document.getElementById("errorState")
  errorMsg = document.getElementById("errorMsg")
  dataContainer = document.getElementById("dataContainer")
}

const getItemImageSrc = (item: DashboardMarketItem | undefined): string => {
  if (!item) return "/img/sunflowerland/123/bear.png"
  if (item.category === "buds") {
    return (
      item.image ||
      (item.budId
        ? `https://buds.sunflower-land.com/nfts/${item.budId}.gif`
        : "/img/sunflowerland/123/bud.png")
    )
  }
  const basePath = "/img/sunflowerland/"
  if (item.category === "powerups") {
    return encodeURI(
      basePath +
        "powerups/" +
        (item.isWearable ? "wearables/" : "") +
        (item.image || item.name + ".png"),
    )
  }
  if (item.category === "cosmetics") {
    const isCollectible = !item.isWearable
    let fn = item.image || item.name + ".png"
    if (isCollectible) {
      fn = fn.replace(/\.png$/i, ".webp")
    }
    return encodeURI(
      basePath + "cosmetics/" + (item.isWearable ? "wearables/" : "collectibles/") + fn,
    )
  }
  // Resources: soporta tanto legacy .png como nuevos .webp en snake_case
  const name = item.name || ""
  const webpResources = new Set([
    "green beetle",
    "blue beetle",
    "pink beetle",
    "amber beetle",
    "pig bristle",
    "pig bristles",
    "truffle",
  ])
  const lower = name.toLowerCase()
  if (webpResources.has(lower)) {
    const snake = lower.replace(/\s+/g, "_").replace(/^pig_bristle$/, "pig_bristles")
    return encodeURI(basePath + snake + ".webp")
  }
  return encodeURI(basePath + name + ".png")
}

const parseBoosts = (str: string): string[] => {
  if (!str) return []
  const parts: string[] = []
  let current = ""
  let parenDepth = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === "(") parenDepth++
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1)

    if (parenDepth === 0 && (ch === "," || ch === "|")) {
      const rest = str.slice(i + 1).trim()
      if (
        /^(?:[+-]|x\d|\d+[%x]|\d+\s+|Disabled|Free|Affects|requires|Blessed|Speed|[A-Z][a-z]+\s+(?:Disaster|Events|Recovery))/i.test(
          rest,
        )
      ) {
        if (current.trim()) parts.push(current.trim())
        current = ""
        continue
      }
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

const getTableBoostHTML = (item: DashboardMarketItem): string => {
  if (!item.boost || (item.category !== "powerups" && item.category !== "buds")) return ""
  let parts: string[] = []
  if (item.category === "buds") {
    parts = item.boost
      .split(" | ")
      .map((p) => p.replace(/^\(|\)$/g, "").trim())
      .filter(Boolean)
  } else {
    parts = parseBoosts(item.boost)
  }
  if (parts.length === 0) return ""
  const textColor = item.category === "buds" ? "text-cyan-400/90 font-mono" : "text-emerald-400/80"
  const linesHtml = parts.map((p) => `<span class="block truncate">${p}</span>`).join("")
  return `<div class="text-[9px] ${textColor} leading-[1.1] mt-[1px]" title="${item.boost}">${linesHtml}</div>`
}

const formatModalPrice = (p: number): string => {
  if (typeof p !== "number" || isNaN(p) || p <= 0) return "--"
  const dec = p < 0.09 ? 4 : 2
  return formatNumber(p, dec)
}

const formatModalUsd = (p: number): string => {
  if (typeof p !== "number" || isNaN(p) || p <= 0) return "$0.00"
  const dec = p < 0.09 ? 4 : 2
  return `~$${formatNumber(p, dec)}`
}

const calculateChange = (current: number, past: number | null | undefined): ChangeResult => {
  if (!past || past === 0 || !current) {
    return { val: 0, text: "-", isPositive: null, pastPrice: null }
  }
  const change = ((current - past) / past) * 100
  const isPositive = change >= 0
  const displayText =
    Math.abs(change) > 9999
      ? isPositive
        ? ">9999%"
        : "<-9999%"
      : `${isPositive ? "+" : ""}${change.toFixed(2)}%`
  return {
    val: Math.min(Math.max(change, -9999), 9999),
    text: displayText,
    isPositive,
    pastPrice: past,
  }
}

const getBadgeHTML = (changeObj: ChangeResult, isLarge = false): string => {
  if (changeObj.isPositive === null) {
    return '<span class="text-terminal-muted/50 font-mono text-xs">-</span>'
  }
  const colorClass = changeObj.isPositive
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-red-500 bg-red-500/10 border-red-500/20"

  const containerClass = isLarge
    ? `text-[11px] font-bold font-mono px-1.5 py-[2px] rounded border ${colorClass} inline-flex items-center whitespace-nowrap shrink-0 leading-none`
    : `text-[10px] lg:text-[11px] font-bold font-mono px-0.5 py-[1px] lg:px-1 lg:py-[2px] rounded-sm lg:rounded border ${colorClass} inline-flex items-center whitespace-nowrap shrink-0 leading-none`

  return `
      <span class="${containerClass}">
        ${changeObj.text}
      </span>
  `
}

const getCardColumnHTML = (
  title: string,
  changeObj: ChangeResult,
  sparklineData: (number | null | undefined)[] | undefined,
  expectedLength: number,
  isHourly = false,
  currentPrice = 0,
): string => {
  const isLarge = !sparklineData
  const badgeHTML = getBadgeHTML(changeObj, isLarge)

  let percentHTML = ""
  if (changeObj.isPositive === null) {
    percentHTML =
      '<span class="text-white/30 font-sans text-[13px] font-medium shrink-0 leading-none">-</span>'
  } else {
    const colorClass = changeObj.isPositive ? "text-emerald-500" : "text-red-500"
    percentHTML = `
      <span class="text-[13px] font-medium font-sans shrink-0 leading-none ${colorClass}">
        ${changeObj.text}
      </span>
    `
  }

  if (isLarge) {
    return `
      <div class="flex flex-col justify-between lg:flex-row lg:items-center lg:justify-end bg-terminal-bg/50 lg:bg-transparent p-3 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full h-full lg:px-4">
        <div class="flex justify-between items-center mb-2 w-full lg:hidden">
          <p class="text-[10px] font-mono text-terminal-muted uppercase font-semibold">${title}</p>
          ${percentHTML}
        </div>
        <div class="flex justify-center lg:justify-end w-full">
          ${badgeHTML}
        </div>
      </div>
    `
  }

  // Garantizar que el último punto de la gráfica coincida exactamente con el precio actual del ítem
  let syncedSparkline = sparklineData
  if (Array.isArray(sparklineData) && sparklineData.length > 0 && currentPrice > 0) {
    if (sparklineData[sparklineData.length - 1] !== currentPrice) {
      syncedSparkline = [...sparklineData]
      syncedSparkline[syncedSparkline.length - 1] = currentPrice
    }
  }

  const sparkSVG = createSparklineSVG(
    syncedSparkline || [],
    changeObj.isPositive ?? false,
    expectedLength,
    isHourly,
  )

  return `
    <div class="flex flex-col justify-between lg:flex-row lg:items-center bg-terminal-bg/50 lg:bg-transparent p-3 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full h-full lg:h-auto">
      <div class="flex justify-between items-center mb-2 w-full lg:hidden">
        <p class="text-[10px] font-mono text-terminal-muted uppercase font-semibold">${title}</p>
        ${percentHTML}
      </div>
      <div class="w-full lg:hidden flex-grow flex flex-col justify-end">
        <div class="h-8 w-full flex items-center">${sparkSVG}</div>
      </div>
      <div class="hidden lg:flex flex-row items-center justify-end gap-3 w-full lg:px-4">
        ${percentHTML}
        <div class="h-8 lg:h-10 w-[170px] xl:w-[195px] shrink-0 flex items-center">
          ${sparkSVG}
        </div>
      </div>
    </div>
  `
}

const getTextColumnHTML = (title: string, changeObj: ChangeResult): string => {
  let textHTML = ""
  if (changeObj.isPositive === null) {
    textHTML = '<span class="text-white/30 font-sans text-[13px] font-medium">-</span>'
  } else {
    const colorClass = changeObj.isPositive ? "text-emerald-500" : "text-red-500"
    textHTML = `
      <span class="text-[13px] font-medium font-sans inline-flex items-center whitespace-nowrap shrink-0 leading-none ${colorClass}">
        ${changeObj.text}
      </span>
    `
  }

  return `
      <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
        <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">${title}</p>
        <div class="flex justify-center lg:justify-end w-full">
          ${textHTML}
        </div>
      </div>
  `
}

const getSupplyColumnHTML = (
  title: string,
  supply: number | undefined,
  exactUsdValue?: number,
): string => {
  const text = supply !== undefined ? formatNumber(supply, 0) : "-"
  const usdValue = exactUsdValue !== undefined ? formatNumber(exactUsdValue, 0) : ""
  const containerClass =
    "text-[13px] font-medium font-sans text-white/90 inline-flex items-center whitespace-nowrap shrink-0 leading-none"
  const badgeHTML = `
      <div class="flex flex-col items-end">
        <span class="${containerClass}">
          ${text}
        </span>
        ${usdValue ? `<span class="text-[9.5px] font-mono text-white/40 mt-1">~$${usdValue}</span>` : ""}
      </div>
  `
  return `
      <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
        <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">${title}</p>
        <div class="flex justify-center lg:justify-end w-full">
          ${badgeHTML}
        </div>
      </div>
  `
}

const getVolColumnHTML = (title: string, item: DashboardMarketItem, clientLang: string): string => {
  const usdValue = item.volume7dUsd !== undefined ? formatNumber(item.volume7dUsd, 0) : ""
  const flowerValue = item.volume7d !== undefined ? formatNumber(item.volume7d, 0) : "-"
  const unitsValue = item.trades7d !== undefined ? formatNumber(item.trades7d, 0) : "-"
  const containerClass =
    "text-[13px] font-medium font-sans text-white/90 inline-flex items-center whitespace-nowrap shrink-0 leading-none"
  const tUnits = clientLang === "es" ? "UND" : "UN"

  const badgeHTML = `
      <div class="flex flex-col items-end">
        <span class="${containerClass}">
          <span class="vol-flower flex items-center gap-1.5">
            <img src="/img/sunflowerland/flower.jpg" alt="FLOWER" class="w-3.5 h-3.5 rounded-full drop-shadow-sm border border-emerald-500/20" />
            ${flowerValue}
          </span>
          <span class="vol-units flex items-center gap-1"><span class="text-[10px] text-white/30">${tUnits}</span> ${unitsValue}</span>
        </span>
        ${usdValue ? `<span class="text-[9.5px] font-mono text-white/40 mt-1">~$${usdValue}</span>` : ""}
      </div>
  `
  return `
      <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
        <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">${title}</p>
        <div class="flex justify-center lg:justify-end w-full">
          ${badgeHTML}
        </div>
      </div>
  `
}

const getMarketcapColumnHTML = (title: string, mcap: number | undefined): string => {
  const text = mcap !== undefined ? formatNumber(mcap, 0) : "-"
  const usdValue =
    mcap !== undefined && window.sflUsdPrice ? formatNumber(mcap * window.sflUsdPrice, 0) : ""
  const containerClass =
    "text-[13px] font-medium font-sans text-white/90 inline-flex items-center whitespace-nowrap shrink-0 leading-none"
  const badgeHTML = `
      <div class="flex flex-col items-end">
        <span class="${containerClass}">
          ${mcap !== undefined ? '<img src="/img/sunflowerland/flower.jpg" class="w-2.5 h-2.5 mr-1.5 rounded-full object-cover" alt="FLOWER" style="transform: translateY(-0.5px);" />' : ""}
          ${text}
        </span>
        ${usdValue ? `<span class="text-[9.5px] font-mono text-white/40 mt-1">~$${usdValue}</span>` : ""}
      </div>
  `
  return `
      <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
        <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">${title}</p>
        <div class="flex justify-center lg:justify-end w-full">
          ${badgeHTML}
        </div>
      </div>
  `
}

const createFlowerRow = (
  item: DashboardMarketItem,
  labels: SflMarketTableLabels,
): MarketRowElement => {
  const row = document.createElement("div") as MarketRowElement
  row._itemData = item
  row._isFlowerRow = true
  row.className =
    "hover:bg-emerald-500/10 transition-colors group flex flex-col justify-between border border-emerald-500/20 bg-emerald-500/5 rounded-[20px] p-3 lg:p-0 lg:border-emerald-500/20 lg:border-b last:lg:border-b-0 lg:bg-emerald-500/5 lg:rounded-none lg:grid lg:grid-cols-[22%_10%_8%_11%_12%_10%_27%] lg:items-center lg:py-3 relative"
  row.setAttribute("data-row-id", item.name)

  const past1d = item.history?.["1d"]
  const color24h = past1d
    ? item.currentPrice >= past1d
      ? "bg-emerald-500"
      : "bg-red-500"
    : "bg-terminal-muted/30"

  row.innerHTML = `
    <!-- Botón X Flotante -->
    <button onclick="window.closeFlowerRow()" class="absolute top-2 right-2 lg:top-2 lg:right-2 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-terminal-muted hover:text-white hover:bg-red-500/80 transition-colors z-30 pointer-events-auto" title="${labels.hideFlower}">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>

    <!-- Card Header (Móvil) / Columna 1 (Desktop) -->
    <div class="py-2 lg:py-0 lg:px-4 font-medium text-white flex items-center justify-between lg:justify-start lg:h-full cursor-pointer lg:cursor-default mobile-row-toggle">
      <div class="flex items-center gap-4 lg:gap-3">
        <div class="relative w-12 h-12 lg:w-8 lg:h-8 rounded-lg lg:rounded bg-terminal-dark border border-emerald-500/30 flex items-center justify-center p-2 lg:p-1 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <img src="/img/sunflowerland/flower.jpg" alt="FLOWER" class="w-[90%] h-[90%] object-contain rounded-full drop-shadow-sm" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-base lg:text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">${item.name}</p>
            <span class="px-1 py-[1px] rounded-[3px] text-[8px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Token</span>
          </div>
          <p class="text-[9px] text-emerald-400/80 leading-tight lg:leading-none mt-1 max-w-[180px] lg:max-w-none">Sunflower Land Token</p>
        </div>
      </div>
      <!-- Precio Móvil y Círculo -->
      <div class="lg:hidden flex items-center justify-end gap-3">
          <div class="flex items-center gap-1.5 mt-0.5">
            <div class="flex flex-col items-center gap-1.5">
                <span class="text-[8px] font-mono text-terminal-muted/70 leading-none">24H</span>
                <div class="w-1.5 h-1.5 rounded-full ${color24h}"></div>
            </div>
          </div>
          <div class="flex flex-col items-end justify-center border-l border-white/5 pl-2.5 min-w-[55px]">
            <span class="text-[9px] font-mono text-terminal-muted mb-1">${labels.colPrice}</span>
            <span class="text-sm font-bold text-white leading-none inline-flex items-center">
              $${formatNumber(item.currentPrice, 4)}
            </span>
          </div>
          <div class="expand-indicator lg:hidden flex items-center pl-1 transition-opacity group-[.is-expanded]:hidden">
            <svg class="w-3.5 h-3.5 text-terminal-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
      </div>
    </div>
    
    <!-- Precio Desktop -->
    <div class="hidden lg:flex flex-col lg:py-0 pr-4 items-end justify-center h-full">
      <span class="text-[13px] font-sans font-medium text-white/90 inline-flex items-center">
        $${formatNumber(item.currentPrice, 4)}
      </span>
    </div>
    
    <!-- Contenedor de gráficas (Oculto por defecto en móvil, Acordeón) -->
    <div class="hidden lg:contents mobile-charts-container w-full">
      <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5 lg:border-none lg:pt-0 lg:mt-0 lg:contents w-full">
        ${getTextColumnHTML(labels.col24h, calculateChange(item.currentPrice, past1d))}
        <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
          <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">${labels.colMarketcap}</p>
          <div class="flex justify-center lg:justify-end w-full">
            <span class="text-[13px] font-medium font-sans text-white/90 inline-flex items-center whitespace-nowrap shrink-0 leading-none">
              $${formatNumber(256000000 * item.currentPrice, 0)}
            </span>
          </div>
        </div>
        <div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
          <p class="text-xs font-mono text-terminal-muted mb-3 uppercase lg:hidden font-semibold text-center w-full">Vol. 7D</p>
          <div class="flex justify-center lg:justify-end w-full">
            <div class="flex flex-col items-end">
              <span class="text-[13px] font-medium font-sans text-white/90 inline-flex items-center whitespace-nowrap shrink-0 leading-none">
                $${item.trades7d !== undefined ? formatNumber(item.trades7d, 0) : "-"}
              </span>
            </div>
          </div>
        </div>
        ${getSupplyColumnHTML("Circ. Supply", 256000000)}
        
        <div class="hidden lg:block w-full h-full relative">
          <!-- 7D Watermark Desktop -->
          <div class="absolute -top-1 right-[180px] xl:right-[205px] flex items-center pointer-events-none z-20">
            <span class="text-[12px] font-bold text-white/20 select-none tracking-widest">7D</span>
          </div>
          <div class="w-full h-full relative z-10">${getCardColumnHTML(labels.col7d, calculateChange(item.currentPrice, item.history?.["7d"]), item.history?.sparkline7d, 8, false, item.currentPrice)}</div>
        </div>

        <div class="lg:hidden contents mobile-sparklines" data-rendered="false">
        </div>
      </div>
    </div>
  `
  return row
}

function renderPage(page: number): void {
  if (!tableBody || !activeConfig) return
  const labels = activeConfig.tableLabels
  const clientLang = activeConfig.clientLang

  if (page === 1) tableBody.innerHTML = ""

  const filteredData = window.__currentFilteredData || []
  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const items = filteredData.slice(start, end)

  if (items.length === 0 && page === 1) {
    tableBody.innerHTML = `<div class="py-8 text-center text-terminal-muted text-sm">${labels.emptySearch}</div>`
    return
  }

  if (items.length === 0) return

  const fragment = document.createDocumentFragment()

  if (page === 1 && window.__showFlowerRow && window.__flowerData) {
    const currentTerm = searchInput ? searchInput.value.toLowerCase() : ""
    if (currentTerm === "" || window.__flowerData.name.toLowerCase().includes(currentTerm)) {
      const flowerRow = createFlowerRow(window.__flowerData, labels)
      fragment.appendChild(flowerRow)
    }
  }

  items.forEach((item) => {
    const isResources = item.category === "resources"
    const isBuds = item.category === "buds"
    const row = document.createElement("div") as MarketRowElement
    row._itemData = item
    row.className =
      "hover:bg-white/[0.02] transition-colors group flex flex-col justify-between border border-white/5 bg-white/[0.02] rounded-[20px] p-3 lg:p-0 lg:border-0 lg:border-b lg:border-white/5 last:lg:border-b-0 lg:bg-transparent lg:rounded-none lg:grid lg:grid-cols-[22%_10%_8%_11%_12%_10%_27%] lg:items-center lg:py-3"
    row.setAttribute("data-row-id", item.name)

    const getTrendColor = (historyKey: "1d" | "7d" | "30d" | "180d"): string => {
      if (item.currentPrice === 0) return "bg-terminal-muted/30"
      const change = calculateChange(item.currentPrice, item.history?.[historyKey])
      if (change.val === 0) return "bg-terminal-muted/30"
      return change.isPositive ? "bg-emerald-500" : "bg-red-500"
    }
    const color24h = getTrendColor("1d")
    const color7d = getTrendColor("7d")
    const color30d = getTrendColor("30d")
    const color180d = getTrendColor("180d")

    const hasIncompleteGraph =
      item.history?.sparkline30d && item.history.sparkline30d.filter((p) => p !== null).length < 30
    const newBadgeHTML = hasIncompleteGraph
      ? `<div class="absolute -top-[5px] -right-[5px] bg-[#f59e0b] text-black text-[7.5px] font-black px-[4px] py-[1.5px] rounded-[3px] uppercase tracking-wider shadow-md border border-black/20 whitespace-nowrap z-20 leading-none pointer-events-none select-none">NEW</div>`
      : ""

    const activeGraph = window.activeGraphPeriod || "7d"

    row.innerHTML = `
      <!-- Card Header (Móvil) / Columna 1 (Desktop) -->
      <div class="py-2 lg:py-0 lg:px-4 font-medium text-white flex items-center justify-between lg:justify-start lg:h-full cursor-pointer mobile-row-toggle" onclick="if (window.innerWidth >= 1024) { window.openTradingModal(this.closest('[data-row-id]')._itemData); }">
        <div class="flex items-center gap-4 lg:gap-3 min-w-0 flex-1">
          <div class="relative w-12 h-12 lg:w-8 lg:h-8 rounded-lg lg:rounded bg-terminal-dark border ${isBuds ? "border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.12)]" : "border-terminal-muted/20"} flex items-center justify-center shrink-0">
            <div class="w-full h-full rounded-lg lg:rounded overflow-hidden flex items-center justify-center ${isBuds ? "p-0" : "p-2 lg:p-1"}">
              <img src="${getItemImageSrc(item)}" alt="${item.name}" data-category="${item.category}" class="${isBuds ? "w-full h-full object-contain scale-[2.2] group-hover:scale-[2.35] transition-transform duration-200" : item.category !== "resources" ? "w-[85%] h-[85%]" : "w-[60%] h-[60%]"} object-contain drop-shadow-sm pixelated" onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src = this.dataset.category === 'buds' ? '/img/sunflowerland/123/bud.png' : '/img/sunflowerland/' + encodeURIComponent(this.alt.toLowerCase().replace(/\\s+/g, '_') + '.webp'); } else { this.onerror=null; this.src = '/img/sunflowerland/123/bud.png'; }" />
            </div>
            ${newBadgeHTML}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-base lg:text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">${item.name}</p>
              ${
                item.category !== currentCategory && searchInput && searchInput.value !== ""
                  ? `<span class="px-1 py-[1px] rounded-[3px] text-[8px] uppercase tracking-wider font-semibold ${
                      item.category === "powerups"
                        ? "bg-amber-500/10 text-amber-500/80 border border-amber-500/20"
                        : item.category === "cosmetics"
                          ? "bg-purple-500/10 text-purple-400/80 border border-purple-500/20"
                          : item.category === "buds"
                            ? "bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/20"
                            : "bg-emerald-500/10 text-emerald-500/80 border border-emerald-500/20"
                    }">${item.category === "powerups" ? "Power Up" : item.category === "cosmetics" ? "Cosmetic" : item.category === "buds" ? "Buds" : "Resource"}</span>`
                  : ""
              }
            </div>
            ${getTableBoostHTML(item)}
          </div>
        </div>
        <!-- Precio Móvil y 4 Círculos -->
        <div class="lg:hidden flex items-center justify-end gap-3">
           <!-- Indicadores de Tendencia -->
           <div class="flex items-center gap-1.5 mt-0.5">
              <div class="flex flex-col items-center gap-1.5">
                 <span class="text-[8px] font-mono text-terminal-muted/70 leading-none">24H</span>
                 <div class="w-1.5 h-1.5 rounded-full ${color24h}"></div>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                 <span class="text-[8px] font-mono text-terminal-muted/70 leading-none">7D</span>
                 <div class="w-1.5 h-1.5 rounded-full ${color7d}"></div>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                 <span class="text-[8px] font-mono text-terminal-muted/70 leading-none">30D</span>
                 <div class="w-1.5 h-1.5 rounded-full ${color30d}"></div>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                 <span class="text-[8px] font-mono text-terminal-muted/70 leading-none">180D</span>
                 <div class="w-1.5 h-1.5 rounded-full ${color180d}"></div>
              </div>
           </div>
           <!-- Precio -->
           <div class="flex flex-col items-end justify-center border-l border-white/5 pl-2.5 min-w-[55px]">
             <span class="text-[9px] font-mono text-terminal-muted mb-1">${labels.colPrice}</span>
             <span class="text-sm font-bold text-white leading-none inline-flex items-center">
               <img src="/img/sunflowerland/flower.jpg" class="w-2.5 h-2.5 mr-1 rounded-full object-cover" alt="FLOWER" style="transform: translateY(-0.5px);" />
               ${formatNumber(item.currentPrice, 4)}
             </span>
             ${window.sflUsdPrice && item.currentPrice > 0 ? `<span class="text-[8.5px] font-mono text-white/40 mt-1">~$${formatNumber(item.currentPrice * window.sflUsdPrice, 4)}</span>` : ""}
           </div>
           <!-- Expand Indicator -->
           <div class="expand-indicator lg:hidden flex items-center pl-1 transition-opacity group-[.is-expanded]:hidden">
             <svg class="w-3.5 h-3.5 text-terminal-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
             </svg>
           </div>
        </div>
      </div>
      
      <!-- Precio Desktop -->
      <div class="hidden lg:flex flex-col lg:py-0 pr-4 items-end justify-center h-full">
        <span class="text-[13px] font-sans font-medium text-white/90 inline-flex items-center">
          <img src="/img/sunflowerland/flower.jpg" class="w-2.5 h-2.5 mr-1.5 rounded-full object-cover" alt="FLOWER" style="transform: translateY(-0.5px);" />
          ${formatNumber(item.currentPrice, 4)}
        </span>
        ${window.sflUsdPrice && item.currentPrice > 0 ? `<span class="text-[9.5px] font-mono text-white/40 mt-1">~$${formatNumber(item.currentPrice * window.sflUsdPrice, 4)}</span>` : ""}
      </div>
      
      <!-- Contenedor de gráficas (Oculto por defecto en móvil, Acordeón) -->
      <div class="hidden lg:contents mobile-charts-container w-full">
        ${
          item.currentPrice === 0
            ? `
          <div class="mt-2 pt-3 border-t border-white/5 lg:border-none lg:pt-0 lg:mt-0 lg:col-span-4 lg:h-full flex items-center justify-center lg:py-2 w-full">
            <div class="w-full h-full min-h-[80px] lg:min-h-0 rounded-lg border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center">
              <span class="text-[10px] font-mono text-terminal-muted/40 uppercase tracking-widest">No Sales Data</span>
            </div>
          </div>
        `
            : `
          <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5 lg:border-none lg:pt-0 lg:mt-0 lg:contents w-full">
            ${getTextColumnHTML(labels.col24h, calculateChange(item.currentPrice, item.history?.["1d"]))}
            ${
              isResources
                ? `<div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3">
                  <div class="lg:hidden text-[9px] font-mono text-terminal-muted mb-1">Market Cap</div>
                  <span class="text-[11px] font-medium font-sans text-white/30 italic">${clientLang === "es" ? "No cumple" : "Uncapped"}</span>
                </div>`
                : isBuds
                  ? getMarketcapColumnHTML("Floor Price", item.currentPrice)
                  : getMarketcapColumnHTML(
                      labels.colMarketcap,
                      (item.supply || 0) * item.currentPrice,
                    )
            }
            ${getVolColumnHTML("Vol. 7D", item, clientLang)}
            ${
              isResources
                ? `<div class="flex flex-col justify-center items-center lg:flex-row lg:justify-end lg:items-center bg-terminal-bg/50 lg:bg-transparent p-4 rounded-xl lg:p-0 lg:rounded-none border border-white/[0.02] lg:border-none w-full lg:pr-3" title="${clientLang === "es" ? "Recurso ilimitado, se genera y consume dentro del juego" : "Unlimited resource, generated and consumed in-game"}">
                  <div class="lg:hidden text-[9px] font-mono text-terminal-muted mb-1">Circ. Supply</div>
                  <span class="text-[15px] font-medium text-white/30">∞</span>
                </div>`
                : isBuds
                  ? getSupplyColumnHTML("Circ. Supply", 1)
                  : getSupplyColumnHTML("Circ. Supply", item.supply)
            }
            
            <div class="lg:hidden contents mobile-sparklines" data-rendered="false">
            </div>

            <!-- Botón Móvil para abrir Modal de Trading -->
            <div class="col-span-2 lg:hidden pt-2 pb-1">
              <button type="button" onclick="event.stopPropagation(); window.openTradingModal(this.closest('[data-row-id]')._itemData);" class="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                <span>${labels.modalViewChart}</span>
              </button>
            </div>
            
            <div class="hidden lg:block w-full h-full cursor-pointer hover:opacity-90 transition-opacity" onclick="window.openTradingModal(this.closest('[data-row-id]')._itemData)" title="${labels.modalViewChart}">
               <div class="desktop-graph-7d w-full h-full ${activeGraph === "7d" ? "" : "hidden"}">${getCardColumnHTML(labels.col7d, calculateChange(item.currentPrice, item.history?.["7d"]), item.history?.sparkline7d, 8, false, item.currentPrice)}</div>
               <div class="desktop-graph-30d w-full h-full ${activeGraph === "30d" ? "" : "hidden"}">${getCardColumnHTML(labels.col30d, calculateChange(item.currentPrice, item.history?.["30d"]), item.history?.sparkline30d, 31, false, item.currentPrice)}</div>
               <div class="desktop-graph-180d w-full h-full ${activeGraph === "180d" ? "" : "hidden"}">${getCardColumnHTML(labels.col180d, calculateChange(item.currentPrice, item.history?.["180d"]), item.history?.sparkline180d, 181, false, item.currentPrice)}</div>
            </div>
          </div>
        `
        }
      </div>
    `
    fragment.appendChild(row)
  })

  const oldTrigger = document.getElementById("loadMoreTrigger")
  if (oldTrigger) oldTrigger.remove()

  tableBody.appendChild(fragment)

  if (end < filteredData.length) {
    const trigger = document.createElement("div")
    trigger.id = "loadMoreTrigger"
    trigger.className = "h-4 w-full opacity-0 pointer-events-none -mt-4"
    tableBody.appendChild(trigger)

    if (!loadMoreObserver) {
      loadMoreObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            currentPage++
            sessionStorage.setItem("sfl_market_page", String(currentPage))
            renderPage(currentPage)
          }
        },
        { rootMargin: "300px" },
      )
    }

    loadMoreObserver.disconnect()
    loadMoreObserver.observe(trigger)
  }
}

function renderTable(filterText = "", isInitialLoad = false): void {
  const term = filterText
  const filtered = marketData.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.key.toLowerCase().includes(term.toLowerCase()) ||
      (!!item.boost && item.boost.toLowerCase().includes(term.toLowerCase()))

    const matchCategory = item.category === currentCategory

    let matchSubCategory = true
    if (item.category === "powerups" || item.category === "cosmetics") {
      const itemType: SubCategory = item.isWearable ? "wearables" : "collectibles"
      if (!currentSubCategories.includes(itemType)) {
        matchSubCategory = false
      }
    }

    if (term !== "") {
      return matchSearch
    }

    return matchSearch && matchCategory && matchSubCategory
  })

  const sortedFiltered = [...filtered]
  const sortState = window.currentSort

  if (sortState && sortState.column && sortState.direction !== "none") {
    const { column, direction } = sortState
    sortedFiltered.sort((a, b) => {
      if (column === "name") {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) return direction === "asc" ? -1 : 1
        if (nameA > nameB) return direction === "asc" ? 1 : -1
        return 0
      }

      let valA = 0
      let valB = 0
      if (column === "price") {
        valA = a.currentPrice
        valB = b.currentPrice
      } else if (column === "supply") {
        valA = a.supply !== undefined ? a.supply : Infinity
        valB = b.supply !== undefined ? b.supply : Infinity
      } else if (column === "trades7d") {
        if (document.body.classList.contains("show-vol-units")) {
          valA = a.trades7d || 0
          valB = b.trades7d || 0
        } else {
          valA = a.volume7d || 0
          valB = b.volume7d || 0
        }
      } else if (column === "marketcap") {
        valA = (a.supply || 0) * a.currentPrice
        valB = (b.supply || 0) * b.currentPrice
      } else {
        const pastA = a.history?.[column as keyof MarketItemHistory] as number | null | undefined
        const pastB = b.history?.[column as keyof MarketItemHistory] as number | null | undefined
        valA = calculateChange(a.currentPrice, pastA).val
        valB = calculateChange(b.currentPrice, pastB).val
      }

      if (valA < valB) return direction === "asc" ? -1 : 1
      if (valA > valB) return direction === "asc" ? 1 : -1
      return 0
    })
  }

  if (term !== "" && (!sortState || !sortState.column || sortState.direction === "none")) {
    sortedFiltered.sort((a, b) => {
      const aIsCurrent = a.category === currentCategory ? 1 : 0
      const bIsCurrent = b.category === currentCategory ? 1 : 0
      return bIsCurrent - aIsCurrent
    })
  }

  window.__currentFilteredData = sortedFiltered

  if (isInitialLoad) {
    const savedPage = parseInt(sessionStorage.getItem("sfl_market_page") || "1", 10) || 1
    for (let i = 1; i <= savedPage; i++) {
      currentPage = i
      renderPage(i)
    }
  } else {
    currentPage = 1
    sessionStorage.setItem("sfl_market_page", "1")
    renderPage(1)
  }
}

async function fetchAndMergeBuds(cacheBuster: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/sfl_buds.json?v=${cacheBuster}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const budsJson = (await response.json()) as RawBudsApiResponse

    if (!budsJson || !budsJson.items) return false

    const budsList = Object.values(budsJson.items).reduce<DashboardMarketItem[]>((acc, data) => {
      const parts = data.key.split("-")
      if (parts.length >= 2 && parts[0] === "buds") {
        const id = parts[1]
        const budTraits: BudTraits = {
          type: data.type || "",
          stem: data.stem || "",
          aura: data.aura || "",
          ears: data.ears || "",
          colour: data.colour || "",
          mainBoost: data.mainBoost || "",
          stemBoost: data.stemBoost || "",
          auraBoost: data.auraBoost || "",
        }
        acc.push({
          ...data,
          name: `Bud #${id}`,
          budId: id,
          image: `https://buds.sunflower-land.com/nfts/${id}.gif`,
          supply: 1,
          trades7d: data.trades7d,
          category: "buds",
          isWearable: false,
          boost: data.boost || "",
          budTraits,
        })
      }
      return acc
    }, [])

    budsList.forEach((item) => {
      if (item.currentPrice > 0 && item.history) {
        SPARKLINE_KEYS.forEach((key) => {
          const arr = item.history?.[key]
          if (Array.isArray(arr) && arr.length > 0) {
            arr[arr.length - 1] = item.currentPrice
          }
        })
      }
    })

    const existingKeys = new Set(marketData.map((m) => m.key))
    budsList.forEach((b) => {
      if (!existingKeys.has(b.key)) {
        marketData.push(b)
      }
    })

    window.__budsLoaded = true
    return true
  } catch (err) {
    console.error("Error al cargar sfl_buds.json:", err)
    return false
  }
}

function bindGlobalMarketActions(): void {
  if (globalHooksBound) return
  globalHooksBound = true

  window.activeGraphPeriod = window.activeGraphPeriod || "7d"
  window.currentSort = window.currentSort || { column: "trades7d", direction: "desc" }
  window.isUserSorted = window.isUserSorted || false
  window.__budsLoaded = window.__budsLoaded || false
  window.__budsLoading = window.__budsLoading || false

  window.toggleGraph = (period: GraphPeriod) => {
    window.activeGraphPeriod = period
    document
      .querySelectorAll<HTMLElement>(".desktop-graph-7d, .desktop-graph-30d, .desktop-graph-180d")
      .forEach((el) => {
        el.classList.add("hidden")
      })

    document.querySelectorAll<HTMLElement>(`.desktop-graph-${period}`).forEach((el) => {
      el.classList.remove("hidden")
    })

    document.querySelectorAll<HTMLElement>(".graph-toggle-btn").forEach((btn) => {
      btn.classList.remove("bg-white/10", "text-white")
      btn.classList.add("text-terminal-muted")
    })

    const activeBtn = document.getElementById(`btn-graph-${period}`)
    if (activeBtn) {
      activeBtn.classList.remove("text-terminal-muted")
      activeBtn.classList.add("bg-white/10", "text-white")
    }

    const titleEl = document.getElementById("graph-col-title")
    const sortBtn = document.getElementById("graph-sort-btn")
    const sortIcon = document.getElementById("graph-sort-icon")

    if (titleEl && sortBtn && sortIcon) {
      const isEn = window.location.pathname.includes("/en/")
      const prefix = isEn ? "Price Graph" : "Gráfica"
      titleEl.innerText = `${prefix} (${period.toUpperCase()})`
      sortBtn.setAttribute("onclick", `window.handleSort('${period}')`)
      sortIcon.setAttribute("data-col", period)
    }
  }

  window.loadBudsData = async () => {
    if (window.__budsLoaded || window.__budsLoading) return
    window.__budsLoading = true

    const currentTableBody = document.getElementById("tableBody")
    const clientLang = activeConfig?.clientLang || "es"
    if (currentCategory === "buds" && currentTableBody) {
      currentTableBody.innerHTML = `
        <div class="py-20 text-center flex flex-col items-center justify-center gap-3">
          <svg class="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span class="text-xs font-mono text-cyan-400 tracking-wider uppercase font-bold">${clientLang === "es" ? "Cargando catálogo Buds NFT (678 items)..." : "Loading Buds NFT catalog (678 items)..."}</span>
        </div>
      `
    }

    try {
      const cacheBuster = Math.floor(Date.now() / (5 * 60 * 1000))
      const loaded = await fetchAndMergeBuds(cacheBuster)
      if (loaded) {
        renderSflDashboard()
      }
    } finally {
      window.__budsLoading = false
      renderTable(searchInput ? searchInput.value : "")
    }
  }

  window.handleCategory = async (category: string) => {
    currentCategory = category
    currentSubCategories = ["collectibles", "wearables"]

    const filterContainer = document.getElementById("subfilters-container")

    if (category === "powerups" || category === "cosmetics") {
      if (filterContainer) {
        filterContainer.classList.remove("opacity-30", "grayscale", "pointer-events-none")
        filterContainer.classList.add("opacity-100")
      }
      document
        .querySelectorAll<HTMLInputElement>(".sub-checkbox-common")
        .forEach((cb) => (cb.checked = true))
    } else if (filterContainer) {
      filterContainer.classList.add("pointer-events-none")
      filterContainer.classList.remove("opacity-100")
    }

    document.querySelectorAll<HTMLElement>(".category-btn").forEach((btn) => {
      if (btn.dataset.category === category) {
        btn.className =
          "category-btn relative px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-400 bg-white/5 shadow-[0_0_15px_rgba(16,185,129,0.1)] whitespace-nowrap shrink-0 transition-all duration-300 flex items-center justify-center gap-2 md:flex-1 lg:flex-none"
      } else {
        btn.className =
          "category-btn relative px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 transition-all duration-300 flex items-center justify-center gap-2 md:flex-1 lg:flex-none"
      }
    })

    if (category === "buds" && !window.__budsLoaded && window.loadBudsData) {
      await window.loadBudsData()
      return
    }

    renderTable(searchInput ? searchInput.value : "")
  }

  window.toggleSubCategory = (subCategory: SubCategory) => {
    if (currentSubCategories.includes(subCategory)) {
      if (currentSubCategories.length === 1) {
        currentSubCategories = subCategory === "collectibles" ? ["wearables"] : ["collectibles"]
      } else {
        currentSubCategories = currentSubCategories.filter((sc) => sc !== subCategory)
      }
    } else {
      currentSubCategories.push(subCategory)
    }

    document.querySelectorAll<HTMLInputElement>(".sub-checkbox-common").forEach((cb) => {
      cb.checked = currentSubCategories.includes(cb.value as SubCategory)
    })

    renderTable(searchInput ? searchInput.value : "")
  }

  window.handleSort = (column: string) => {
    window.isUserSorted = true
    const sortState = window.currentSort || { column: "trades7d", direction: "desc" }
    window.currentSort = sortState

    if (sortState.column === column) {
      if (sortState.direction === "none") sortState.direction = "desc"
      else if (sortState.direction === "desc") sortState.direction = "asc"
      else sortState.direction = "none"
    } else {
      sortState.column = column
      sortState.direction = "desc"
    }

    document.querySelectorAll<HTMLElement>(".sort-icon").forEach((icon) => {
      icon.innerHTML = "↓"
      icon.classList.add("hidden")
      icon.classList.remove("text-emerald-400", "opacity-100")
      icon.classList.add("opacity-0")
    })

    if (sortState.direction !== "none") {
      const activeIcons = document.querySelectorAll<HTMLElement>(`.sort-icon[data-col="${column}"]`)
      activeIcons.forEach((activeIcon) => {
        activeIcon.innerHTML = sortState.direction === "desc" ? "↓" : "↑"
        activeIcon.classList.remove("hidden", "opacity-0")
        activeIcon.classList.add("text-emerald-400", "opacity-100")
      })
    }

    const currentSearchInput = document.getElementById("searchInput") as HTMLInputElement | null
    renderTable(currentSearchInput ? currentSearchInput.value : "")
  }

  window.scrollToItem = (itemName: string, event?: Event) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }

    const targetItem = marketData.find((item) => item.name === itemName)
    if (targetItem) {
      const targetCategory = targetItem.category
      if (currentCategory !== targetCategory) {
        window.handleCategory?.(targetCategory)
      }
    }

    const currentSearchInput = document.getElementById("searchInput") as HTMLInputElement | null
    if (currentSearchInput && currentSearchInput.value !== "") {
      currentSearchInput.value = ""
      renderTable()
    }

    if (window.__currentFilteredData) {
      const targetIndex = window.__currentFilteredData.findIndex((item) => item.name === itemName)
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1
        while (currentPage < targetPage) {
          currentPage++
          renderPage(currentPage)
        }
      }
    }

    requestAnimationFrame(() => {
      const safeName = itemName.replace(/"/g, '\\"')
      const row = document.querySelector<HTMLElement>(`div[data-row-id="${safeName}"]`)

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" })
        row.classList.add("!bg-emerald-500/20", "lg:rounded-xl", "transition-all", "duration-500")
        setTimeout(() => {
          row.classList.remove(
            "!bg-emerald-500/20",
            "lg:rounded-xl",
            "transition-all",
            "duration-500",
          )
        }, 1500)
      }
    })
  }

  window.reRenderTable = () => {
    const currentSearchInput = document.getElementById("searchInput") as HTMLInputElement | null
    renderTable(currentSearchInput ? currentSearchInput.value : "")
  }

  window.closeFlowerRow = () => {
    const flowerRowToggle = document.getElementById("flowerRowToggle") as HTMLInputElement | null
    if (flowerRowToggle) flowerRowToggle.checked = false
    window.__showFlowerRow = false
    localStorage.setItem("hide_flower_row", "true")
    renderTable(searchInput ? searchInput.value : "")
  }
}

async function fetchData(silent = false, forceRefresh = false): Promise<void> {
  if (!loadingState || !errorState || !dataContainer || !errorMsg) return

  try {
    if (!silent) {
      loadingState.classList.remove("hidden")
      errorState.classList.add("hidden")
      dataContainer.classList.add("hidden")
    } else if (fetchBtn) {
      const svg = fetchBtn.querySelector("#fetchBtnRefreshIcon")
      if (svg) svg.classList.add("animate-spin")
    }

    // Ventana de caché de 5 minutos (evita re-descargar 3.6MB innecesariamente en cada recarga o navegación rápida)
    // Si el usuario presiona el botón "Refrescar", se fuerza con Date.now()
    const cacheBuster = forceRefresh ? Date.now() : Math.floor(Date.now() / (5 * 60 * 1000))

    let json = (await SflMarket.fetchMarketData(forceRefresh)) as RawMarketApiResponse | null

    if (!json) {
      const response = await fetch(`/api/sfl_data.json?v=${cacheBuster}`)
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo local: ${response.status}`)
      }
      json = (await response.json()) as RawMarketApiResponse
    }

    try {
      const dashResponse = await fetch(`/api/sfl_dashboard.json?v=${cacheBuster}`)
      if (dashResponse.ok) {
        dashboardData = (await dashResponse.json()) as MarketDashboardData
      }
    } catch (e) {
      console.warn("No se pudo cargar sfl_dashboard.json", e)
    }

    if (!json || !json.items) {
      throw new Error("El archivo de datos estáticos no contiene historial de items.")
    }

    if (json.budsSummary) {
      window.sflBudsSummary = json.budsSummary
    }

    let bestCoinsPerFlower = SflMarket.getBettyRatio()
    if (bestCoinsPerFlower <= 0) {
      Object.keys(bettyPrices).forEach((name) => {
        const itemConfig = bettyPrices[name]
        const itemId = Object.keys(sflIds).find((key) => sflIds[key] === name)
        const internalKey = `collectibles-${itemId}`
        const marketItem = json?.items[internalKey]

        const bettyPriceCoins = itemConfig.sellPrice
        const p2pPriceFlower = marketItem ? marketItem.currentPrice : 0

        if (p2pPriceFlower > 0) {
          const coinsPerFlower = bettyPriceCoins / p2pPriceFlower
          if (coinsPerFlower > bestCoinsPerFlower) {
            bestCoinsPerFlower = coinsPerFlower
          }
        }
      })
    }
    window.sflBestCoinsPerFlower = bestCoinsPerFlower

    // Calcular precio dinámico del Oil reutilizando la receta centralizada de constants.ts
    const itemsMap = json.items
    const oilDrillCost = calculateOilDrillCost(bestCoinsPerFlower || 1330, (matName) => {
      const itemId = Object.keys(sflIds).find((key) => sflIds[key] === matName)
      if (itemId) {
        const marketItem = itemsMap[`collectibles-${itemId}`]
        if (marketItem && typeof marketItem.currentPrice === "number") {
          return marketItem.currentPrice
        }
      }
      return SflMarket.getItemPrice(matName) || 0
    })

    window.sflOilDrillCost = oilDrillCost
    window.sflBestOilPriceFlower =
      oilDrillCost > 0 ? oilDrillCost / (window.sflOilMultiplier || DEFAULT_OIL_MULTIPLIER) : 0.107

    const pwrCollectibles = sflPowerUps.power_ups.collectibles || {}
    const pwrWearables = sflPowerUps.power_ups.wearables || {}
    const cosmCollectibles = sflCosmetics.cosmetics?.collectibles || {}
    const cosmWearables = sflCosmetics.cosmetics?.wearables || {}

    const hadBudsLoaded = Boolean(window.__budsLoaded)
    const prevBudsItems = hadBudsLoaded ? marketData.filter((m) => m.category === "buds") : []

    marketData = Object.values(json.items)
      .reduce<DashboardMarketItem[]>((acc, data) => {
        const parts = data.key.split("-")
        if (parts.length >= 2) {
          const type = parts[0]
          const id = parts[1]
          if (type === "collectibles" && sflIds[id]) {
            acc.push({
              ...data,
              name: sflIds[id],
              trades7d: data.trades7d,
              category: "resources",
            })
          } else if (type === "collectibles" && pwrCollectibles[id]) {
            acc.push({
              ...data,
              name: pwrCollectibles[id].name,
              boost: pwrCollectibles[id].boost,
              image: pwrCollectibles[id].image,
              supply: pwrCollectibles[id].supply,
              trades7d: data.trades7d,
              category: "powerups",
              isWearable: false,
            })
          } else if (type === "collectibles" && cosmCollectibles[id]) {
            acc.push({
              ...data,
              name: cosmCollectibles[id].name,
              boost: "",
              image: cosmCollectibles[id].image,
              supply: cosmCollectibles[id].supply,
              trades7d: data.trades7d,
              category: "cosmetics",
              isWearable: false,
            })
          } else if (type === "wearables" && pwrWearables[id]) {
            acc.push({
              ...data,
              name: pwrWearables[id].name,
              boost: pwrWearables[id].boost,
              image: pwrWearables[id].image,
              supply: pwrWearables[id].supply,
              trades7d: data.trades7d,
              category: "powerups",
              isWearable: true,
            })
          } else if (type === "wearables" && cosmWearables[id]) {
            acc.push({
              ...data,
              name: cosmWearables[id].name,
              boost: "",
              image: cosmWearables[id].image,
              supply: cosmWearables[id].supply,
              trades7d: data.trades7d,
              category: "cosmetics",
              isWearable: true,
            })
          } else if (type === "buds") {
            acc.push({
              ...data,
              name: `Bud #${id}`,
              budId: id,
              image: `https://buds.sunflower-land.com/nfts/${id}.gif`,
              supply: 1,
              trades7d: data.trades7d,
              category: "buds",
              isWearable: false,
            })
          }
        }
        return acc
      }, [])
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))

    // Sincronizar el último punto de todos los sparklines con el precio actual del ítem
    marketData.forEach((item) => {
      if (item.currentPrice > 0 && item.history) {
        SPARKLINE_KEYS.forEach((key) => {
          const arr = item.history?.[key]
          if (Array.isArray(arr) && arr.length > 0) {
            arr[arr.length - 1] = item.currentPrice
          }
        })
      }
    })

    // Guardamos el precio interno del juego intacto para la calculadora
    const internalPrice = json.flowerPrice ? parseFloat(String(json.flowerPrice)) : 0.0854
    window.sflInternalPrice = internalPrice

    let fallbackPrice = internalPrice
    const cgFlower = window.__CoinGeckoEngine?.["flower-2"]
    if (cgFlower && cgFlower.usd) {
      fallbackPrice = cgFlower.usd
    }
    window.sflUsdPrice = fallbackPrice
    const priceEl = document.getElementById("sflPriceValue")
    const changeEl = document.getElementById("sflPriceChange")
    const imgEl = document.getElementById("sflTokenImg")

    if (json.flowerPrice) {
      if (priceEl) priceEl.innerText = "$" + parseFloat(String(json.flowerPrice)).toFixed(4)
      if (changeEl) changeEl.innerText = ""
      if (imgEl) imgEl.classList.remove("animate-pulse")
    } else {
      if (priceEl) priceEl.innerText = "N/A"
      if (imgEl) imgEl.classList.remove("animate-pulse")
    }

    if (hadBudsLoaded || currentCategory === "buds") {
      const budsOk = await fetchAndMergeBuds(cacheBuster)
      if (!budsOk && prevBudsItems.length > 0) {
        const existingKeys = new Set(marketData.map((m) => m.key))
        prevBudsItems.forEach((b) => {
          if (!existingKeys.has(b.key)) {
            marketData.push(b)
          }
        })
      }
    }

    renderSflDashboard()
    renderTable(searchInput ? searchInput.value : "", true)

    if (!silent) {
      const container = dataContainer
      const loader = loadingState
      container.style.opacity = "0"
      container.classList.remove("hidden")

      requestAnimationFrame(() => {
        const savedScroll = sessionStorage.getItem("sfl_market_scroll")
        if (savedScroll) {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" })
          sessionStorage.removeItem("sfl_market_scroll")
        }

        loader.classList.add("hidden")

        container.style.transition = "opacity 0.2s ease-in-out"
        container.style.opacity = "1"

        setTimeout(() => {
          container.style.transition = ""
          container.style.opacity = ""
        }, 250)
      })
    }
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : "Error desconocido al consultar la API."
    errorMsg.innerText = msg

    if (!silent) {
      errorState.classList.remove("hidden")
      loadingState.classList.add("hidden")
    }

    const priceEl = document.getElementById("sflPriceValue")
    const imgEl = document.getElementById("sflTokenImg")
    if (priceEl) priceEl.innerText = "Error"
    if (imgEl) imgEl.classList.remove("animate-pulse")
  } finally {
    if (silent && fetchBtn) {
      const currentFetchBtn = fetchBtn
      const refreshIcon = currentFetchBtn.querySelector("#fetchBtnRefreshIcon")
      const checkIcon = currentFetchBtn.querySelector("#fetchBtnCheckIcon")
      const textSpan = currentFetchBtn.querySelector<HTMLElement>("#fetchBtnText")

      if (refreshIcon) {
        refreshIcon.classList.remove("animate-spin")
        refreshIcon.classList.add("hidden")
      }
      if (checkIcon) checkIcon.classList.remove("hidden")
      if (textSpan) textSpan.innerText = textSpan.dataset.updatedText || "Up to date"

      currentFetchBtn.disabled = true
      currentFetchBtn.classList.remove("hover:bg-emerald-500/20")
      currentFetchBtn.classList.add("opacity-50", "cursor-not-allowed", "bg-emerald-500/20")

      setTimeout(() => {
        if (refreshIcon) refreshIcon.classList.remove("hidden")
        if (checkIcon) checkIcon.classList.add("hidden")
        if (textSpan) textSpan.innerText = textSpan.dataset.originalText || "Refresh"

        currentFetchBtn.disabled = false
        currentFetchBtn.classList.add("hover:bg-emerald-500/20")
        currentFetchBtn.classList.remove("opacity-50", "cursor-not-allowed", "bg-emerald-500/20")
      }, 60000)
    }
  }
}

function initDashboardController(config: SflMarketConfig): void {
  initSflMarketDashboard({
    getMarketData: () => marketData,
    getDashboardData: () => dashboardData,
    getItemImageSrc,
    formatNumber,
    createSparklineSVG,
    calculateChange,
    labels: config.dashboardLabels,
  })
}

function initModalController(config: SflMarketConfig): void {
  initSflTradingModal({
    clientLang: config.clientLang,
    getMarketData: () => marketData,
    getSflUsdPrice: () => window.sflUsdPrice || 0.085,
    getItemImageSrc,
    parseBoosts,
    formatModalPrice,
    formatModalUsd,
    formatNumber,
    calculateChange,
    labels: config.modalLabels,
  })
}

function initScrollHints(): void {
  if (scrollHintsAborter) {
    scrollHintsAborter.abort()
  }
  scrollHintsAborter = new AbortController()
  const { signal } = scrollHintsAborter

  const wrappers = document.querySelectorAll(".scroll-hint-wrapper")
  wrappers.forEach((wrapper) => {
    const area = wrapper.querySelector<HTMLElement>(".scroll-area")
    const hint = wrapper.querySelector<HTMLElement>(".scroll-hint")
    if (!area || !hint) return

    let interacted = false

    const checkScroll = () => {
      if (interacted) return
      if (area.scrollWidth > area.clientWidth + 5) {
        hint.classList.remove("opacity-0")
        hint.classList.add("opacity-100")
      } else {
        hint.classList.add("opacity-0")
        hint.classList.remove("opacity-100")
      }
    }

    area.addEventListener(
      "scroll",
      () => {
        if (area.scrollLeft > 5) {
          interacted = true
          hint.classList.add("opacity-0")
          hint.classList.remove("opacity-100")
        } else if (!interacted) {
          hint.classList.remove("opacity-0")
          hint.classList.add("opacity-100")
        }
      },
      { signal },
    )

    setTimeout(checkScroll, 300)
    window.addEventListener("resize", checkScroll, { signal })
  })
}

function initStickyHeader(): void {
  if (stickyHeaderObserver) {
    stickyHeaderObserver.disconnect()
    stickyHeaderObserver = null
  }

  const sentinel = document.getElementById("headerSentinel")
  const header = document.getElementById("desktopHeader")
  if (sentinel && header) {
    stickyHeaderObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          header.classList.toggle("is-sticky", entry.intersectionRatio < 1)
        }
      },
      { threshold: [1] },
    )
    stickyHeaderObserver.observe(sentinel)
  }
}

function init(): void {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual"
  }

  const config = readMarketConfig()
  const tbody = document.getElementById("tableBody")
  if (!config || !tbody) return

  if (tbody.dataset.sflBound === "true" || window.__sflMarketInitialized) return
  tbody.dataset.sflBound = "true"
  window.__sflMarketInitialized = true

  activeConfig = config
  currentCategory = "resources"
  currentSubCategories = ["collectibles", "wearables"]
  window.__budsLoaded = false
  window.__budsLoading = false

  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
    loadMoreObserver = null
  }

  refreshDomRefs()
  bindGlobalMarketActions()
  initDashboardController(config)
  initModalController(config)

  if (fetchBtn) {
    const activeFetchBtn = fetchBtn
    activeFetchBtn.addEventListener("click", () => {
      if (activeFetchBtn.disabled) return
      sessionStorage.setItem("sfl_market_scroll", String(window.scrollY))
      void fetchData(true, true)
    })
  }

  const flowerRowToggle = document.getElementById("flowerRowToggle") as HTMLInputElement | null
  if (flowerRowToggle) {
    const isHidden = localStorage.getItem("hide_flower_row") === "true"
    flowerRowToggle.checked = !isHidden
    window.__showFlowerRow = !isHidden

    flowerRowToggle.addEventListener("change", (e) => {
      const target = e.currentTarget as HTMLInputElement
      window.__showFlowerRow = target.checked
      localStorage.setItem("hide_flower_row", String(!target.checked))
      renderTable(searchInput ? searchInput.value : "")
    })
  }

  // Acordeón para dispositivos móviles (Lazy render de sparklines para móviles de baja RAM)
  if (tableBody) {
    const { tableLabels } = config
    tableBody.addEventListener("click", (e) => {
      if (window.innerWidth >= 1024) return

      const rowToggle = (e.target as HTMLElement | null)?.closest(".mobile-row-toggle")
      if (!rowToggle) return

      const row = rowToggle.closest("[data-row-id]") as MarketRowElement | null
      if (!row) return

      const mobileSparklines = row.querySelector<HTMLElement>(".mobile-sparklines")
      if (mobileSparklines && mobileSparklines.dataset.rendered !== "true" && row._itemData) {
        const item = row._itemData
        if (row._isFlowerRow) {
          mobileSparklines.innerHTML = getCardColumnHTML(
            tableLabels.col7d,
            calculateChange(item.currentPrice, item.history?.["7d"]),
            item.history?.sparkline7d,
            8,
            false,
            item.currentPrice,
          )
        } else {
          mobileSparklines.innerHTML = `
            ${getCardColumnHTML(tableLabels.col7d, calculateChange(item.currentPrice, item.history?.["7d"]), item.history?.sparkline7d, 8, false, item.currentPrice)}
            ${getCardColumnHTML(tableLabels.col30d, calculateChange(item.currentPrice, item.history?.["30d"]), item.history?.sparkline30d, 31, false, item.currentPrice)}
            ${getCardColumnHTML(tableLabels.col180d, calculateChange(item.currentPrice, item.history?.["180d"]), item.history?.sparkline180d, 181, false, item.currentPrice)}
          `
        }
        mobileSparklines.dataset.rendered = "true"
      }

      const chartsContainer = row.querySelector(".mobile-charts-container")
      if (chartsContainer) {
        chartsContainer.classList.toggle("hidden")
        row.classList.toggle("is-expanded")
      }
    })
  }

  if (searchInput) {
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined
    searchInput.addEventListener("input", (e) => {
      const target = e.currentTarget as HTMLInputElement
      const val = target.value

      if (val.trim().length > 0 && !window.__budsLoaded) {
        const lowerVal = val.toLowerCase()
        if (lowerVal.includes("bud") || /^\d+$/.test(val.trim()) || val.includes("#")) {
          void window.loadBudsData?.()
        }
      }

      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        renderTable(val)
      }, 150)

      if (searchIcon && clearSearchBtn) {
        if (val.length > 0) {
          searchIcon.classList.add("hidden")
          clearSearchBtn.classList.remove("hidden")
        } else {
          searchIcon.classList.remove("hidden")
          clearSearchBtn.classList.add("hidden")
        }
      }
    })
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = ""
        renderTable("")
        searchInput.focus()

        if (searchIcon) searchIcon.classList.remove("hidden")
        clearSearchBtn?.classList.add("hidden")
      }
    })
  }

  // Primer fetch automático
  void fetchData()

  const sortState = window.currentSort
  if (sortState && sortState.direction !== "none") {
    const activeIcons = document.querySelectorAll<HTMLElement>(
      `.sort-icon[data-col="${sortState.column}"]`,
    )
    activeIcons.forEach((activeIcon) => {
      activeIcon.innerHTML = sortState.direction === "desc" ? "↓" : "↑"
      activeIcon.classList.remove("hidden", "opacity-0")
      activeIcon.classList.add("text-emerald-400", "opacity-100")
    })
  }

  initSparklineHover()
  initScrollHints()
  initStickyHeader()
}

function registerLifecycleListeners(): void {
  if (lifecycleListenersBound) return
  lifecycleListenersBound = true

  window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("sfl_market_scroll", String(window.scrollY))
  })

  document.addEventListener("coingecko-data-ready", (e) => {
    const dataMap = (e as CustomEvent<CoinGeckoDataMap>).detail
    if (!dataMap) return
    updateDash61Changes(dataMap)

    const flowerData = dataMap["flower-2"]
    if (flowerData && flowerData.usd) {
      window.sflUsdPrice = flowerData.usd
      window.__flowerData = {
        name: "FLOWER",
        key: "flower",
        currentPrice: flowerData.usd,
        history: {
          "1d": flowerData.usd / (1 + (flowerData.change24h || 0) / 100),
          "7d": flowerData.usd / (1 + (flowerData.change7d || 0) / 100),
          "30d": flowerData.usd / (1 + (flowerData.change30d || 0) / 100),
          sparkline7d: flowerData.sparkline
            ? (() => {
                const raw = flowerData.sparkline
                const reduced: number[] = []
                for (let i = 0; i < raw.length; i += Math.ceil(raw.length / 7)) {
                  reduced.push(raw[i])
                }
                if (reduced[reduced.length - 1] !== raw[raw.length - 1]) {
                  reduced.push(raw[raw.length - 1])
                }
                return reduced.slice(-8)
              })()
            : [],
        },
        trades7d: flowerData.totalVolume || 0,
        supply: 256000000,
        category: "resources",
      }

      if (window.__sflMarketInitialized && marketData.length > 0) {
        renderSflDashboard()
      }

      if (document.getElementById("tableBody") && activeConfig) {
        const currentSearchInput = document.getElementById("searchInput") as HTMLInputElement | null
        renderTable(currentSearchInput ? currentSearchInput.value : "", true)
      }
    }
  })

  if (!window.__sflVisibilityListenerRegistered) {
    window.__sflVisibilityListenerRegistered = true
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "hidden" && marketData.length > 0) {
        initSparklineHover()
      }
    })
  }

  document.addEventListener("astro:page-load", () => {
    window.__sflMarketInitialized = false
    init()
  })
}

export function initSflMarketView(): void {
  registerLifecycleListeners()

  // Precarga deduplicada de datos de mercado
  void SflMarket.fetchMarketData()

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 1)
  } else {
    document.addEventListener("DOMContentLoaded", init)
  }
}
