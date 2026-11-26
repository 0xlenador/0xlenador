// ============================================================================
// src/lib/sfl/marketDashboard.ts
// Motor de renderizado del Dashboard de 7 cajas, conversor de monedas/estación,
// carruseles y métricas CoinGecko (6.1) para SflMarketView.astro.
// ============================================================================

import {
  BASE_GEM_FIAT_PRICE,
  CRYPTO_PAYMENT_DISCOUNT,
  DEFAULT_OIL_MULTIPLIER,
  getGemFiatPrice,
} from "./constants"
import type { ChangeResult, MarketItemRecord } from "./marketChart"

export interface DashboardMarketItem extends MarketItemRecord {
  volume24h?: number
}

export interface TopTradeRecord {
  sfl?: number
  items?: Record<string, unknown>
  buyer?: {
    username?: string
    bumpkinUri?: string
  }
}

export interface MarketDashboardData {
  volume: number
  trades: number
  owners: number
  topTrades?: TopTradeRecord[]
}

export interface CoinGeckoAssetQuote {
  usd?: number
  change24h?: number
  change7d?: number
  change30d?: number
  sparkline?: number[]
  totalVolume?: number
}

export type CoinGeckoDataMap = Record<string, CoinGeckoAssetQuote>

export interface BudsSummary {
  volume7d?: number
  trades7d?: number
}

export interface DashboardLabels {
  dashMcapTitle: string
  dashMcapTooltipTitle: string
  dashMcapTooltipDesc: string
  dashCatPowerups: string
  dashCatResources: string
  dashCatCosmetics: string
  dashPending: string
  dashCatVol: string
  dashCatSales: string
  dashCatTitle: string
  dashCatTooltipTitle: string
  dashCatTooltipDesc: string
  seasons: [string, string, string, string]
  days: string[]
  seasonOf: string
  dashWhales: string
  dashFgNeutral: string
  dashFgExtremeFear: string
  dashFgFear: string
  dashFgGreed: string
  dashFgExtremeGreed: string
  dashFgTitle: string
  dashFgTooltipTitle: string
  dashFgTooltipDesc: string
  dashOverviewTitle: string
  dashOverviewFullTime: string
  dashOverviewTotalVol: string
  dashOverviewTotalTrades: string
  dashOverviewHolders: string
  vol: string
  gainer24h: string
  topGainers: string
  gainer30d: string
  gainer180d: string
  nearAth: string
  nearAtl: string
  tooltipAth: string
  tooltipAtl: string
}

export interface MarketDashboardContext {
  getMarketData: () => DashboardMarketItem[]
  getDashboardData: () => MarketDashboardData | null
  getItemImageSrc: (item: DashboardMarketItem | undefined) => string
  formatNumber: (num: number, decimals?: number) => string
  createSparklineSVG: (
    dataArray: (number | null | undefined)[],
    isPositive: boolean,
    expectedLengthParam?: number,
    isHourly?: boolean,
    formatType?: string,
  ) => string
  calculateChange: (current: number, past: number | null | undefined) => ChangeResult
  labels: DashboardLabels
}

type CategoryKey = "powerups" | "resources" | "cosmetics" | "buds" | "pets"
type CalcCurrency = "FLOWER" | "COIN" | "USD" | "Gema" | "Oil"
type GainerPeriodKey = "1d" | "7d" | "30d" | "180d"
type CarouselAbortKey = "__gainerAborter" | "__extremesAborter"

interface CategoryBucket {
  vol: number
  sales: number
  label: string
  name: string
  icon?: string
}

interface TopMoverItem extends DashboardMarketItem {
  changeVal: number
}

interface RankedRatioItem extends DashboardMarketItem {
  ratio: number
  refPrice: number
}

declare global {
  interface Window {
    sflUsdPrice?: number
    sflInternalPrice?: number
    sflBudsSummary?: BudsSummary
    sflOilMultiplier?: number
    sflOilDrillCost?: number
    sflBestOilPriceFlower?: number
    sflBestCoinsPerFlower?: number
    sflGemBonus?: number
    sflGemBonusManual?: boolean
    seasonInterval?: ReturnType<typeof setInterval>
    currentSlide3?: number
    updateBox3Slider?: () => void
    nextBox3Slide?: (e?: Event) => void
    updateOilMultiplier?: (val: number | string) => void
    updateGemBonus?: (val: number | string) => void
    updateCalc?: () => void
    scrollToItem?: (itemName: string, event?: Event) => void
    updateDash61Changes?: (dataMap: CoinGeckoDataMap) => void
    __CoinGeckoEngine?: CoinGeckoDataMap
    __box3Aborter?: AbortController
    __gainerAborter?: AbortController
    __extremesAborter?: AbortController
    __gainerInterval?: ReturnType<typeof setInterval>
    __extremesInterval?: ReturnType<typeof setInterval>
    __initSflMarketDashboard?: (ctx: MarketDashboardContext) => void
    __renderSflDashboard?: () => void
    __sflMarketDashboardCtx?: MarketDashboardContext
  }
}

let activeDashboardCtx: MarketDashboardContext | null = null

const formatLarge = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T"
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
  return num.toFixed(2)
}

