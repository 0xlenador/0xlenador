// ============================================================
// src/lib/sfl/animalsClient.ts
// Controlador cliente reactivo para /sfl-animales/ y /en/sfl-animals/.
// Responsabilidad única: conectar el DOM modular con el motor SSOT
// SflAnimals (animals.ts), SflUserState (state.ts) y SflMarket (market.ts).
// ============================================================

import {
  ORDERED_ANIMAL_IDS,
  ANIMAL_CONSUMABLES,
  BEETLES_LIST,
  calculateAnimalProgression,
  getTreatUnitPrices,
  type AnimalId,
  type AnimalProgressionResult,
} from "./animals"
import { SflUserState, type AnimalTreatType, type AnimalUserConfig } from "./state"
import * as SflMarket from "./market"

interface AnimalsBootPayload {
  marketPrices: Record<string, number>
  flowerUsd: number
  bettyRatio: number
  tabLabels: Record<AnimalId, string>
  labels: {
    resLabel: string
    affecLabel: string
    foodLabel: string
    surplusLabel: string
    totalProfitLabel: string
    levelPrefix: string
    dropdownFoodLabel: string
    levelLabel: string
    selectLabel: string
    optimalLabel: string
    honeyTreatPickLevel: string
    honeyTreatNoLvl1: string
    honeyShort: string
    treatHoneyLabel: string
    treatSaltLabel: string
    treatTruffleLabel: string
    treatSaltShort: string
    treatTruffleShort: string
    noBoostsActive: string
    roiLabel: string
    feedsUnit: string
    honeyTreatBtn: string
  }
}

const ALL_MARKET_NAMES_EXTRA = [
  "Egg",
  "Feather",
  "Wool",
  "Merino Wool",
  "Milk",
  "Leather",
  "Truffle",
  "Corn",
  "Wheat",
  "Barley",
  "Kale",
  "Salt",
  "Honey",
  "Gem",
  "Wild Mushroom",
  "Magic Mushroom",
  "Stone",
  "Wood",
  "Iron",
  "Green Beetle",
  "Blue Beetle",
  "Pink Beetle",
  "Amber Beetle",
]

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatFoodUnitsPrefix(units: number, isFree: boolean): string {
  if (isFree || units === 0) return "0x "
  if (units === 1) return ""
  return `${units}x `
}

function formatSignedFlower(val: number): string {
  return `${val >= 0 ? "+" : ""}${val.toFixed(4)} FL`
}

function formatSignedUsd(val: number): string {
  return `${val >= 0 ? "+" : "-"}$${Math.abs(val).toFixed(4)} USD`
}