const escapeAttr = (value: string): string => value.replace(/"/g, "&quot;")

function renderBox1MarketCap(
  marketData: DashboardMarketItem[],
  sflUsdPrice: number,
  createSparklineSVG: MarketDashboardContext["createSparklineSVG"],
  labels: DashboardLabels,
): void {
  let currentTotalMC = 0
  let historicalTotalMC = 0
  let sparklineLength = 0

  marketData.forEach((item) => {
    const supply = item.supply || 0
    const s7d = item.history?.sparkline7d
    if (supply > 0 && s7d && s7d.length > sparklineLength) {
      sparklineLength = s7d.length
    }
  })

  const totalSparkline7d: number[] = Array(sparklineLength > 0 ? sparklineLength : 1).fill(0)

  marketData.forEach((item) => {
    const supply = item.supply || 0
    if (supply <= 0 || item.currentPrice <= 0) return

    currentTotalMC += supply * item.currentPrice

    let pastPrice = 0
    let historicalFallback = 0
    const s7d = item.history?.sparkline7d

    if (item.history) {
      if (item.history["7d"]) {
        pastPrice = item.history["7d"]
      }
      if (s7d) {
        for (let j = 0; j < s7d.length - 1; j++) {
          const pt = s7d[j]
          if (pt !== null && pt !== undefined) {
            historicalFallback = pt
            if (!pastPrice) pastPrice = historicalFallback
            break
          }
        }
      }
    }

    historicalTotalMC += supply * pastPrice

    if (s7d && s7d.length > 0) {
      const offset = sparklineLength - s7d.length
      s7d.forEach((price, idx) => {
        const isToday = idx === s7d.length - 1
        const fallback = isToday ? item.currentPrice : historicalFallback
        totalSparkline7d[idx + offset] +=
          supply * (price !== null && price !== undefined ? price : fallback)
      })
    } else if (sparklineLength > 0) {
      for (let i = 0; i < sparklineLength; i++) {
        const isToday = i === sparklineLength - 1
        totalSparkline7d[i] += supply * (isToday ? item.currentPrice : 0)
      }
    }
  })

  const mcChangeValue =
    historicalTotalMC > 0 ? ((currentTotalMC - historicalTotalMC) / historicalTotalMC) * 100 : 0
  const mcIsPositive = mcChangeValue >= 0
  const mcInUsd = currentTotalMC * sflUsdPrice

  const box1 = document.getElementById("dashBox1")
  if (!box1 || totalSparkline7d.length === 0) return

  const sparklineSVG = createSparklineSVG(
    totalSparkline7d,
    mcIsPositive,
    sparklineLength,
    false,
    "usd-large-sfl",
  )
  box1.innerHTML = `
    <div class="absolute inset-0 w-full h-full flex flex-col group">
       <!-- Textos superiores (50%) -->
       <div class="h-[50%] w-full pt-2.5 px-4 flex justify-between items-start relative z-20 focus-within:z-[70] hover:z-[70]">
          <div class="flex flex-col justify-start">
             <div class="flex items-center mb-1 relative">
                <h3 class="text-xs font-sans font-bold text-white/90 tracking-wide">
                   ${labels.dashMcapTitle}
                </h3>
                <button class="relative group cursor-pointer text-terminal-muted hover:text-white transition-colors focus:outline-none ml-1.5 pt-[1px]" aria-label="Información">
                   <svg class="w-[11px] h-[11px]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                   </svg>
                   <div class="absolute left-0 top-full mt-2 w-52 p-2.5 bg-[#0c1015] border border-white/10 rounded-lg shadow-2xl text-[9.5px] text-white/70 font-sans text-left leading-relaxed opacity-0 invisible group-focus:opacity-100 group-focus:visible transition-all z-50 pointer-events-none">
                      <span class="block text-white font-bold mb-1">${labels.dashMcapTooltipTitle}</span>
                      ${labels.dashMcapTooltipDesc}
                   </div>
                </button>
             </div>
             <div class="flex items-baseline gap-2.5 flex-wrap">
                 <span class="text-2xl font-sans font-bold text-white tracking-tight leading-none flex items-center gap-1.5">${formatLarge(currentTotalMC)} <img src="/img/sunflowerland/flower.jpg" alt="FLOWER" class="w-5 h-5 rounded-full inline-block opacity-70" /></span>
                 <span class="text-xs font-sans font-bold tracking-wide ${mcIsPositive ? "text-emerald-500" : "text-red-500"}">
                    ${mcIsPositive ? "↗" : "↘"} ${Math.abs(mcChangeValue).toFixed(2)}%
                 </span>
              </div>
              ${sflUsdPrice ? `<div class="text-[11px] text-white/40 font-mono leading-none mt-0.5">~$${formatLarge(mcInUsd)}</div>` : ""}
          </div>
          <span class="text-[10px] font-bold text-blue-500">7D</span>
       </div>
       
       <!-- Espacio intermedio (8%) -->
       <div class="h-[8%] w-full"></div>
       
       <!-- Gráfica (42%) -->
       <div class="h-[42%] w-full px-4 pb-3 flex items-end relative z-40">
          <div class="w-full h-full">
             ${sparklineSVG}
          </div>
       </div>
    </div>
  `
  box1.classList.remove("items-center", "justify-center")
}

function renderBox5CategoryDistribution(
  marketData: DashboardMarketItem[],
  sflUsdPrice: number,
  formatNumber: MarketDashboardContext["formatNumber"],
  labels: DashboardLabels,
): void {
  const box5 = document.getElementById("dashBox5")
  if (!box5) return

  const catData: Record<CategoryKey, CategoryBucket> = {
    powerups: {
      vol: 0,
      sales: 0,
      label: "PWR",
      name: labels.dashCatPowerups,
      icon: "/img/sunflowerland/123/energy.png",
    },
    resources: {
      vol: 0,
      sales: 0,
      label: "RES",
      name: labels.dashCatResources,
      icon: "/img/sunflowerland/Eggplant.png",
    },
    cosmetics: {
      vol: 0,
      sales: 0,
      label: "COSM",
      name: labels.dashCatCosmetics,
      icon: "/img/sunflowerland/123/bear.png",
    },
    buds: {
      vol: 0,
      sales: 0,
      label: "BUDS",
      name: "Buds",
      icon: "/img/sunflowerland/123/bud.png",
    },
    pets: { vol: 0, sales: 0, label: "PETS", name: "Pets" },
  }

  marketData.forEach((item) => {
    const volUsd = (item.volume7d || 0) * sflUsdPrice
    const sales = item.trades7d || 0

    if (item.category in catData) {
      const bucket = catData[item.category as CategoryKey]
      bucket.vol += volUsd
      bucket.sales += sales
    }
  })

  // Si los Buds aún no están en marketData (carga lazy), usar el resumen ligero inyectado desde sfl_data.json
  if (catData.buds.vol === 0 && catData.buds.sales === 0 && window.sflBudsSummary) {
    catData.buds.vol = (window.sflBudsSummary.volume7d || 0) * sflUsdPrice
    catData.buds.sales = window.sflBudsSummary.trades7d || 0
  }

  const maxVol = Math.max(
    catData.powerups.vol,
    catData.resources.vol,
    catData.cosmetics.vol,
    catData.buds.vol,
    1,
  )
  const maxSales = Math.max(
    catData.powerups.sales,
    catData.resources.sales,
    catData.cosmetics.sales,
    catData.buds.sales,
    1,
  )

  const renderBar = (
    catKey: CategoryKey,
    isVol: boolean,
    isMuted: boolean,
    alignClass: string,
  ): string => {
    const d = catData[catKey]
    const val = isVol ? d.vol : d.sales
    const max = isVol ? maxVol : maxSales
    let height = 8 // stub
    if (!isMuted && max > 0 && val > 0) {
      const powVal = Math.pow(val, 1 / 3)
      const powMax = Math.pow(max, 1 / 3)
      height = Math.max(6, (powVal / powMax) * 100)
    }

    const color = isMuted ? "bg-white/5" : isVol ? "bg-amber-500" : "bg-blue-500"
    const valStr = isMuted
      ? labels.dashPending
      : isVol
        ? "$" + formatLarge(val)
        : formatNumber(val, 0)
    const typeStr = isVol ? labels.dashCatVol : labels.dashCatSales

    return `
      <div class="w-[35%] sm:w-[40%] rounded-t-sm relative group/bar flex flex-col justify-end transition-all hover:brightness-125 ${color}" style="height: ${height}%; min-height: 4px;">
        <div class="hidden group-hover/bar:flex absolute bottom-full mb-1 ${alignClass} bg-[#0c1015] border border-white/10 px-3 py-2 rounded shadow-2xl text-white z-50 whitespace-nowrap flex-col items-center gap-1">
           <span class="text-white/90 font-bold tracking-tight text-xs leading-none">${d.name}</span>
           <div class="flex items-center gap-1.5">
              <span class="text-white/50 text-[10px] font-sans uppercase">${typeStr}</span> <span class="font-bold tracking-tight text-xs">${valStr}</span>
           </div>
        </div>
      </div>
    `
  }

  const renderGroup = (
    catKey: CategoryKey,
    volMuted: boolean,
    mcMuted: boolean,
    index: number,
  ): string => {
    const cat = catData[catKey]
    const iconHtml = cat.icon
      ? `<img src="${cat.icon}" class="w-[11px] h-[11px] object-contain opacity-80 pixelated" />`
      : ""
    const alignClass =
      index === 0 ? "left-[-8px]" : index === 4 ? "right-[-8px]" : "left-1/2 -translate-x-1/2"

    return `
      <div class="flex flex-col items-center justify-end h-full w-[18%]">
         <div class="flex items-end gap-1 w-full h-[65%] justify-center border-b border-white/10 pb-1.5 mb-1.5 relative">
            ${renderBar(catKey, true, volMuted, alignClass)}
            ${renderBar(catKey, false, mcMuted, alignClass)}
         </div>
         <div class="flex items-center gap-1">
            ${iconHtml}
            <span class="text-[9px] text-white/50 font-bold uppercase tracking-tight">${cat.label}</span>
         </div>
      </div>
    `
  }

  box5.innerHTML = `
    <div class="absolute inset-0 w-full h-full pt-2.5 pb-2 px-4 flex flex-col justify-between group">
       <div class="flex justify-between items-start mb-2 relative z-30 focus-within:z-[70] hover:z-[70]">
          <div class="flex items-center">
             <h3 class="text-[11px] font-sans font-bold text-white/80 tracking-wide">${labels.dashCatTitle}</h3>
             <button class="relative group cursor-pointer text-terminal-muted hover:text-white transition-colors focus:outline-none ml-1.5 pt-[1px]" aria-label="Información">
                <svg class="w-[11px] h-[11px]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <path d="M12 16v-4"></path>
                   <path d="M12 8h.01"></path>
                </svg>
                <div class="absolute left-0 top-full mt-2 w-52 p-2.5 bg-[#0c1015] border border-white/10 rounded-lg shadow-2xl text-[9.5px] text-white/70 font-sans text-left leading-relaxed opacity-0 invisible group-focus:opacity-100 group-focus:visible transition-all z-[80] pointer-events-none">
                   <span class="block text-white font-bold mb-1">${labels.dashCatTooltipTitle}</span>
                   ${labels.dashCatTooltipDesc}
                </div>
             </button>
          </div>
          <div class="flex items-center gap-3">
             <div class="flex gap-2 bg-black/20 px-2 py-1 rounded border border-white/5">
                <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-sm bg-amber-500"></div><span class="text-[8px] text-white/50 uppercase tracking-tight">Vol</span></div>
                <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-sm bg-blue-500"></div><span class="text-[8px] text-white/50 uppercase tracking-tight">Sales</span></div>
             </div>
             <span class="text-[10px] font-bold text-blue-500">7D</span>
          </div>
       </div>
       <div class="flex-1 flex items-end justify-between w-full relative z-20 hover:z-[80]">
          ${renderGroup("resources", false, false, 0)}
          ${renderGroup("powerups", false, false, 1)}
          ${renderGroup("cosmetics", false, false, 2)}
          ${renderGroup("buds", false, false, 3)}
          ${renderGroup("pets", true, true, 4)}
       </div>
    </div>
  `
  box5.classList.remove("items-center", "justify-center")
}

function renderBox2SeasonAndConverter(labels: DashboardLabels): void {
  const box2 = document.getElementById("dashBox2")
  if (!box2) return

  const updateSeasonStyle = () => {
    const currentBox2 = document.getElementById("dashBox2")
    if (!currentBox2) {
      if (window.seasonInterval) {
        clearInterval(window.seasonInterval)
        window.seasonInterval = undefined
      }
      return
    }

    const now = Date.now()
    const epoch = Date.UTC(2026, 7, 17, 0, 0, 0) // Monday, Aug 17, 2026 00:00:00 UTC
    const msPerDay = 24 * 60 * 60 * 1000
    const msPerWeek = 7 * msPerDay
    const diff = now - epoch

    const daysSinceEpoch = Math.floor(diff / msPerDay)
    const dayOfWeekIndex = ((daysSinceEpoch % 7) + 7) % 7

    const weeksSinceEpoch = Math.floor(diff / msPerWeek)
    const seasonIndex = ((weeksSinceEpoch % 4) + 4) % 4

    const seasons = [
      {
        name: labels.seasons[0],
        border: "border-blue-400/50",
        shadow: "shadow-[inset_0_0_15px_rgba(96,165,250,0.15)]",
        color: "text-blue-300",
        img: "/img/sunflowerland/123/invierno.webp",
      },
      {
        name: labels.seasons[1],
        border: "border-emerald-400/50",
        shadow: "shadow-[inset_0_0_15px_rgba(52,211,153,0.15)]",
        color: "text-emerald-300",
        img: "/img/sunflowerland/123/primavera.webp",
      },
      {
        name: labels.seasons[2],
        border: "border-yellow-400/50",
        shadow: "shadow-[inset_0_0_15px_rgba(250,204,21,0.15)]",
        color: "text-yellow-300",
        img: "/img/sunflowerland/123/verano.webp",
      },
      {
        name: labels.seasons[3],
        border: "border-orange-500/50",
        shadow: "shadow-[inset_0_0_15px_rgba(249,115,22,0.15)]",
        color: "text-orange-300",
        img: "/img/sunflowerland/123/otono.webp",
      },
    ]

    const currentDayName = labels.days[dayOfWeekIndex] || ""
    const currentSeason = seasons[seasonIndex]

    const seasonClasses = [
      "border-blue-400/50",
      "shadow-[inset_0_0_15px_rgba(96,165,250,0.15)]",
      "border-emerald-400/50",
      "shadow-[inset_0_0_15px_rgba(52,211,153,0.15)]",
      "border-yellow-400/50",
      "shadow-[inset_0_0_15px_rgba(250,204,21,0.15)]",
      "border-orange-500/50",
      "shadow-[inset_0_0_15px_rgba(249,115,22,0.15)]",
    ]

    currentBox2.classList.remove(...seasonClasses, "border-white/5", "shadow-inner")
    currentBox2.classList.add(
      currentSeason.border,
      currentSeason.shadow,
      "transition-all",
      "duration-1000",
    )

    const seasonImgEl = document.getElementById("seasonImg") as HTMLImageElement | null
    const seasonTextEl = document.getElementById("seasonText")
    if (seasonImgEl && seasonTextEl) {
      seasonImgEl.src = currentSeason.img
      seasonTextEl.textContent = currentDayName + " " + labels.seasonOf + " " + currentSeason.name
      seasonTextEl.className =
        "text-[10px] font-bold uppercase tracking-wider mt-[1px] " + currentSeason.color
    }
  }

  const prevInput = document.getElementById("calcInput") as HTMLInputElement | null
  const currentAmount = prevInput ? prevInput.value : "1"
  const currentCurrObj = document.querySelector(
    'input[name="calcCurr"]:checked',
  ) as HTMLInputElement | null
  const currentCurr = (currentCurrObj ? currentCurrObj.value : "FLOWER") as CalcCurrency
  const currentGemBonus = window.sflGemBonus !== undefined ? window.sflGemBonus : 0.29

  const icons: Record<Exclude<CalcCurrency, "USD">, string> = {
    FLOWER: "/img/sunflowerland/flower.jpg",
    COIN: "/img/sunflowerland/123/coins.png",
    Gema: "/img/sunflowerland/123/Gem.png",
    Oil: "/img/sunflowerland/123/Oil.png",
  }

  const currenciesList: CalcCurrency[] = ["FLOWER", "COIN", "USD", "Gema", "Oil"]

  box2.innerHTML = `
    <div class="absolute inset-0 w-full h-full p-2 flex gap-2 z-20">
       <div class="w-[38%] flex flex-col h-full border-r border-white/5 pr-2">
          <div class="relative w-full mb-1.5 shrink-0 h-[22px]">
             <input type="number" id="calcInput" value="${currentAmount}" step="any" class="block w-full h-[22px] bg-[#0c1015] border border-white/10 rounded pl-1.5 pr-6 text-[11px] font-mono text-white outline-none focus:border-white/30 transition-colors shadow-inner" />
             <button id="calcClearBtn" class="hidden absolute right-1 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 focus:outline-none transition-colors w-4 h-4 flex items-center justify-center rounded hover:bg-white/5" onclick="document.getElementById('calcInput').value='1'; window.updateCalc();" title="Resetear a 1">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
          <div class="flex flex-col gap-[3px] flex-1 min-h-0" id="calcRadios">
             ${currenciesList
               .map((c) => {
                 const iconHTML =
                   c === "USD"
                     ? '<span class="text-emerald-400 font-bold text-[10px] leading-none">$</span>'
                     : `<img src="${icons[c]}" alt="${c}" class="w-full h-full object-contain drop-shadow-sm ${c === "FLOWER" ? "rounded-full" : "pixelated"}" onerror="this.outerHTML='<span class=\\'text-emerald-400 font-bold text-[10px]\\'>$</span>'" />`
                 return `
                <label class="flex items-center gap-1.5 cursor-pointer group h-[14px]">
                   <input type="radio" name="calcCurr" value="${c}" ${c === currentCurr ? "checked" : ""} class="hidden peer" onchange="window.updateCalc()" />
                   <div class="w-2 h-2 rounded-full border border-white/20 peer-checked:border-white peer-checked:bg-white group-hover:border-white/50 transition-all shrink-0"></div>
                   <div class="w-[10px] h-[10px] flex items-center justify-center shrink-0">
                      ${iconHTML}
                   </div>
                   <span class="text-[8.5px] font-bold text-white/40 peer-checked:text-white/90 group-hover:text-white/70 transition-colors uppercase tracking-widest leading-none mt-[1px]">${c}</span>
                   ${
                     c === "Oil"
                       ? `
                     <div class="ml-auto flex items-center gap-[2px]" onclick="event.stopPropagation()">
                       <span class="text-[8px] text-white/30 font-bold mt-[1px]">x</span>
                       <input type="number" id="oilMultiplierInput" value="${window.sflOilMultiplier || DEFAULT_OIL_MULTIPLIER}" step="any" class="w-10 bg-[#0c1015] border border-white/10 rounded px-1 py-[1px] text-[8.5px] font-mono text-white/70 outline-none focus:border-white/30 transition-colors text-center" oninput="window.updateOilMultiplier(this.value)" />
                     </div>
                   `
                       : ""
                   }
                   ${
                     c === "Gema"
                       ? `
                     <div class="ml-auto flex items-center">
                       <span class="text-[9.5px] font-mono font-bold text-emerald-400/90 tracking-tight mt-[1px]">+<input type="number" id="gemBonusInput" value="${(currentGemBonus * 100).toFixed(1).replace(".0", "")}" step="any" class="w-9 bg-transparent border-none text-[9.5px] font-mono text-emerald-400 outline-none text-center p-0 m-0 shadow-none appearance-none cursor-text" onfocus="this.select()" oninput="window.sflGemBonusManual = true; window.updateGemBonus(this.value / 100)" />%</span>
                     </div>
                   `
                       : ""
                   }
                </label>
             `
               })
               .join("")}
          </div>
       </div>
       
       <div class="w-[62%] flex flex-col h-full pl-0.5">
          <div class="w-full mb-1.5 h-[22px] bg-[#0c1015] border border-white/10 rounded px-2 shadow-inner flex items-center justify-center gap-1.5 shrink-0" id="seasonBar">
             <img id="seasonImg" src="" class="w-[14px] h-[14px] object-contain drop-shadow-sm pixelated" />
             <span id="seasonText" class="text-[10px] font-bold uppercase tracking-wider mt-[1px] leading-none"></span>
          </div>
          <div class="w-full flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-1" id="calcOutputs">
          </div>
       </div>
    </div>
  `

  updateSeasonStyle()
  if (window.seasonInterval) clearInterval(window.seasonInterval)
  window.seasonInterval = setInterval(updateSeasonStyle, 60000)

  window.updateOilMultiplier = (val: number | string) => {
    const mult = typeof val === "number" ? val : parseFloat(val)
    if (isNaN(mult) || mult <= 0) return
    window.sflOilMultiplier = mult
    if (window.sflOilDrillCost && window.sflOilDrillCost > 0) {
      window.sflBestOilPriceFlower = window.sflOilDrillCost / mult
    }
    window.updateCalc?.()
  }

  window.updateGemBonus = (val: number | string) => {
    const parsed = typeof val === "number" ? val : parseFloat(val)
    if (!isNaN(parsed)) {
      window.sflGemBonus = parsed
      window.updateCalc?.()
    }
  }

  window.updateCalc = () => {
    const inputEl = document.getElementById("calcInput") as HTMLInputElement | null
    if (!inputEl) return
    const rawValue = inputEl.value
    let amount = parseFloat(rawValue)
    if (isNaN(amount)) amount = 0

    const clearBtn = document.getElementById("calcClearBtn")
    if (clearBtn) {
      if (rawValue !== "1") clearBtn.classList.remove("hidden")
      else clearBtn.classList.add("hidden")
    }

    // Si el usuario cambia el input principal, reactivamos el auto-cálculo si estaban interactuando con otra cosa
    if (document.activeElement === inputEl) {
      window.sflGemBonusManual = false
    }

    const checkedRadio = document.querySelector(
      'input[name="calcCurr"]:checked',
    ) as HTMLInputElement | null
    const selectedCurr = (checkedRadio ? checkedRadio.value : "FLOWER") as CalcCurrency

    // Usamos el precio interno del juego para la calculadora porque las Gemas y monedas se basan en este oráculo interno
    const sflPrice = window.sflInternalPrice || window.sflUsdPrice || 0.073

    const rates: Record<CalcCurrency, number> = {
      FLOWER: 1,
      COIN: 1 / (window.sflBestCoinsPerFlower || 1330),
      USD: 1 / sflPrice,
      Oil: window.sflBestOilPriceFlower || 0.107,
      Gema: 1,
    }

    const baseAmountTmp = selectedCurr !== "Gema" ? amount * rates[selectedCurr] : 0

    let fiatPricePerGem = BASE_GEM_FIAT_PRICE
    if (window.sflGemBonusManual && window.sflGemBonus !== undefined) {
      fiatPricePerGem = BASE_GEM_FIAT_PRICE / (1 + window.sflGemBonus)
    } else if (selectedCurr === "Gema") {
      fiatPricePerGem = getGemFiatPrice(amount)
    } else {
      const usdValue = baseAmountTmp * sflPrice
      let targetGems = usdValue / (BASE_GEM_FIAT_PRICE * CRYPTO_PAYMENT_DISCOUNT)
      for (let i = 0; i < 3; i++) {
        fiatPricePerGem = getGemFiatPrice(targetGems)
        targetGems = usdValue / (fiatPricePerGem * CRYPTO_PAYMENT_DISCOUNT)
      }
    }

    const gemBonus = BASE_GEM_FIAT_PRICE / fiatPricePerGem - 1
    window.sflGemBonus = gemBonus

    const gemBonusInput = document.getElementById("gemBonusInput") as HTMLInputElement | null
    if (gemBonusInput && !window.sflGemBonusManual) {
      gemBonusInput.value = (gemBonus * 100).toFixed(1).replace(".0", "")
    }

    // El costo mostrado en USD es el precio fiat con el descuento de cripto del 20%
    const gemCostUsd = fiatPricePerGem * CRYPTO_PAYMENT_DISCOUNT
    const gemCostFlower = gemCostUsd / sflPrice

    rates.Gema = gemCostFlower

    const baseAmount = amount * rates[selectedCurr]
    const currencies: CalcCurrency[] = ["FLOWER", "COIN", "USD", "Gema", "Oil"]
    const targets = currencies.filter((c) => c !== selectedCurr)

    const colors: Record<CalcCurrency, string> = {
      FLOWER: "text-emerald-400",
      COIN: "text-amber-400",
      USD: "text-cyan-400",
      Gema: "text-fuchsia-400",
      Oil: "text-slate-300",
    }

    const outHTML = targets
      .map((c) => {
        const val = baseAmount / rates[c]

        let formatted: string
        if (val === 0) formatted = "0"
        else if (val < 0.0001) formatted = val.toExponential(2)
        else if (val < 1) formatted = val.toFixed(4)
        else if (val < 100) formatted = val.toFixed(2)
        else if (val < 1000) formatted = val.toLocaleString("en-US", { maximumFractionDigits: 2 })
        else formatted = val.toLocaleString("en-US", { maximumFractionDigits: 0 })

        return `
          <div class="bg-black/30 rounded-lg border border-white/5 p-1 flex flex-col justify-center items-center relative overflow-hidden group w-full h-full min-h-0">
             <span class="text-[8px] uppercase font-bold text-white/30 tracking-widest mb-0 z-10">${c}</span>
             <span class="text-[13px] font-mono font-bold ${colors[c]} z-10 drop-shadow-md truncate w-full text-center leading-none" title="${val}">${formatted}</span>
             <div class="absolute inset-0 bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        `
      })
      .join("")

    const outContainer = document.getElementById("calcOutputs")
    if (outContainer) outContainer.innerHTML = outHTML
  }

  document.getElementById("calcInput")?.addEventListener("input", () => window.updateCalc?.())
  window.updateCalc()
}

function renderBox3TopMovers(
  marketData: DashboardMarketItem[],
  getItemImageSrc: MarketDashboardContext["getItemImageSrc"],
  labels: DashboardLabels,
): void {
  const box3 = document.getElementById("dashBox3")
  if (!box3 || !marketData) return

  const getTop = (cat: string, isGainer: boolean): TopMoverItem[] | null => {
    const items = marketData.filter(
      (i) => i.category === cat && i.history && i.history["1d"] && i.currentPrice,
    )
    if (items.length === 0) return null
    let mapped: TopMoverItem[] = items.map((item) => {
      const past1d = item.history?.["1d"] || 1
      const change = ((item.currentPrice - past1d) / past1d) * 100
      return { ...item, changeVal: change }
    })

    if (isGainer) {
      mapped = mapped.filter((i) => i.changeVal > 0)
      mapped.sort((a, b) => b.changeVal - a.changeVal)
    } else {
      mapped = mapped.filter((i) => i.changeVal < 0)
      mapped.sort((a, b) => a.changeVal - b.changeVal)
    }

    return mapped.length > 0 ? mapped.slice(0, 3) : null
  }

  const topResG = getTop("resources", true)
  const topPwrG = getTop("powerups", true)
  const topCosmG = getTop("cosmetics", true)
  const topBudsG = getTop("buds", true)

  const topResL = getTop("resources", false)
  const topPwrL = getTop("powerups", false)
  const topCosmL = getTop("cosmetics", false)
  const topBudsL = getTop("buds", false)

  const renderRow = (label: string, topItems: TopMoverItem[] | null): string => {
    if (!topItems || topItems.length === 0) {
      return `
        <div class="flex items-center justify-between py-[3px] px-1 -mx-1">
           <div class="w-[75px] shrink-0 opacity-70">
              <span class="text-[9px] font-bold uppercase tracking-wider text-white/50">${label}</span>
           </div>
           <span class="text-[8px] font-mono text-white/30 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">${labels.dashPending}</span>
        </div>
      `
    }

    const itemsHTML = topItems
      .map((topItem) => {
        const isPos = topItem.changeVal >= 0
        const changeColor = isPos ? "text-emerald-400" : "text-red-400"
        const changeSign = isPos ? "+" : ""

        const itemImgSrc = getItemImageSrc(topItem)
        const safeItemNameForHtml = escapeAttr(topItem.name)

        return `
          <div class="flex items-center gap-[3px] cursor-pointer group hover:bg-white/[0.05] rounded px-[3px] py-[2px] transition-colors" data-item="${safeItemNameForHtml}" onclick="window.scrollToItem(this.dataset.item, event)" title="${safeItemNameForHtml}">
             <div class="w-[18px] h-[18px] rounded bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-white/10 transition-colors">
                <img src="${itemImgSrc}" class="w-[85%] h-[85%] object-contain drop-shadow-sm pixelated" onerror="this.src='/img/sunflowerland/123/bear.png'" />
             </div>
             <span class="text-[9px] font-mono font-bold ${changeColor}">${changeSign}${topItem.changeVal.toFixed(1)}%</span>
          </div>
        `
      })
      .join("")

    return `
      <div class="flex items-center justify-between py-[2px] px-1 -mx-1">
         <div class="w-[75px] shrink-0 opacity-70">
            <span class="text-[9px] font-bold uppercase tracking-wider text-white/50">${label}</span>
         </div>
         <div class="flex flex-1 justify-end items-center gap-1 sm:gap-1.5">
            ${itemsHTML}
         </div>
      </div>
    `
  }

  if (typeof window.currentSlide3 === "undefined") {
    window.currentSlide3 = 0
  }

  window.updateBox3Slider = () => {
    const currentBox = document.getElementById("dashBox3")
    if (!currentBox) return

    const s1 = currentBox.querySelector("#slideGainers")
    const s2 = currentBox.querySelector("#slideLosers")
    const title = currentBox.querySelector("#box3Title")
    const titleIcon = currentBox.querySelector("#box3TitleIcon")
    const sliderSvg = currentBox.querySelector("#sliderSvg3")

    if (!s1 || !s2 || !title || !titleIcon) return

    if (window.currentSlide3 === 0) {
      s1.classList.remove("hidden")
      s2.classList.add("hidden")
      title.textContent = "Top Gainers"
      titleIcon.classList.remove("text-red-500")
      titleIcon.classList.add("text-emerald-500")
      titleIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>'
      if (sliderSvg) {
        sliderSvg.classList.remove("text-red-500")
        sliderSvg.classList.add("text-emerald-500")
      }
    } else {
      s1.classList.add("hidden")
      s2.classList.remove("hidden")
      title.textContent = "Top Losers"
      titleIcon.classList.remove("text-emerald-500")
      titleIcon.classList.add("text-red-500")
      titleIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>'
      if (sliderSvg) {
        sliderSvg.classList.remove("text-emerald-500")
        sliderSvg.classList.add("text-red-500")
      }
    }

    let circle = currentBox.querySelector("#sliderProgress3") as SVGElement | null
    if (circle) {
      const newCircle = circle.cloneNode(true) as SVGElement
      circle.parentNode?.replaceChild(newCircle, circle)
      circle = newCircle

      if (window.__box3Aborter) window.__box3Aborter.abort()
      window.__box3Aborter = new AbortController()

      circle.style.animation = "fillCircle 10s linear forwards"
      if (window.nextBox3Slide) {
        circle.addEventListener("animationend", window.nextBox3Slide, {
          signal: window.__box3Aborter.signal,
        })
      }
    }
  }

  window.nextBox3Slide = (e?: Event) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    window.currentSlide3 = ((window.currentSlide3 || 0) + 1) % 2
    window.updateBox3Slider?.()
  }

  box3.innerHTML = `
    <div class="absolute inset-0 w-full h-full pt-2 pb-2 px-3.5 flex flex-col group">
       <div class="flex justify-between items-center mb-1 relative z-30">
          <div class="flex items-center gap-1.5">
             <svg id="box3TitleIcon" class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             <h3 id="box3Title" class="text-[11px] font-sans font-bold text-white/80 tracking-wide">
                Top Gainers
             </h3>
          </div>
          <div class="flex items-center gap-1.5 cursor-pointer group/btn" onclick="window.nextBox3Slide(event)">
             <svg id="sliderSvg3" width="12" height="12" viewBox="0 0 24 24" class="transform -rotate-90 text-emerald-500 transition-colors">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" stroke-width="3" fill="none" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="62.83" stroke-dashoffset="62.83" id="sliderProgress3" stroke-linecap="round" />
             </svg>
             <span class="text-[10px] font-bold text-blue-500 group-hover/btn:text-blue-400 transition-colors">24H</span>
          </div>
       </div>
       <div id="slideGainers" class="flex-1 flex flex-col justify-between relative z-20 overflow-hidden w-full shrink-0">
          ${renderRow(labels.dashCatResources, topResG)}
          ${renderRow(labels.dashCatPowerups, topPwrG)}
          ${renderRow(labels.dashCatCosmetics, topCosmG)}
          ${renderRow("Buds", topBudsG)}
          ${renderRow("Pets", null)}
       </div>
       <div id="slideLosers" class="flex-1 flex flex-col justify-between relative z-20 overflow-hidden w-full shrink-0 hidden">
          ${renderRow(labels.dashCatResources, topResL)}
          ${renderRow(labels.dashCatPowerups, topPwrL)}
          ${renderRow(labels.dashCatCosmetics, topCosmL)}
          ${renderRow("Buds", topBudsL)}
          ${renderRow("Pets", null)}
       </div>
    </div>
  `
  box3.classList.remove("items-center", "justify-center")

  // Initialize the slider state and start interval
  setTimeout(() => {
    window.updateBox3Slider?.()
  }, 50)
}

function renderBox4Whales(
  dashboardData: MarketDashboardData | null,
  marketData: DashboardMarketItem[],
  sflUsdPrice: number,
  getItemImageSrc: MarketDashboardContext["getItemImageSrc"],
  formatNumber: MarketDashboardContext["formatNumber"],
  labels: DashboardLabels,
): void {
  const box4 = document.getElementById("dashBox4")
  if (!box4 || !dashboardData || !dashboardData.topTrades) return

  box4.innerHTML = `
    <div class="absolute inset-0 w-full h-full p-4 flex flex-col group">
       <div class="flex justify-between items-center mb-3 relative z-30">
          <h3 class="text-xs font-sans font-bold text-white/80 tracking-wide flex items-center gap-1.5">
             ${labels.dashWhales}
          </h3>
          <span class="text-[10px] font-bold text-blue-500">7D</span>
       </div>
       
       <div class="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
          ${dashboardData.topTrades
            .slice(0, 7)
            .map((trade) => {
              const sflValue = trade.sfl || 0
              const usdValue = sflValue * sflUsdPrice
              const itemName = (trade.items ? Object.keys(trade.items)[0] : undefined) || "Unknown"

              // Get NFT image logic
              const itemObj = marketData.find((m) => m.name === itemName)
              const itemImgSrc = getItemImageSrc(itemObj)

              const bumpkinImg = trade.buyer?.bumpkinUri
                ? "https://animations.sunflower-land.com/bumpkin_image/" +
                  trade.buyer.bumpkinUri +
                  "/100"
                : "/img/sunflowerland/123/bear.png"
              const safeItemNameForHtml = escapeAttr(itemName)

              return (
                '<div onclick="window.scrollToItem(this.dataset.item, event)" data-item="' +
                safeItemNameForHtml +
                '" class="relative group/row flex items-center justify-between py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04] border-t-white/[0.1] shadow-sm backdrop-blur-md hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] hover:-translate-y-[1px] transition-all duration-300 cursor-pointer">' +
                '<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-white/[0.0] via-white/[0.02] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 pointer-events-none"></div>' +
                '<div class="relative z-10 flex flex-col gap-0.5">' +
                "<!-- Fila NFT -->" +
                '<div class="flex items-center gap-1.5">' +
                '<div class="w-6 h-6 rounded bg-terminal-dark border border-white/5 flex items-center justify-center shrink-0 drop-shadow-md">' +
                '<img src="' +
                itemImgSrc +
                '" class="max-w-[80%] max-h-[80%] object-contain pixelated" onerror="this.src=\'/img/sunflowerland/123/bear.png\'" />' +
                "</div>" +
                '<span class="text-xs font-bold text-white/90 truncate max-w-[120px] sm:max-w-[150px] tracking-tight">' +
                itemName +
                "</span>" +
                "</div>" +
                "<!-- Fila Usuario -->" +
                '<div class="group/user flex items-center hover:z-30 relative origin-left transition-transform duration-300 hover:scale-[1.8] cursor-default">' +
                '<div class="flex items-center gap-1.5">' +
                '<div class="w-4 h-4 rounded-full bg-[#11131a] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 ml-1 relative shadow-sm group-hover/user:shadow-lg transition-shadow">' +
                '<img src="' +
                bumpkinImg +
                '" class="w-[120%] h-[120%] object-cover object-top" onerror="this.src=\'/img/sunflowerland/123/bear.png\'" />' +
                '<div class="absolute inset-0 bg-black/20 group-hover/user:bg-transparent transition-colors"></div>' +
                "</div>" +
                '<span class="text-[10px] text-white/50 group-hover/user:text-white/90 group-hover/user:font-semibold truncate max-w-[120px] sm:max-w-[150px] transition-all">' +
                (trade.buyer?.username || "Unknown") +
                "</span>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "<!-- Fila Precios -->" +
                '<div class="relative z-10 flex flex-col items-end justify-center">' +
                '<div class="flex items-center gap-1">' +
                '<img src="/img/sunflowerland/flower.jpg" class="w-3.5 h-3.5 rounded-full object-cover" onerror="this.style.display=\'none\'" />' +
                '<span class="text-[13px] font-bold text-white tracking-tight">' +
                formatNumber(sflValue, 0) +
                "</span>" +
                "</div>" +
                '<span class="text-[9px] text-white/40 font-mono">$' +
                usdValue.toFixed(2) +
                "</span>" +
                "</div>" +
                "</div>"
              )
            })
            .join("")}
       </div>
    </div>
  `
  box4.classList.remove("items-center", "justify-center")
}