export function initAnimalsView(): void {
  const dataScript = document.getElementById("sflAnimalsBootData")
  if (!dataScript) return
  if ((dataScript as any).__animalsBooted) return
  ;(dataScript as any).__animalsBooted = true

  let boot: AnimalsBootPayload
  try {
    boot = JSON.parse(dataScript.textContent || "{}")
  } catch (err) {
    console.error("[SflAnimals] Failed to parse boot payload:", err)
    return
  }

  // Cargar preferencias locales de SflUserState
  const loadConfig = (): AnimalUserConfig => {
    const prefs = SflUserState.getPreferences()
    return {
      activeSpecies: prefs.animalConfig?.activeSpecies || "chicken",
      targetLevels: { ...(prefs.animalConfig?.targetLevels || {}) },
      selectedFoods: JSON.parse(JSON.stringify(prefs.animalConfig?.selectedFoods || {})),
      treatMode: JSON.parse(JSON.stringify(prefs.animalConfig?.treatMode || {})),
      mudPigEnabled: Boolean(prefs.animalConfig?.mudPigEnabled),
      manualBoosts: JSON.parse(JSON.stringify(prefs.animalConfig?.manualBoosts || {})),
    }
  }

  let animalConfig = loadConfig()
  const treatPickerActive: Record<string, boolean> = {}
  const progressionsCache: Partial<Record<AnimalId, AnimalProgressionResult>> = {}

  const saveConfig = () => {
    SflUserState.setPreferences({ animalConfig })
  }

  // Construcción de diccionario de precios vivo mezclando snapshot SSR + SflMarket KV
  const knownMarketKeys = new Set<string>([
    ...Object.keys(boot.marketPrices || {}),
    ...ALL_MARKET_NAMES_EXTRA,
  ])
  Object.values(ANIMAL_CONSUMABLES).forEach((c) => {
    c.options?.forEach((o) => knownMarketKeys.add(o.name))
    c.craftingIngredients?.forEach((i) => knownMarketKeys.add(i.name))
  })
  BEETLES_LIST.forEach((b) => knownMarketKeys.add(b.name))

  const getLiveMarketSnapshot = () => {
    const merged: Record<string, number> = { ...(boot.marketPrices || {}) }
    const hasRaw = Boolean(SflMarket.getRawData?.())
    if (hasRaw) {
      knownMarketKeys.forEach((name) => {
        const p = SflMarket.getItemPrice?.(name)
        if (typeof p === "number" && p > 0) {
          merged[name] = p
        }
      })
    }
    const flowerUsd =
      hasRaw && SflMarket.getFlowerPrice?.() > 0 ? SflMarket.getFlowerPrice() : boot.flowerUsd
    const bettyRatio =
      hasRaw && SflMarket.getBettyRatio?.() > 0 ? SflMarket.getBettyRatio() : boot.bettyRatio
    return { marketPrices: merged, flowerUsd, bettyRatio }
  }

  // Estado del dropdown flotante de alimentos (consultado fresco para soportar View Transitions)
  const getDropdown = () => document.getElementById("sflFoodDropdown")
  let activeTrigger: HTMLElement | null = null

  const closeDropdown = () => {
    const dropdown = getDropdown()
    if (dropdown) {
      dropdown.classList.add("hidden")
      dropdown.innerHTML = ""
    }
    activeTrigger = null
  }

  // Buscador rápido
  const applyAnimalSearch = () => {
    const searchInput = document.getElementById("animalSearchInput") as HTMLInputElement | null
    const query = (searchInput?.value || "").toLowerCase().trim()
    const activePanel = document.querySelector<HTMLElement>(".animal-panel:not(.hidden)")
    if (!activePanel) return

    const rows = activePanel.querySelectorAll<HTMLElement>(".animal-level-row")
    let visibleCount = 0
    rows.forEach((row) => {
      const lvl = row.getAttribute("data-level") || ""
      const searchAttr = (row.getAttribute("data-search") || "").toLowerCase()
      const text = (row.textContent || "").toLowerCase()
      if (!query || lvl.includes(query) || searchAttr.includes(query) || text.includes(query)) {
        row.style.display = ""
        visibleCount++
      } else {
        row.style.display = "none"
      }
    })

    const emptyState = activePanel.querySelector<HTMLElement>(".animal-empty-state")
    if (emptyState) {
      emptyState.classList.toggle("hidden", visibleCount > 0)
    }
  }

  const switchActiveTab = (animalId: AnimalId, persist = true) => {
    if (!ORDERED_ANIMAL_IDS.includes(animalId)) return
    animalConfig.activeSpecies = animalId

    document.querySelectorAll<HTMLElement>(".animal-tab-btn").forEach((b) => {
      const isMatch = b.dataset.animalId === animalId
      b.classList.toggle("active", isMatch)
      b.classList.toggle("bg-emerald-500/20", isMatch)
      b.classList.toggle("text-emerald-400", isMatch)
      b.classList.toggle("border-emerald-500/40", isMatch)
      b.classList.toggle("bg-white/5", !isMatch)
      b.classList.toggle("text-white/50", !isMatch)
      b.classList.toggle("border-white/10", !isMatch)
    })

    document.querySelectorAll<HTMLElement>(".animal-panel").forEach((p) => {
      p.classList.toggle("hidden", p.dataset.animalId !== animalId)
    })

    document.querySelectorAll<HTMLElement>(".dash-species-card").forEach((card) => {
      const isMatch = card.dataset.animalId === animalId
      card.classList.toggle("bg-emerald-500/10", isMatch)
      card.classList.toggle("border-emerald-500/40", isMatch)
      card.classList.toggle("bg-black/30", !isMatch)
      card.classList.toggle("border-white/5", !isMatch)
    })

    if (persist) saveConfig()
    applyAnimalSearch()
    renderDashboard()
  }

  // Renderizado del Hero Dashboard en vivo
  const renderDashboard = () => {
    const snap = getLiveMarketSnapshot()
    const userState = SflUserState.getState()
    const allProgs = ORDERED_ANIMAL_IDS.map((id) => progressionsCache[id]).filter(
      Boolean,
    ) as AnimalProgressionResult[]
    if (!allProgs.length) return

    const best = [...allProgs].sort(
      (a, b) => b.totals.totalProfitFlower - a.totals.totalProfitFlower,
    )[0]
    const activeId = (animalConfig.activeSpecies as AnimalId) || "chicken"
    const active = progressionsCache[activeId] || allProgs[0]

    const bestImg = document.getElementById("dashBestAnimalImg") as HTMLImageElement | null
    const bestName = document.getElementById("dashBestAnimalName")
    const bestTarget = document.getElementById("dashBestAnimalTarget")
    const bestRoi = document.getElementById("dashBestAnimalRoi")
    const bestProfitFl = document.getElementById("dashBestProfitFlower")
    const bestProfitUsd = document.getElementById("dashBestProfitUsd")

    if (bestImg) {
      bestImg.src = best.icon
      bestImg.alt = best.name
    }
    if (bestName) bestName.textContent = boot.tabLabels[best.animalId] || best.name
    if (bestTarget) bestTarget.textContent = `1 → ${best.targetLevel}`
    if (bestRoi) bestRoi.textContent = `${boot.labels.roiLabel}: ${best.totals.roiPercent}%`
    if (bestProfitFl) {
      bestProfitFl.textContent = formatSignedFlower(best.totals.totalProfitFlower)
      bestProfitFl.classList.toggle("text-emerald-400", best.totals.totalProfitFlower >= 0)
      bestProfitFl.classList.toggle("text-rose-400", best.totals.totalProfitFlower < 0)
    }
    if (bestProfitUsd) bestProfitUsd.textContent = formatSignedUsd(best.totals.totalProfitUsd)

    const boostsCountEl = document.getElementById("dashActiveBoostsCount")
    if (boostsCountEl) {
      const count = active.modifiers.activeBoosts.length
      boostsCountEl.textContent = count > 0 ? String(count) : boot.labels.noBoostsActive
    }

    allProgs.forEach((prog) => {
      const card = document.querySelector<HTMLElement>(
        `.dash-species-card[data-animal-id="${prog.animalId}"]`,
      )
      if (!card) return
      const tEl = card.querySelector(".dash-card-target")
      const pEl = card.querySelector(".dash-card-profit")
      const mEl = card.querySelector(".dash-card-meta")
      if (tEl) tEl.textContent = `→${prog.targetLevel}`
      if (pEl) {
        pEl.textContent = formatSignedFlower(prog.totals.totalProfitFlower)
        pEl.classList.toggle("text-emerald-400", prog.totals.totalProfitFlower >= 0)
        pEl.classList.toggle("text-rose-400", prog.totals.totalProfitFlower < 0)
      }
      if (mEl) {
        mEl.textContent = `${prog.effectiveSleepHours}h · ${prog.totals.totalFeeds} ${boot.labels.feedsUnit}`
      }
    })

    const bettyEl = document.getElementById("dashBettyRatioVal")
    const flowerEl = document.getElementById("dashFlowerPriceVal")
    const treatEl = document.getElementById("dashTreatPricesVal")
    if (bettyEl) bettyEl.textContent = `1 : ${Math.round(snap.bettyRatio)}`
    if (flowerEl) flowerEl.textContent = `$${snap.flowerUsd.toFixed(4)} USD`
    if (treatEl) {
      const tp = getTreatUnitPrices(snap.marketPrices, snap.flowerUsd, snap.bettyRatio, userState)
      treatEl.textContent = `${tp.honeyTreatFlower.toFixed(4)} / ${tp.saltLickFlower.toFixed(4)} / ${tp.truffleSeasoningFlower.toFixed(4)} FL`
    }

    const activeBadge = document.getElementById("dashActiveBadge")
    const activeProfitFl = document.getElementById("dashActiveProfitFlower")
    const activeProfitUsd = document.getElementById("dashActiveProfitUsd")
    const activeCostFl = document.getElementById("dashActiveCostFlower")
    const activeCostUsd = document.getElementById("dashActiveCostUsd")
    const activeRevFl = document.getElementById("dashActiveRevenueFlower")
    const activeTimeFeeds = document.getElementById("dashActiveTimeFeeds")

    if (activeBadge) {
      activeBadge.textContent = `${boot.tabLabels[active.animalId] || active.name} · 1 → ${active.targetLevel}`
    }
    if (activeProfitFl) {
      activeProfitFl.textContent = formatSignedFlower(active.totals.totalProfitFlower)
      activeProfitFl.classList.toggle("text-emerald-400", active.totals.totalProfitFlower >= 0)
      activeProfitFl.classList.toggle("text-rose-400", active.totals.totalProfitFlower < 0)
    }
    if (activeProfitUsd) activeProfitUsd.textContent = formatSignedUsd(active.totals.totalProfitUsd)
    if (activeCostFl) activeCostFl.textContent = `${active.totals.totalCostFlower.toFixed(4)} FL`
    if (activeCostUsd) activeCostUsd.textContent = `$${active.totals.totalCostUsd.toFixed(4)} USD`
    if (activeRevFl) activeRevFl.textContent = `+${active.totals.totalRevenueFlower.toFixed(4)} FL`
    if (activeTimeFeeds) {
      activeTimeFeeds.textContent = `${active.totals.totalHours}h · ${active.totals.totalFeeds} ${boot.labels.feedsUnit}`
    }
  }

  const updateTreatControlsUI = (prog: AnimalProgressionResult) => {
    const animalId = prog.animalId
    const treatType = prog.treatType
    const isPicking = Boolean(treatPickerActive[animalId])
    const startLvl = prog.treatStartLevel

    // Switch buttons (Honey / Salt Lick / Truffle)
    document
      .querySelectorAll<HTMLElement>(`.treat-type-btn[data-animal="${animalId}"]`)
      .forEach((btn) => {
        const isCurrent = btn.dataset.treatType === treatType
        btn.classList.toggle("active", isCurrent)
        btn.classList.remove(
          "bg-amber-500/20",
          "text-amber-300",
          "bg-cyan-500/20",
          "text-cyan-300",
          "bg-purple-500/20",
          "text-purple-300",
          "text-white/40",
        )
        if (isCurrent) {
          if (treatType === "honey_treat") btn.classList.add("bg-amber-500/20", "text-amber-300")
          else if (treatType === "salt_lick") btn.classList.add("bg-cyan-500/20", "text-cyan-300")
          else btn.classList.add("bg-purple-500/20", "text-purple-300")
        } else {
          btn.classList.add("text-white/40")
        }
      })

    const btn = document.querySelector<HTMLElement>(
      `.honey-treat-toggle-btn[data-animal="${animalId}"]`,
    )
    if (btn) {
      const iconEl = btn.querySelector<HTMLImageElement>(".treat-active-icon")
      const nameEl = btn.querySelector<HTMLElement>(".treat-active-name")
      const indicatorEl = btn.querySelector<HTMLElement>(".honey-treat-indicator")
      const badgeEl = btn.querySelector<HTMLElement>(".honey-treat-badge")

      const meta =
        treatType === "salt_lick"
          ? {
              img: "/img/sunflowerland/animals/salt_lick.webp",
              name: boot.labels.treatSaltLabel,
              short: boot.labels.treatSaltShort,
              colorText: "text-cyan-400",
              borderActive: "border-cyan-400",
              bgActive: "bg-cyan-500/15",
              dotBg: "bg-cyan-400",
            }
          : treatType === "truffle_seasoning"
            ? {
                img: "/img/sunflowerland/animals/truffle_seasoning.webp",
                name: boot.labels.treatTruffleLabel,
                short: boot.labels.treatTruffleShort,
                colorText: "text-purple-400",
                borderActive: "border-purple-400",
                bgActive: "bg-purple-500/15",
                dotBg: "bg-purple-400",
              }
            : {
                img: "/img/sunflowerland/animals/honey_treat.webp",
                name: boot.labels.treatHoneyLabel,
                short: boot.labels.honeyShort,
                colorText: "text-amber-400",
                borderActive: "border-amber-400",
                bgActive: "bg-amber-500/15",
                dotBg: "bg-amber-400",
              }

      if (iconEl) iconEl.src = meta.img
      if (nameEl) {
        nameEl.textContent = meta.name
        nameEl.className = `treat-active-name text-[10px] font-mono font-bold ${meta.colorText}`
      }

      btn.classList.remove(
        "bg-amber-500/20",
        "bg-amber-500/15",
        "bg-cyan-500/15",
        "bg-purple-500/15",
        "border-amber-400",
        "border-cyan-400",
        "border-purple-400",
        "ring-2",
        "ring-amber-400/50",
        "shadow-[0_0_10px_rgba(251,191,36,0.4)]",
      )
      btn.classList.add("bg-terminal-bg")

      if (isPicking) {
        btn.classList.add(
          meta.bgActive,
          meta.borderActive,
          "ring-2",
          "ring-amber-400/50",
          "shadow-[0_0_10px_rgba(251,191,36,0.4)]",
        )
        btn.classList.remove("bg-terminal-bg")
        if (badgeEl)
          badgeEl.className = `honey-treat-badge ml-0.5 w-2 h-2 rounded-full ${meta.dotBg} animate-ping`
        if (indicatorEl) {
          indicatorEl.textContent = boot.labels.honeyTreatPickLevel
          indicatorEl.className = `honey-treat-indicator text-[9px] font-mono font-bold ${meta.colorText} hidden sm:inline`
        }
      } else if (startLvl !== null) {
        const endLvl = Math.min(15, startLvl + prog.treatDurationCycles - 1)
        const rangeLabel = endLvl > startLvl ? `${startLvl}-${endLvl}` : `${startLvl}`
        btn.classList.add(meta.bgActive, meta.borderActive)
        btn.classList.remove("bg-terminal-bg")
        if (badgeEl)
          badgeEl.className = `honey-treat-badge ml-0.5 w-2 h-2 rounded-full ${meta.dotBg}`
        if (indicatorEl) {
          indicatorEl.textContent = `${boot.labels.levelPrefix} ${rangeLabel} ${meta.short}`
          indicatorEl.className = `honey-treat-indicator text-[9px] font-mono ${meta.colorText} hidden sm:inline`
        }
      } else {
        if (badgeEl)
          badgeEl.className = "honey-treat-badge ml-0.5 w-1.5 h-1.5 rounded-full bg-white/25"
        if (indicatorEl) {
          indicatorEl.textContent = meta.short
          indicatorEl.className =
            "honey-treat-indicator text-[9px] font-mono text-white/50 hidden sm:inline"
        }
      }
    }

    // Timeline Dots 1..15
    document
      .querySelectorAll<HTMLElement>(`.target-level-dot[data-animal="${animalId}"]`)
      .forEach((dot) => {
        const dLvl = Number(dot.dataset.targetLevel)
        const defaultTitle = dot.dataset.defaultTitle || ""
        const isBlockedHoneyLvl1 =
          isPicking &&
          treatType === "honey_treat" &&
          (dLvl === 1 || prog.modifiers.effective.isFreeFeed)
        const isTarget = dLvl === prog.targetLevel
        const isBeforeTarget = dLvl < prog.targetLevel
        const isCovered =
          startLvl !== null &&
          dLvl >= startLvl &&
          dLvl < startLvl + prog.treatDurationCycles &&
          !(treatType === "honey_treat" && (dLvl === 1 || prog.modifiers.effective.isFreeFeed))

        if (isBlockedHoneyLvl1) {
          dot.title = boot.labels.honeyTreatNoLvl1
          dot.setAttribute("aria-disabled", "true")
          dot.className = isTarget
            ? "target-level-dot relative z-20 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center font-mono text-[10px] font-black select-none cursor-not-allowed opacity-35 transition-all duration-150 focus:outline-none bg-emerald-400 text-black border-2 border-emerald-200"
            : "target-level-dot relative z-10 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-semibold select-none cursor-not-allowed opacity-35 transition-all duration-150 focus:outline-none bg-terminal-bg text-white/30 border border-white/10"
          return
        }

        if (defaultTitle) dot.title = defaultTitle
        dot.removeAttribute("aria-disabled")

        if (isCovered) {
          const grad =
            treatType === "salt_lick"
              ? "from-cyan-300 via-cyan-400 to-cyan-500 border-cyan-100 ring-cyan-400/80 shadow-[0_0_14px_rgba(34,211,238,0.85)]"
              : treatType === "truffle_seasoning"
                ? "from-purple-300 via-purple-400 to-purple-500 border-purple-100 ring-purple-400/80 shadow-[0_0_14px_rgba(192,132,252,0.85)]"
                : "from-amber-300 via-amber-400 to-amber-500 border-amber-100 ring-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.85)]"

          dot.className = isTarget
            ? `target-level-dot relative z-20 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center font-mono text-[10px] font-black select-none cursor-pointer transition-all duration-150 focus:outline-none bg-gradient-to-b text-black border-2 ring-2 scale-115 ${grad}`
            : `target-level-dot relative z-10 w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-black select-none cursor-pointer transition-all duration-150 focus:outline-none bg-gradient-to-b text-black border-2 ring-2 scale-105 ${grad}`
        } else if (isTarget) {
          dot.className =
            "target-level-dot relative z-20 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center font-mono text-[10px] font-black select-none cursor-pointer transition-all duration-150 focus:outline-none bg-emerald-400 text-black border-2 border-emerald-200 ring-2 ring-emerald-400/40 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.65)]"
        } else if (isBeforeTarget) {
          dot.className =
            "target-level-dot relative z-10 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-semibold select-none cursor-pointer transition-all duration-150 focus:outline-none bg-terminal-surface text-emerald-400/90 border border-emerald-500/40 hover:border-emerald-400 hover:scale-110 hover:text-emerald-300"
        } else {
          dot.className =
            "target-level-dot relative z-10 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-medium select-none cursor-pointer transition-all duration-150 focus:outline-none bg-terminal-bg text-white/20 border border-white/[0.06] hover:bg-white/10 hover:text-white/60 hover:border-white/20"
        }
      })
  }

  // Renderizado completo de una especie en tarjeta + tabla
  const recalculateAnimal = (animalId: AnimalId) => {
    const snap = getLiveMarketSnapshot()
    const userState = SflUserState.getState()
    const selectedFoodsRaw = animalConfig.selectedFoods?.[animalId] || {}
    const selectedFoods: Record<number, string> = {}
    Object.entries(selectedFoodsRaw).forEach(([k, v]) => {
      selectedFoods[Number(k)] = v
    })
    const treat = animalConfig.treatMode?.[animalId]
    const prog = calculateAnimalProgression(animalId, {
      marketPrices: snap.marketPrices,
      flowerPriceUsd: snap.flowerUsd,
      coinsPerFlower: snap.bettyRatio,
      userState,
      targetLevel: animalConfig.targetLevels?.[animalId] || 15,
      selectedFoods,
      treatType: treat?.type || "honey_treat",
      treatStartLevel: treat?.startLevel ?? null,
      mudPigEnabled: animalId === "pig" ? Boolean(animalConfig.mudPigEnabled) : false,
      manualBoosts: animalConfig.manualBoosts?.[animalId] || null,
    })

    progressionsCache[animalId] = prog

    // 1. Header Card stats + manual inputs + reset buttons
    const sleepHeader = document.querySelector<HTMLElement>(
      `.animal-sleep-hours-val[data-animal="${animalId}"]`,
    )
    if (sleepHeader) sleepHeader.textContent = `${prog.effectiveSleepHours}h`

    const freeBadge = document.querySelector<HTMLElement>(
      `.animal-free-feed-badge[data-animal="${animalId}"]`,
    )
    if (freeBadge) freeBadge.classList.toggle("hidden", !prog.modifiers.effective.isFreeFeed)

    if (animalId === "pig") {
      const mudBtn = document.querySelector<HTMLElement>(`.mud-toggle-btn[data-animal="pig"]`)
      if (mudBtn) {
        const active = prog.mudEnabled
        mudBtn.classList.toggle("bg-amber-700/35", active)
        mudBtn.classList.toggle("border-amber-400", active)
        mudBtn.classList.toggle("text-amber-200", active)
        mudBtn.classList.toggle("bg-black/40", !active)
        mudBtn.classList.toggle("border-amber-700/40", !active)
      }
    }

    // Sincronizar inputs numéricos (respetando overrides y foco actual)
    const fieldValues: Record<string, { val: number; isOverride: boolean }> = {
      food: {
        val: prog.modifiers.effective.foodMultiplier,
        isOverride: prog.modifiers.hasOverrides.food,
      },
      foodXp: {
        val: prog.modifiers.effective.foodXpMultiplier,
        isOverride: prog.modifiers.hasOverrides.foodXp,
      },
      careMultiplier: {
        val: prog.modifiers.effective.affectionMultiplier,
        isOverride: prog.modifiers.hasOverrides.careMultiplier,
      },
      primaryDrop: {
        val: prog.modifiers.effective.primaryFlatBonus,
        isOverride: prog.modifiers.hasOverrides.primaryDrop,
      },
      secondaryDrop: {
        val: prog.modifiers.effective.secondaryFlatBonus,
        isOverride: prog.modifiers.hasOverrides.secondaryDrop,
      },
    }

    Object.entries(fieldValues).forEach(([type, meta]) => {
      const input = document.querySelector<HTMLInputElement>(
        `.animal-boost-input[data-animal="${animalId}"][data-boost-type="${type}"]`,
      )
      if (input && document.activeElement !== input) {
        input.value = String(meta.val)
      }
      const box = input?.closest(".animal-boost-box")
      if (box) {
        box.classList.toggle("border-amber-400/70", meta.isOverride)
        box.classList.toggle("border-white/10", !meta.isOverride)
      }
      const resetBtn = document.querySelector<HTMLElement>(
        `.animal-boost-reset-btn[data-animal="${animalId}"][data-boost-type="${type}"]`,
      )
      if (resetBtn) {
        resetBtn.classList.toggle("hidden", !meta.isOverride)
      }
    })

    // Actualizar tooltips de careTools
    const sampleCareLvl = prog.levels.find((l) => l.affectionTools.length > 0)
    if (sampleCareLvl) {
      document
        .querySelectorAll<HTMLImageElement>(`.care-tool-icon[data-animal="${animalId}"]`)
        .forEach((icon) => {
          const toolId = icon.dataset.toolId
          const toolName = icon.dataset.toolName || ""
          const matched = sampleCareLvl.affectionTools.find((t) => t.id === toolId)
          if (matched) icon.title = `${matched.name} (+${matched.xp} XP)`
          else if (toolName) icon.title = toolName
        })
    }

    // 2. Actualizar filas 1..15 de la tabla
    prog.levels.forEach((lvl) => {
      const rows = document.querySelectorAll<HTMLElement>(
        `.animal-level-row[data-animal="${animalId}"][data-level="${lvl.toLevel}"]`,
      )
      rows.forEach((row) => {
        row.classList.toggle("opacity-35", lvl.toLevel > prog.targetLevel)

        const sleepEl = row.querySelector(".row-sleep-hours")
        if (sleepEl) sleepEl.textContent = `${lvl.sleepHours}h`

        row.querySelectorAll(".row-affection-xp").forEach((el) => {
          el.textContent = `+${lvl.affectionXp} XP`
        })
        row
          .querySelectorAll<HTMLImageElement>(".row-affection-tools-wrap img")
          .forEach((img, idx) => {
            const tData = lvl.affectionTools[idx]
            if (tData) img.title = `${tData.name} (${tData.percent}% · +${tData.xp} XP)`
          })

        row.querySelectorAll<HTMLImageElement>(".row-food-img").forEach((img) => {
          img.src = lvl.food.image
          img.alt = lvl.food.name
        })

        row.querySelectorAll<HTMLElement>(".row-food-overlay-wrap").forEach((wrap) => {
          if (lvl.food.ingredientImage) {
            wrap.innerHTML = `<img src="${escapeHtml(lvl.food.ingredientImage)}" alt="${escapeHtml(
              lvl.food.ingredientName || "",
            )}" title="${escapeHtml(
              lvl.food.ingredient,
            )}" class="absolute -bottom-1 -right-1 w-3 h-3 object-contain drop-shadow z-10" loading="lazy" />`
            wrap.classList.remove("hidden")
          } else {
            wrap.innerHTML = ""
            wrap.classList.add("hidden")
          }
        })

        const unitsPrefix = formatFoodUnitsPrefix(lvl.food.units, lvl.food.isFree)
        row.querySelectorAll<HTMLElement>(".row-food-name").forEach((el) => {
          el.textContent = `${unitsPrefix}${lvl.food.name}`
          el.title = lvl.food.ingredient
            ? `${lvl.food.name} (${lvl.food.ingredient})`
            : lvl.food.name
        })

        row.querySelectorAll<HTMLElement>(".row-honey-badge").forEach((b) => {
          const on = lvl.treatApplied === "honey_treat" && !lvl.food.isBeetle && !lvl.food.isFree
          b.classList.toggle("hidden", !on)
          b.classList.toggle("inline-flex", on)
        })
        row.querySelectorAll<HTMLElement>(".row-salt-badge").forEach((b) => {
          const on = lvl.treatApplied === "salt_lick"
          b.classList.toggle("hidden", !on)
          b.classList.toggle("inline-flex", on)
        })
        row.querySelectorAll<HTMLElement>(".row-truffle-badge").forEach((b) => {
          const on = lvl.treatApplied === "truffle_seasoning" && !lvl.isInstant
          b.classList.toggle("hidden", !on)
          b.classList.toggle("inline-flex", on)
        })
        row.querySelectorAll<HTMLElement>(".row-mud-badge").forEach((b) => {
          const on = Boolean(lvl.mudActive)
          b.classList.toggle("hidden", !on)
          b.classList.toggle("inline-flex", on)
        })

        row.querySelectorAll(".row-food-flower").forEach((el) => {
          el.textContent = lvl.food.costFlower.toFixed(4)
        })
        row.querySelectorAll(".row-food-usd").forEach((el) => {
          el.textContent = `$${lvl.food.costUsd.toFixed(4)} USD`
        })

        row.querySelectorAll(".row-xp-total").forEach((el) => {
          el.textContent = `+${lvl.totalAvailable} XP`
        })

        const breakdownText = `${lvl.residualXp} ${boot.labels.resLabel} + ${lvl.affectionXp} ${boot.labels.affecLabel} + ${lvl.totalFoodXp} ${boot.labels.foodLabel}`
        row.querySelectorAll<HTMLElement>(".row-xp-breakdown").forEach((el) => {
          el.textContent = breakdownText
          el.title = breakdownText
        })
        row.querySelectorAll(".row-xp-surplus").forEach((el) => {
          el.textContent = `(${boot.labels.surplusLabel} +${lvl.residualGenerated} XP)`
        })

        row.querySelectorAll<HTMLElement>(".row-resources-wrap").forEach((wrap) => {
          wrap.innerHTML = lvl.resources
            .map(
              (r) => `
              <div class="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.name)}" class="w-3.5 h-3.5 object-contain" />
                <span class="text-[11px] font-mono font-bold text-white">${r.amount}x</span>
              </div>
            `,
            )
            .join("")
        })

        row.querySelectorAll(".row-yield-flower").forEach((el) => {
          el.textContent = `+${lvl.revenueFlower.toFixed(4)}`
        })
        row.querySelectorAll(".row-yield-usd").forEach((el) => {
          el.textContent = `+$${lvl.revenueUsd.toFixed(4)} USD`
        })

        const pfStr = formatSignedFlower(lvl.profitFlower)
        const puStr = `${formatSignedUsd(lvl.profitUsd)}`
        row.querySelectorAll(".row-profit-flower").forEach((el) => {
          el.textContent = pfStr
          el.classList.toggle("text-emerald-400", lvl.profitFlower >= 0)
          el.classList.toggle("text-rose-400", lvl.profitFlower < 0)
        })
        row.querySelectorAll(".row-profit-usd").forEach((el) => {
          el.textContent = puStr
          el.classList.toggle("text-emerald-400/80", lvl.profitUsd >= 0)
          el.classList.toggle("text-rose-400/80", lvl.profitUsd < 0)
        })
        row.querySelectorAll(".row-profit-badge").forEach((badge) => {
          badge.classList.toggle("bg-emerald-500/10", lvl.profitFlower >= 0)
          badge.classList.toggle("border-emerald-500/20", lvl.profitFlower >= 0)
          badge.classList.toggle("text-emerald-400", lvl.profitFlower >= 0)
          badge.classList.toggle("bg-rose-500/10", lvl.profitFlower < 0)
          badge.classList.toggle("border-rose-500/20", lvl.profitFlower < 0)
          badge.classList.toggle("text-rose-400", lvl.profitFlower < 0)
        })
      })
    })

    // 3. Total acumulado de la tarjeta
    const totalFlEl = document.querySelector(
      `.animal-total-profit-flower[data-animal="${animalId}"]`,
    )
    const totalUsdEl = document.querySelector(`.animal-total-profit-usd[data-animal="${animalId}"]`)
    const totalBadgeEl = document.querySelector(
      `.animal-total-profit-badge[data-animal="${animalId}"]`,
    )
    if (totalFlEl) totalFlEl.textContent = formatSignedFlower(prog.totals.totalProfitFlower)
    if (totalUsdEl) totalUsdEl.textContent = formatSignedUsd(prog.totals.totalProfitUsd)
    if (totalBadgeEl) {
      totalBadgeEl.classList.toggle("bg-emerald-500/10", prog.totals.totalProfitFlower >= 0)
      totalBadgeEl.classList.toggle("border-emerald-500/20", prog.totals.totalProfitFlower >= 0)
      totalBadgeEl.classList.toggle("text-emerald-400", prog.totals.totalProfitFlower >= 0)
      totalBadgeEl.classList.toggle("bg-rose-500/10", prog.totals.totalProfitFlower < 0)
      totalBadgeEl.classList.toggle("border-rose-500/20", prog.totals.totalProfitFlower < 0)
      totalBadgeEl.classList.toggle("text-rose-400", prog.totals.totalProfitFlower < 0)
    }

    const titleEl = document.querySelector(`.animal-total-profit-title[data-animal="${animalId}"]`)
    if (titleEl) {
      titleEl.textContent = `${boot.labels.totalProfitLabel} (${boot.labels.levelPrefix} 1-${prog.targetLevel})`
    }
    const targetNumEl = document.querySelector(`.target-level-number[data-animal="${animalId}"]`)
    if (targetNumEl) {
      targetNumEl.textContent = `${boot.labels.levelPrefix} ${prog.targetLevel}`
    }
    const progressBar = document.querySelector<HTMLElement>(
      `.target-level-progress-bar[data-animal="${animalId}"]`,
    )
    if (progressBar) {
      const pct = Math.max(0, Math.min(100, ((prog.targetLevel - 1) / 14) * 100))
      progressBar.style.width = `${pct}%`
    }

    updateTreatControlsUI(prog)

    // Botones "Aplicar a todo" de Escarabajos
    document
      .querySelectorAll<HTMLElement>(`.apply-all-food-btn[data-animal="${animalId}"]`)
      .forEach((btn) => {
        const fId = btn.dataset.foodId
        const allMatch =
          prog.levels.length > 0 && prog.levels.every((l) => l.selectedFoodId === fId)
        btn.classList.toggle("border-emerald-400", allMatch)
        btn.classList.toggle("bg-emerald-500/25", allMatch)
        btn.classList.toggle("ring-1", allMatch)
        btn.classList.toggle("ring-emerald-400/50", allMatch)
        btn.classList.toggle("shadow-[0_0_8px_rgba(52,211,153,0.5)]", allMatch)
        btn.classList.toggle("border-white/10", !allMatch)
        btn.classList.toggle("bg-black/40", !allMatch)
      })
  }

  const recalculateAll = () => {
    ORDERED_ANIMAL_IDS.forEach((id) => recalculateAnimal(id))
    renderDashboard()
    if (activeTrigger) closeDropdown()
  }

  // Dropdown flotante de selección de alimento
  const openDropdown = (trigger: HTMLElement, animalId: AnimalId, level: number) => {
    const dropdown = getDropdown()
    if (!dropdown) return
    if (activeTrigger === trigger) {
      closeDropdown()
      return
    }
    activeTrigger = trigger

    const prog = progressionsCache[animalId]
    const lvlObj = prog?.levels.find((l) => l.level === level)
    if (!lvlObj || !lvlObj.options.length) return

    dropdown.innerHTML = `
      <div class="px-2 py-1 text-[10px] font-mono text-white/40 uppercase tracking-wider border-b border-white/5 flex justify-between">
        <span>${escapeHtml(boot.labels.dropdownFoodLabel)} (${escapeHtml(boot.labels.levelLabel)} ${level - 1} &gt; ${level})</span>
        <span>${escapeHtml(boot.labels.selectLabel)}</span>
      </div>
      <div class="flex flex-col gap-1 mt-1">
        ${lvlObj.options
          .map((opt) => {
            const isSelected = opt.id === lvlObj.selectedFoodId
            const unitsDisplay = opt.isFree
              ? "0x"
              : opt.effectivePerFeed !== 1
                ? `${opt.effectivePerFeed}x`
                : "1x"
            return `
            <button
              type="button"
              class="food-option-btn w-full text-left flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-white"
              }"
              data-animal="${animalId}"
              data-level="${level}"
              data-food-id="${escapeHtml(opt.id)}"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="relative shrink-0">
                  <img src="${escapeHtml(opt.image)}" class="w-6 h-6 object-contain" alt="${escapeHtml(opt.name)}" />
                  ${
                    opt.ingredientImage
                      ? `<img src="${escapeHtml(opt.ingredientImage)}" class="absolute -bottom-1 -right-1 w-3.5 h-3.5 object-contain" alt="" />`
                      : ""
                  }
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold truncate">${escapeHtml(unitsDisplay)} ${escapeHtml(opt.name)}</span>
                    ${
                      opt.isOptimal
                        ? `<span class="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${escapeHtml(
                            boot.labels.optimalLabel,
                          )}</span>`
                        : ""
                    }
                  </div>
                  <span class="text-[10px] font-mono text-white/40 truncate">${escapeHtml(opt.ingredient)} · ${opt.effectiveXp} XP</span>
                </div>
              </div>
              <div class="flex flex-col items-end shrink-0 font-mono text-[10px]">
                <span class="text-emerald-400 font-bold">${opt.costPerFeed.toFixed(4)} FL</span>
                <span class="text-white/40">${
                  opt.effectiveXp > 0 ? opt.costPerXp.toFixed(5) : "0"
                }/XP</span>
              </div>
            </button>
          `
          })
          .join("")}
      </div>
    `

    dropdown.classList.remove("hidden")
    const rect = trigger.getBoundingClientRect()
    const ddWidth = 288
    let left = rect.left
    let top = rect.bottom + 6
    if (left + ddWidth > window.innerWidth - 12) left = window.innerWidth - ddWidth - 12
    if (left < 12) left = 12
    if (top + 320 > window.innerHeight) {
      top = Math.max(12, rect.top - Math.min(320, dropdown.scrollHeight || 280) - 6)
    }
    dropdown.style.left = `${left}px`
    dropdown.style.top = `${top}px`
  }

  // Registrar handlers delegados activos para soportar navegaciones SPA / View Transitions
  const controller = {
    handleInput(e: Event) {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.id === "animalSearchInput") {
        applyAnimalSearch()
        return
      }

      const input = target.closest<HTMLInputElement>(".animal-boost-input")
      if (!input) return
      const animalId = input.dataset.animal as AnimalId | undefined
      const boostType = input.dataset.boostType
      if (!animalId || !boostType) return

      const rawStr = input.value.trim()
      const parsed = rawStr === "" ? NaN : parseFloat(rawStr)
      if (!animalConfig.manualBoosts) animalConfig.manualBoosts = {}
      if (!animalConfig.manualBoosts[animalId]) animalConfig.manualBoosts[animalId] = {}

      if (isNaN(parsed)) {
        ;(animalConfig.manualBoosts[animalId] as any)[boostType] = null
      } else {
        ;(animalConfig.manualBoosts[animalId] as any)[boostType] = parsed
      }

      saveConfig()
      recalculateAnimal(animalId)
      renderDashboard()
    },
    handleClick(e: Event) {
      const target = e.target as HTMLElement | null
      if (!target) return

      const tabBtn = target.closest<HTMLElement>(".animal-tab-btn, .dash-species-card")
      if (tabBtn && tabBtn.dataset.animalId) {
        switchActiveTab(tabBtn.dataset.animalId as AnimalId)
        return
      }

      const resetBtn = target.closest<HTMLElement>(".animal-boost-reset-btn")
      if (resetBtn) {
        e.stopPropagation()
        const animalId = resetBtn.dataset.animal as AnimalId | undefined
        const boostType = resetBtn.dataset.boostType
        if (!animalId || !boostType) return
        if (animalConfig.manualBoosts?.[animalId]) {
          ;(animalConfig.manualBoosts[animalId] as any)[boostType] = null
          saveConfig()
        }
        recalculateAnimal(animalId)
        renderDashboard()
        return
      }

      const mudBtn = target.closest<HTMLElement>(".mud-toggle-btn")
      if (mudBtn) {
        e.stopPropagation()
        animalConfig.mudPigEnabled = !animalConfig.mudPigEnabled
        saveConfig()
        recalculateAnimal("pig")
        renderDashboard()
        return
      }

      const applyAllBtn = target.closest<HTMLElement>(".apply-all-food-btn")
      if (applyAllBtn) {
        e.stopPropagation()
        const animalId = applyAllBtn.dataset.animal as AnimalId | undefined
        const foodId = applyAllBtn.dataset.foodId
        if (!animalId || !foodId) return
        const prog = progressionsCache[animalId]
        if (!prog) return
        const allMatch = prog.levels.every((l) => l.selectedFoodId === foodId)
        if (!animalConfig.selectedFoods) animalConfig.selectedFoods = {}
        if (allMatch) {
          delete animalConfig.selectedFoods[animalId]
        } else {
          animalConfig.selectedFoods[animalId] = {}
          for (let lvl = 1; lvl <= 15; lvl++) {
            animalConfig.selectedFoods[animalId][lvl] = foodId
          }
        }
        saveConfig()
        recalculateAnimal(animalId)
        renderDashboard()
        return
      }

      const treatTypeBtn = target.closest<HTMLElement>(".treat-type-btn")
      if (treatTypeBtn) {
        e.stopPropagation()
        const animalId = treatTypeBtn.dataset.animal as AnimalId | undefined
        const treatType = treatTypeBtn.dataset.treatType as AnimalTreatType | undefined
        if (!animalId || !treatType) return
        if (!animalConfig.treatMode) animalConfig.treatMode = {}
        const prev = animalConfig.treatMode[animalId]
        animalConfig.treatMode[animalId] = {
          type: treatType,
          startLevel: prev?.startLevel ?? null,
        }
        saveConfig()
        recalculateAnimal(animalId)
        renderDashboard()
        return
      }

      const treatToggleBtn = target.closest<HTMLElement>(".honey-treat-toggle-btn")
      if (treatToggleBtn) {
        e.stopPropagation()
        const animalId = treatToggleBtn.dataset.animal as AnimalId | undefined
        if (!animalId) return
        treatPickerActive[animalId] = !treatPickerActive[animalId]
        const prog = progressionsCache[animalId]
        if (prog) updateTreatControlsUI(prog)
        return
      }

      const dotBtn = target.closest<HTMLElement>(".target-level-dot")
      if (dotBtn) {
        e.stopPropagation()
        const animalId = dotBtn.dataset.animal as AnimalId | undefined
        const clickedLvl = Number(dotBtn.dataset.targetLevel)
        if (!animalId || clickedLvl < 1 || clickedLvl > 15) return
        const prog = progressionsCache[animalId]

        if (treatPickerActive[animalId]) {
          const treatType = animalConfig.treatMode?.[animalId]?.type || "honey_treat"
          if (
            treatType === "honey_treat" &&
            (clickedLvl <= 1 || prog?.modifiers.effective.isFreeFeed)
          ) {
            return
          }
          if (!animalConfig.treatMode) animalConfig.treatMode = {}
          const curStart = animalConfig.treatMode[animalId]?.startLevel ?? null
          animalConfig.treatMode[animalId] = {
            type: treatType,
            startLevel: curStart === clickedLvl ? null : clickedLvl,
          }
          treatPickerActive[animalId] = false
          saveConfig()
          recalculateAnimal(animalId)
          renderDashboard()
          return
        }

        if (!animalConfig.targetLevels) animalConfig.targetLevels = {}
        animalConfig.targetLevels[animalId] = clickedLvl
        saveConfig()
        recalculateAnimal(animalId)
        renderDashboard()
        return
      }

      const trigger = target.closest<HTMLElement>(".food-selector-trigger")
      if (trigger) {
        e.stopPropagation()
        const animalId = trigger.dataset.animal as AnimalId | undefined
        const level = Number(trigger.dataset.level)
        if (animalId && level) openDropdown(trigger, animalId, level)
        return
      }

      const optionBtn = target.closest<HTMLElement>(".food-option-btn")
      if (optionBtn) {
        e.stopPropagation()
        const animalId = optionBtn.dataset.animal as AnimalId | undefined
        const level = Number(optionBtn.dataset.level)
        const foodId = optionBtn.dataset.foodId
        if (animalId && level && foodId) {
          if (!animalConfig.selectedFoods) animalConfig.selectedFoods = {}
          if (!animalConfig.selectedFoods[animalId]) animalConfig.selectedFoods[animalId] = {}
          const prog = progressionsCache[animalId]
          const lvlObj = prog?.levels.find((l) => l.level === level)
          if (lvlObj && foodId === lvlObj.optimalFoodId) {
            delete animalConfig.selectedFoods[animalId][level]
          } else {
            animalConfig.selectedFoods[animalId][level] = foodId
          }
          saveConfig()
          recalculateAnimal(animalId)
          renderDashboard()
        }
        closeDropdown()
        return
      }

      const dropdown = getDropdown()
      if (dropdown && !dropdown.contains(target)) {
        closeDropdown()
      }
    },
    handleRefresh() {
      if (!document.getElementById("sflAnimalsBootData")) return
      animalConfig = loadConfig()
      recalculateAll()
    },
    handleClose() {
      closeDropdown()
    },
  }

  ;(window as any).__animalsController = controller

  if (!(window as any).__animalsUiListenersBound) {
    ;(window as any).__animalsUiListenersBound = true
    document.addEventListener("input", (e) => (window as any).__animalsController?.handleInput(e))
    document.addEventListener("click", (e) => (window as any).__animalsController?.handleClick(e))
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") (window as any).__animalsController?.handleClose()
    })
    window.addEventListener("scroll", () => (window as any).__animalsController?.handleClose(), {
      passive: true,
    })
    window.addEventListener("resize", () => (window as any).__animalsController?.handleClose(), {
      passive: true,
    })
    window.addEventListener("sfl:stateUpdated", () =>
      (window as any).__animalsController?.handleRefresh(),
    )
    SflUserState.subscribe(() => (window as any).__animalsController?.handleRefresh())
    if (SflMarket.onUpdate) {
      SflMarket.onUpdate(() => (window as any).__animalsController?.handleRefresh())
    }
    window.addEventListener("sfl:marketUpdated", () =>
      (window as any).__animalsController?.handleRefresh(),
    )
  }

  // Hidratar estado inicial y disparar carga de mercado en vivo
  recalculateAll()
  switchActiveTab((animalConfig.activeSpecies as AnimalId) || "chicken", false)
  SflMarket.fetchMarketData()
}