function renderBox6FearAndGreed(
  marketData: DashboardMarketItem[],
  dashboardData: MarketDashboardData | null,
  sflUsdPrice: number,
  labels: DashboardLabels,
): void {
  const box6 = document.getElementById("dashBox6")
  if (!box6 || !dashboardData || !marketData) return

  // 1. Volume 24h vs 7d avg (34% weight)
  let vol24 = 0
  let vol7d = 0
  marketData.forEach((item) => {
    vol24 += item.volume24h || 0
    vol7d += item.volume7d || 0
  })
  const avgVol24 = vol7d / 7
  const volRatio = avgVol24 > 0 ? vol24 / avgVol24 : 1
  const volScore = Math.min(Math.max(volRatio * 50, 0), 100)

  // 2. SFL Price Change (33% weight)
  const sflScore = sflUsdPrice > 0.08 ? 65 : 45

  // 3. NFT Price Change Weighted (33% weight)
  let weightedChange = 0
  let totalWeight = 0
  marketData.forEach((item) => {
    const past1d = item.history?.["1d"]
    if (past1d && item.currentPrice) {
      const change = (item.currentPrice - past1d) / past1d
      const weight = item.volume24h || 1
      weightedChange += change * weight
      totalWeight += weight
    }
  })
  const avgChange = totalWeight > 0 ? weightedChange / totalWeight : 0
  const changeScore = Math.min(Math.max(50 + avgChange * 500, 0), 100)

  // Final Score
  const fngScore = Math.round(volScore * 0.34 + sflScore * 0.33 + changeScore * 0.33)

  let fngText = labels.dashFgNeutral
  let fngColor = "#eab308"
  if (fngScore <= 24) {
    fngText = labels.dashFgExtremeFear
    fngColor = "#ef4444"
  } else if (fngScore <= 49) {
    fngText = labels.dashFgFear
    fngColor = "#f97316"
  } else if (fngScore === 50) {
    fngText = labels.dashFgNeutral
    fngColor = "#eab308"
  } else if (fngScore <= 74) {
    fngText = labels.dashFgGreed
    fngColor = "#4ade80"
  } else {
    fngText = labels.dashFgExtremeGreed
    fngColor = "#22c55e"
  }

  // Rotate needle based on score (0 to 100 -> -90deg to +90deg)
  const needleRotation = (fngScore / 100) * 180 - 90

  box6.innerHTML = `
    <div class="absolute inset-0 w-full h-full pt-2.5 pb-2 px-4 flex flex-col group">
       <div class="flex justify-between items-start mb-1 relative z-30 focus-within:z-[70] hover:z-[70]">
          <div class="flex items-center">
             <h3 class="text-[11px] font-sans font-bold text-white/80 tracking-wide transition-colors">
                ${labels.dashFgTitle}
             </h3>
             <button class="relative group cursor-pointer text-terminal-muted hover:text-white transition-colors focus:outline-none ml-1.5 pt-[1px]" aria-label="Información">
                <svg class="w-[11px] h-[11px]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <path d="M12 16v-4"></path>
                   <path d="M12 8h.01"></path>
                </svg>
                <div class="absolute left-0 top-full mt-2 w-52 p-2.5 bg-[#0c1015] border border-white/10 rounded-lg shadow-2xl text-[9.5px] text-white/70 font-sans text-left leading-relaxed opacity-0 invisible group-focus:opacity-100 group-focus:visible transition-all z-[80] pointer-events-none">
                   <span class="block text-white font-bold mb-1">${labels.dashFgTooltipTitle}</span>
                   ${labels.dashFgTooltipDesc}
                </div>
             </button>
          </div>
       </div>
       
       <div class="flex-1 flex flex-col items-center justify-end relative z-10 pb-0.5">
          <div class="relative w-full max-w-[140px] aspect-[2/1] overflow-hidden flex justify-center mt-2">
             <!-- Mathematically perfect SVG gauge arcs -->
             <svg viewBox="0 0 100 56" class="w-full h-full absolute bottom-0 overflow-visible drop-shadow-md">
                <path d="M 8.00 50.00 A 42 42 0 0 1 15.18 26.51" fill="none" stroke="#ef4444" stroke-width="11" stroke-linecap="round" />
                <path d="M 16.68 24.43 A 42 42 0 0 1 36.67 10.17" fill="none" stroke="#f97316" stroke-width="11" stroke-linecap="round" />
                <path d="M 39.13 9.43 A 42 42 0 0 1 60.87 9.43" fill="none" stroke="#eab308" stroke-width="11" stroke-linecap="round" />
                <path d="M 63.33 10.17 A 42 42 0 0 1 83.32 24.43" fill="none" stroke="#4ade80" stroke-width="11" stroke-linecap="round" />
                <path d="M 84.82 26.51 A 42 42 0 0 1 92.00 50.00" fill="none" stroke="#22c55e" stroke-width="11" stroke-linecap="round" />
                
                <!-- Needle Dot -->
                <g transform="rotate(${needleRotation} 50 50)">
                   <circle cx="50" cy="8" r="5" fill="#3b82f6" stroke="white" stroke-width="2.5" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.6))" />
                </g>
             </svg>
             
             <!-- Center Score -->
             <div class="absolute bottom-0 flex flex-col items-center text-center leading-none">
                <span class="text-[26px] font-black tracking-tighter text-white drop-shadow-lg">${fngScore}</span>
             </div>
          </div>
          <span class="text-[11px] font-bold tracking-wide mt-1 drop-shadow-sm uppercase" style="color: ${fngColor}">${fngText}</span>
       </div>
    </div>
  `
  box6.classList.remove("items-center", "justify-center")
}

function renderBox61CryptoPrices(): void {
  const box6_1 = document.getElementById("dashBox6_1")
  if (!box6_1) return

  box6_1.innerHTML = `
    <div class="absolute inset-0 w-full h-full p-2.5 flex flex-col justify-center gap-1.5">
       <!-- FLOWER Row -->
       <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between px-1">
             <div class="flex items-center gap-1.5">
                <img src="/img/sunflowerland/flower.jpg" alt="FLOWER" class="w-3.5 h-3.5 rounded-full object-cover" />
                <span class="text-[11px] font-bold text-white tracking-wide">FLOWER</span>
             </div>
             <span class="text-[9px] font-bold text-blue-500">24H</span>
          </div>
          <div class="bg-[#1a1c23] rounded-lg py-1 px-2.5 flex items-center justify-between border border-white/5">
             <span id="dash_flower_price" class="text-[12px] font-bold text-white price-value tracking-tight" data-coin-id="flower-2">$---</span>
             <div id="dash_flower_change" class="flex items-center gap-0.5 text-[10px] font-bold text-terminal-muted">
                <span>-%</span>
             </div>
          </div>
       </div>

       <!-- BTC Row -->
       <div class="flex flex-col gap-1 mt-0.5">
          <div class="flex items-center justify-between px-1">
             <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 drop-shadow-sm" viewBox="0 0 32 32">
                   <circle cx="16" cy="16" r="16" fill="#F7931A" />
                   <path fill="#FFF" d="M22.5 13.9c-.2-1.3-1-2.2-2.5-2.6L20.5 9l-1.6-.4-.5 2c-.4-.1-.8-.2-1.3-.3l.5-2-1.6-.4-1.1 4.5c-.3 0-.6-.1-.9-.2L12 9.1l-.8 3c.3.1.6.2 1 .3.4.1.5.3.4.6l-1.3 5c0 .1-.1.1-.2.1-.3-.1-.5-.2-.9-.3l-1.2 2.8 2.2.6c.4.1.8.2 1.2.3l-.5 2.1 1.6.4.5-2c.4.1.8.2 1.3.3l-.5 2 1.6.4 1-4.2c1.8.3 3.1.2 3.6-1.5.4-1.3-.1-2-1-2.5.7-.2 1.2-.6 1.3-1.4zM18.8 19c-.3 1.4-2.5 1-3.2.8l.7-2.9c.7.2 2.8.6 2.5 2.1zm.4-4c-.3 1.2-2 1-2.6.8l.6-2.5c.6.1 2.3.4 2 1.7z" />
                </svg>
                <span class="text-[11px] font-bold text-white tracking-wide">Bitcoin</span>
             </div>
          </div>
          <div class="bg-[#1a1c23] rounded-lg py-1 px-2.5 flex items-center justify-between border border-white/5">
             <span id="dash_btc_price" class="text-[12px] font-bold text-white price-value tracking-tight" data-coin-id="bitcoin">$---</span>
             <div id="dash_btc_change" class="flex items-center gap-0.5 text-[10px] font-bold text-terminal-muted">
                <span>-%</span>
             </div>
          </div>
       </div>
    </div>
  `
  box6_1.classList.remove("items-center", "justify-center")

  if (window.__CoinGeckoEngine) {
    updateDash61Changes(window.__CoinGeckoEngine)
  }
}

function renderBox7Overview(
  dashboardData: MarketDashboardData | null,
  labels: DashboardLabels,
): void {
  const box7 = document.getElementById("dashBox7")
  if (!box7 || !dashboardData) return

  const { volume, trades, owners } = dashboardData

  box7.innerHTML = `
    <div class="absolute inset-0 w-full h-full pt-2.5 pb-2 px-4 flex flex-col group">
       <div class="flex justify-between items-start mb-2 relative z-10">
          <h3 class="text-[11px] font-sans font-bold text-white/80 tracking-wide flex items-center gap-1.5">
             <svg class="w-3 h-3 text-blue-400 opacity-80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
             ${labels.dashOverviewTitle}
          </h3>
          <span class="text-[10px] font-bold text-blue-500">${labels.dashOverviewFullTime}</span>
       </div>
       
       <div class="flex-1 flex flex-col justify-around relative z-10 py-1">
          <div class="flex items-center justify-between pb-1 border-b border-white/10">
             <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                   <span class="text-emerald-500 text-[9px]">🌸</span>
                </div>
                <span class="text-[10px] text-white/60 font-medium tracking-wide">${labels.dashOverviewTotalVol}</span>
             </div>
             <span class="text-[11.5px] font-bold text-white tracking-tight font-mono">${formatLarge(volume)}</span>
          </div>
          
          <div class="flex items-center justify-between pb-1 border-b border-white/10">
             <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-terminal-dark border border-white/5 flex items-center justify-center shrink-0">
                   <img src="/img/sunflowerland/123/exchange.png" class="w-3 h-3 object-contain drop-shadow-sm" onerror="this.style.display='none'" />
                </div>
                <span class="text-[10px] text-white/60 font-medium tracking-wide">${labels.dashOverviewTotalTrades}</span>
             </div>
             <span class="text-[11.5px] font-bold text-white tracking-tight font-mono">${formatLarge(trades)}</span>
          </div>
          
          <div class="flex items-center justify-between pb-0 border-b border-white/10">
             <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                   <svg class="w-2.5 h-2.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <span class="text-[10px] text-white/60 font-medium tracking-wide">${labels.dashOverviewHolders}</span>
             </div>
             <span class="text-[11.5px] font-bold text-white tracking-tight font-mono">${formatLarge(owners)}</span>
          </div>
       </div>
    </div>
  `
  box7.classList.remove("items-center", "justify-center")
}

function renderLegacyCarousels(
  marketData: DashboardMarketItem[],
  getItemImageSrc: MarketDashboardContext["getItemImageSrc"],
  formatNumber: MarketDashboardContext["formatNumber"],
  calculateChange: MarketDashboardContext["calculateChange"],
  labels: DashboardLabels,
): void {
  const topVolResource = marketData.find((item) => item.category === "resources")
  const topVolPowerUp = marketData.find((item) => item.category === "powerups")
  const topVolCosmetic = marketData.find((item) => item.category === "cosmetics")

  const renderDashItem = (item: DashboardMarketItem | undefined, subtitle: string): string => {
    if (!item) return ""
    const imgSrc = getItemImageSrc(item)
    const imgSize = item.category !== "resources" ? "w-[85%] h-[85%]" : "w-[60%] h-[60%]"
    const safeItemName = escapeAttr(item.name)
    return `
      <div class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" data-item="${safeItemName}" onclick="window.scrollToItem(this.dataset.item, event)" title="${safeItemName}">
        <div class="w-8 h-8 lg:w-9 lg:h-9 rounded bg-terminal-dark border border-terminal-muted/20 flex items-center justify-center p-1 shrink-0">
          <img src="${imgSrc}" class="${imgSize} object-contain drop-shadow-sm pixelated" onerror="this.style.display='none'" />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-white font-bold text-xs lg:text-sm leading-tight truncate">${item.name}</span>
          <span class="text-[10px] text-emerald-400 font-mono">${subtitle}</span>
        </div>
      </div>
    `
  }

  const dashVolEl = document.getElementById("dashTopVolume")
  if (dashVolEl) {
    dashVolEl.innerHTML = `
      <div class="flex flex-col h-full justify-center gap-1.5 lg:gap-2">
        ${renderDashItem(topVolResource, topVolResource ? formatNumber(topVolResource.volume || 0, 0) + labels.vol : "")}
        ${topVolPowerUp ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
        ${renderDashItem(topVolPowerUp, topVolPowerUp ? formatNumber(topVolPowerUp.volume || 0, 0) + labels.vol : "")}
        ${topVolCosmetic ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
        ${renderDashItem(topVolCosmetic, topVolCosmetic ? formatNumber(topVolCosmetic.volume || 0, 0) + labels.vol : "")}
      </div>
    `
  }

  const getTopGainer = (periodKey: GainerPeriodKey, categoryFilter: string) => {
    const sorted = [...marketData]
      .filter((i) => i.category === categoryFilter)
      .map((item) => {
        const change = calculateChange(item.currentPrice, item.history?.[periodKey])
        return { ...item, changeObj: change }
      })
      .sort((a, b) => b.changeObj.val - a.changeObj.val)
    return sorted[0]
  }

  const slidesData = [
    {
      title: labels.gainer24h,
      res: getTopGainer("1d", "resources"),
      pwup: getTopGainer("1d", "powerups"),
      cosm: getTopGainer("1d", "cosmetics"),
    },
    {
      title: labels.topGainers,
      res: getTopGainer("7d", "resources"),
      pwup: getTopGainer("7d", "powerups"),
      cosm: getTopGainer("7d", "cosmetics"),
    },
    {
      title: labels.gainer30d,
      res: getTopGainer("30d", "resources"),
      pwup: getTopGainer("30d", "powerups"),
      cosm: getTopGainer("30d", "cosmetics"),
    },
    {
      title: labels.gainer180d,
      res: getTopGainer("180d", "resources"),
      pwup: getTopGainer("180d", "powerups"),
      cosm: getTopGainer("180d", "cosmetics"),
    },
  ]

  let carouselHTML = ""
  slidesData.forEach((slide, idx) => {
    const isFirst = idx === 0
    carouselHTML += `
      <div class="gainer-slide slide-item absolute inset-0 p-4 lg:p-5 transition-opacity duration-500 flex flex-col justify-start ${isFirst ? "opacity-100 z-10" : "opacity-0 z-0"}">
        <h3 class="text-[10px] lg:text-xs font-mono text-terminal-muted uppercase tracking-wider mb-2 lg:mb-3 flex items-center gap-2">
          <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
          <span class="truncate">${slide.title}</span>
        </h3>
        <div class="h-auto flex-grow flex flex-col justify-center gap-1.5 lg:gap-2">
          ${renderDashItem(slide.res, slide.res ? `+${slide.res.changeObj.val.toFixed(2)}%` : "")}
          ${slide.pwup ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
          ${renderDashItem(slide.pwup, slide.pwup ? `+${slide.pwup.changeObj.val.toFixed(2)}%` : "")}
          ${slide.cosm ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
          ${renderDashItem(slide.cosm, slide.cosm ? `+${slide.cosm.changeObj.val.toFixed(2)}%` : "")}
        </div>
      </div>
    `
  })

  const carouselContainer = document.getElementById("dashTopGainerCarousel")
  if (carouselContainer) {
    carouselContainer.innerHTML = carouselHTML
  }

  const calculateRatio = (items: DashboardMarketItem[], type: "ath" | "atl"): RankedRatioItem[] => {
    return items
      .map((item) => {
        const history180d = item.history?.sparkline180d
          ? item.history.sparkline180d.filter((v): v is number => v !== null && v !== undefined)
          : []
        if (type === "ath") {
          const ath = Math.max(...history180d, item.currentPrice)
          const ratio = ath > 0 ? (item.currentPrice / ath) * 100 : 0
          return { ...item, ratio, refPrice: ath }
        }
        const atl = Math.min(...history180d, item.currentPrice)
        const ratio = item.currentPrice > 0 ? (atl / item.currentPrice) * 100 : 0
        return { ...item, ratio, refPrice: atl }
      })
      .sort((a, b) => b.ratio - a.ratio)
  }

  const allAth = calculateRatio(marketData, "ath")
  const allAtl = calculateRatio(marketData, "atl")

  const extremesSlides = [
    {
      title: labels.nearAth,
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
      colorClass: "text-emerald-500",
      borderClass: "border-emerald-500/30",
      shadowClass: "shadow-[0_0_10px_rgba(16,185,129,0.15)]",
      res: allAth.filter((i) => i.category === "resources").slice(0, 4),
      pwup: allAth.filter((i) => i.category === "powerups").slice(0, 4),
      cosm: allAth.filter((i) => i.category === "cosmetics").slice(0, 4),
      tooltipSuffix: labels.tooltipAth,
    },
    {
      title: labels.nearAtl,
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>',
      colorClass: "text-red-500",
      borderClass: "border-red-500/30",
      shadowClass: "shadow-[0_0_10px_rgba(239,68,68,0.15)]",
      res: allAtl.filter((i) => i.category === "resources").slice(0, 4),
      pwup: allAtl.filter((i) => i.category === "powerups").slice(0, 4),
      cosm: allAtl.filter((i) => i.category === "cosmetics").slice(0, 4),
      tooltipSuffix: labels.tooltipAtl,
    },
  ]

  let extremesHTML = ""
  extremesSlides.forEach((slide, idx) => {
    const isFirst = idx === 0

    const renderMiniIcons = (items: RankedRatioItem[], isNotRes: boolean): string => {
      return items
        .map((item) => {
          const imgSrc = getItemImageSrc(item)
          const safeItemName = escapeAttr(item.name)
          return `
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded bg-terminal-dark border ${slide.borderClass} flex items-center justify-center p-1 relative group cursor-pointer hover:scale-110 transition-transform ${slide.shadowClass} shrink-0" data-item="${safeItemName}" onclick="window.scrollToItem(this.dataset.item, event)">
          <img src="${imgSrc}" class="${isNotRes ? "w-[85%] h-[85%]" : "w-[60%] h-[60%]"} object-contain drop-shadow-sm pixelated" onerror="this.style.display='none'" />
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-[9px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-white/20">
            ${item.name} (${item.ratio.toFixed(1)}% ${slide.tooltipSuffix})
          </div>
        </div>
      `
        })
        .join("")
    }

    extremesHTML += `
      <div class="extremes-slide slide-item absolute inset-0 p-4 lg:p-5 transition-opacity duration-500 flex flex-col justify-start ${isFirst ? "opacity-100 z-10" : "opacity-0 z-0"}">
        <h3 class="text-[10px] lg:text-xs font-mono text-terminal-muted uppercase tracking-wider mb-2 lg:mb-3 flex items-center gap-2">
          <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4 ${slide.colorClass} shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">${slide.icon}</svg>
          <span class="truncate">${slide.title}</span>
        </h3>
        <div class="h-auto flex-grow flex flex-col justify-center gap-1.5">
          <div class="flex gap-1.5 sm:gap-2 items-center w-full">
            ${renderMiniIcons(slide.res, false)}
          </div>
          ${slide.pwup.length > 0 ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
          <div class="flex gap-1.5 sm:gap-2 items-center w-full">
            ${renderMiniIcons(slide.pwup, true)}
          </div>
          ${slide.cosm.length > 0 ? '<div class="w-full border-t border-white/5 my-0.5"></div>' : ""}
          <div class="flex gap-1.5 sm:gap-2 items-center w-full">
            ${renderMiniIcons(slide.cosm, true)}
          </div>
        </div>
      </div>
    `
  })

  const extremesContainer = document.getElementById("dashAthAtlCarousel")
  if (extremesContainer) {
    extremesContainer.innerHTML = extremesHTML
  }

  const setupCarousel = (
    containerId: string,
    circleId: string,
    durationSec: number,
    abortKey: CarouselAbortKey,
  ) => {
    const container = document.getElementById(containerId)
    let circle = document.getElementById(circleId) as SVGElement | null
    if (!container || !circle) return

    const wrapper = container.parentElement
    if (!wrapper) return
    const slides = container.querySelectorAll(".slide-item")
    if (slides.length <= 1) return

    if (window[abortKey]) window[abortKey].abort()
    window[abortKey] = new AbortController()
    const signal = window[abortKey].signal

    let currentIdx = 0

    const nextSlide = () => {
      slides[currentIdx].classList.remove("opacity-100", "z-10")
      slides[currentIdx].classList.add("opacity-0", "z-0")

      currentIdx = (currentIdx + 1) % slides.length

      slides[currentIdx].classList.remove("opacity-0", "z-0")
      slides[currentIdx].classList.add("opacity-100", "z-10")

      if (circle) {
        const newCircle = circle.cloneNode(true) as SVGElement
        circle.parentNode?.replaceChild(newCircle, circle)
        circle = newCircle

        if (circleId === "extremesProgress") {
          if (currentIdx === 0) {
            circle.classList.remove("text-red-500")
            circle.classList.add("text-emerald-500")
          } else {
            circle.classList.remove("text-emerald-500")
            circle.classList.add("text-red-500")
          }
        }

        circle.style.animation = `fillCircle ${durationSec}s linear forwards`
        circle.addEventListener("animationend", nextSlide, { signal })
      }
    }

    wrapper.addEventListener("click", nextSlide, { signal })

    circle.style.animation = `fillCircle ${durationSec}s linear forwards`
    circle.addEventListener("animationend", nextSlide, { signal })
  }

  if (window.__gainerInterval) clearInterval(window.__gainerInterval)
  if (window.__extremesInterval) clearInterval(window.__extremesInterval)

  setupCarousel("dashTopGainerCarousel", "gainerProgress", 5, "__gainerAborter")
  setupCarousel("dashAthAtlCarousel", "extremesProgress", 15, "__extremesAborter")
}

export function updateDash61Changes(dataMap: CoinGeckoDataMap): void {
  const fmt = (n: number): string =>
    n >= 100
      ? n.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : n < 0.01
        ? "$" + n.toPrecision(4)
        : n.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })

  const renderChange = (id: string, elId: string, priceElId: string) => {
    const entry = dataMap[id]
    if (!entry) return

    const priceEl = document.getElementById(priceElId)
    if (priceEl && entry.usd !== undefined) {
      priceEl.textContent = fmt(entry.usd)
    }

    const el = document.getElementById(elId)
    if (!el || entry.change24h === undefined) return
    const change = entry.change24h
    const isPos = change >= 0
    const color = isPos ? "text-emerald-500" : "text-red-500"
    const icon = isPos
      ? `<svg class="w-2.5 h-2.5 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>`
      : `<svg class="w-2.5 h-2.5 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>`
    el.innerHTML = `${icon}<span class="${color} tracking-tight font-bold text-[10px]">${Math.abs(change).toFixed(2)}%</span>`
  }

  renderChange("flower-2", "dash_flower_change", "dash_flower_price")
  renderChange("bitcoin", "dash_btc_change", "dash_btc_price")
}

export function initSflMarketDashboard(ctx: MarketDashboardContext): void {
  activeDashboardCtx = ctx
  window.updateDash61Changes = updateDash61Changes
}

export function renderSflDashboard(): void {
  if (!activeDashboardCtx) return

  const {
    getMarketData,
    getDashboardData,
    getItemImageSrc,
    formatNumber,
    createSparklineSVG,
    calculateChange,
    labels,
  } = activeDashboardCtx

  const marketData = getMarketData()
  const dashboardData = getDashboardData()
  const sflUsdPrice = window.sflUsdPrice || 0

  renderBox1MarketCap(marketData, sflUsdPrice, createSparklineSVG, labels)
  renderBox5CategoryDistribution(marketData, sflUsdPrice, formatNumber, labels)
  renderBox2SeasonAndConverter(labels)
  renderBox3TopMovers(marketData, getItemImageSrc, labels)
  renderBox4Whales(dashboardData, marketData, sflUsdPrice, getItemImageSrc, formatNumber, labels)
  renderBox6FearAndGreed(marketData, dashboardData, sflUsdPrice, labels)
  renderBox61CryptoPrices()
  renderBox7Overview(dashboardData, labels)
  renderLegacyCarousels(marketData, getItemImageSrc, formatNumber, calculateChange, labels)
}
