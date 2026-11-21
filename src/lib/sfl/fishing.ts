// ============================================================
// src/lib/sfl/fishing.ts
// Motor Centralizado de Pesca de Sunflower Land (Yields, Cañas y Costos)
//
// Responsabilidad única: Proveer a cualquier calculadora o vista
// (Pesca, Aging Shed, Cocina, etc.) la matemática exacta de
// rendimiento de captura (fishYield), costos de caña con buffs/skills
// y costos unitarios efectivos de peces.
// ============================================================

import { SflUserState, type SflUserGameState } from "./state"
import {
  getFishData,
  APEX_SHARKS,
  GUARANTEED_CHUM_COMBOS,
  FREE_COMPOST_BAITS,
} from "./constants"

export interface SeasonalMatch {
  name: string
  season: string
  desc: string
  img: string
}

export interface FishYieldResult {
  yield: number
  bonusTags: string[]
  seasonalMatches: SeasonalMatch[]
}

/**
 * Comprueba si un buff o wearable está activo en el estado proporcionado o en SflUserState global.
 */
export function isFishingBuffActive(
  buffName: string,
  state?: SflUserGameState | null
): boolean {
  if (!state) {
    if (typeof window !== "undefined" && (window as any).SflUserState) {
      return (window as any).SflUserState.isBuffActive(buffName)
    }
    return SflUserState.isBuffActive(buffName)
  }
  const keys = [buffName]
  const aliases: Record<string, string[]> = {
    "Walrus": ["478"],
    "Alba": ["479"],
    "Dumbo Octopus": ["3031"],
    "Fisher's Hourglass": ["9015"],
    "Shrimp Onesie": ["562"],
    "Otty the Otter": ["3050"],
    "Sunflower Rod": ["9021"],
    "Trident": ["9022"],
    "Pink Dolphin": ["2254"],
    "Jellyfish": ["2203"],
    "Poseidon": ["2318"],
    "Super Star": ["1549"],
    "Fish Frenzy": ["9020"],
    "Ancient Rod": ["224"],
    "Full Moon": ["9023"],
    "Summer Guardian": ["2262"],
    "Navigation Table": ["2992"],
    "Deep Sea Helm": ["9024"],
  }
  if (aliases[buffName]) keys.push(...aliases[buffName])
  return keys.some((k) => Boolean(state.buffs?.[k] || (state.skills?.[k] && state.skills[k] > 0)))
}

/**
 * Devuelve el rango de una habilidad (1, 2, 3) o 0.
 */
export function getFishingSkillRank(
  skillName: string,
  state?: SflUserGameState | null
): number {
  if (!state) {
    if (typeof window !== "undefined" && (window as any).SflUserState) {
      return (window as any).SflUserState.getSkillRank(skillName)
    }
    return SflUserState.getSkillRank(skillName)
  }
  return state.skills?.[skillName] || 0
}

/**
 * Calcula el multiplicador de rendimiento (fishYield) para un pez dado su tier y estaciones.
 */
export function calculateFishYield(
  tier: string,
  seasons: string[] | string | undefined,
  userState?: SflUserGameState | null
): FishYieldResult {
  let fishYield = 1.0
  const bonusTags: string[] = []
  const seasonalMatches: SeasonalMatch[] = []

  const normTier = (tier || "basic").toLowerCase()
  const seasonList: string[] = Array.isArray(seasons)
    ? seasons.map((s) => s.toLowerCase().trim())
    : typeof seasons === "string"
      ? seasons.toLowerCase().split(/\s+/)
      : []

  // 1. Walrus (+1 pez garantizado)
  if (isFishingBuffActive("Walrus", userState)) {
    fishYield += 1.0
    bonusTags.push("+1 Walrus")
  }

  // 2. Alba (50% prob de +1 pez básico)
  if (normTier === "basic" && isFishingBuffActive("Alba", userState)) {
    fishYield += 0.5
    bonusTags.push("+50% Alba")
  }

  // 3. Dumbo Octopus (20% prob de +1 pez)
  if (isFishingBuffActive("Dumbo Octopus", userState)) {
    fishYield += 0.2
    bonusTags.push("+20% Dumbo")
  }

  // 4. Fisher's Hourglass (50% prob de +1 pez)
  if (isFishingBuffActive("Fisher's Hourglass", userState)) {
    fishYield += 0.5
    bonusTags.push("+50% Hourglass")
  }

  // 5. Shrimp Onesie (+1 pez cada 15 lanzamientos = +6.67%)
  if (isFishingBuffActive("Shrimp Onesie", userState)) {
    fishYield += 1 / 15
    bonusTags.push("+1/15 Pez Shrimp Onesie")
  }

  // 6. Otty the Otter (+1 pez cada 15 lanzamientos = +6.67%)
  if (isFishingBuffActive("Otty the Otter", userState)) {
    fishYield += 1 / 15
    bonusTags.push("+1/15 Pez Otty")
  }

  // 7. Sunflower Rod (+10% prob de +1 pez)
  if (isFishingBuffActive("Sunflower Rod", userState)) {
    fishYield += 0.1
    bonusTags.push("+10% Sunflower Rod")
  }

  // 8. Trident (+20% prob de +1 pez)
  if (isFishingBuffActive("Trident", userState)) {
    fishYield += 0.2
    bonusTags.push("+20% Trident")
  }

  // 9. Estacionales (Propuesta A: Máximo +1.0 no acumulativo si el pez está en temporada)
  if (seasonList.includes("spring") && isFishingBuffActive("Pink Dolphin", userState)) {
    seasonalMatches.push({
      name: "Pink Dolphin",
      season: "Primavera",
      desc: "Pink Dolphin (+1 Primavera)",
      img: "/img/sunflowerland/powerups/pink_dolphin.webp",
    })
  }
  if (seasonList.includes("summer") && isFishingBuffActive("Jellyfish", userState)) {
    seasonalMatches.push({
      name: "Jellyfish",
      season: "Verano",
      desc: "Jellyfish (+1 Verano)",
      img: "/img/sunflowerland/powerups/jellyfish.webp",
    })
  }
  if (seasonList.includes("autumn") && isFishingBuffActive("Poseidon", userState)) {
    seasonalMatches.push({
      name: "Poseidon",
      season: "Otoño",
      desc: "Poseidon (+1 Otoño)",
      img: "/img/sunflowerland/powerups/poseidon.webp",
    })
  }
  if (seasonList.includes("winter") && isFishingBuffActive("Super Star", userState)) {
    seasonalMatches.push({
      name: "Super Star",
      season: "Invierno",
      desc: "Super Star (+1 Invierno)",
      img: "/img/sunflowerland/powerups/super_star.webp",
    })
  }

  if (seasonalMatches.length > 0) {
    fishYield += 1.0
    bonusTags.push(seasonalMatches.length === 1 ? `+1 ${seasonalMatches[0].season}` : "+1 Estacional")
  }

  // 10. Habilidades del árbol de Pesca
  const rankChance = getFishingSkillRank("Fishy Chance", userState)
  if (normTier === "basic" && rankChance > 0) {
    const chance = rankChance === 3 ? 0.15 : rankChance === 2 ? 0.125 : 0.1
    fishYield += chance
    bonusTags.push(`+${Math.round(chance * 100)}% Chance`)
  }

  const rankRoll = getFishingSkillRank("Fishy Roll", userState)
  if (normTier === "advanced" && rankRoll > 0) {
    const chance = rankRoll === 3 ? 0.15 : rankRoll === 2 ? 0.125 : 0.1
    fishYield += chance
    bonusTags.push(`+${Math.round(chance * 100)}% Roll`)
  }

  const rankGamble = getFishingSkillRank("Fishy Gamble", userState)
  if (normTier === "expert" && rankGamble > 0) {
    const chance = rankGamble === 3 ? 0.3 : rankGamble === 2 ? 0.25 : 0.2
    fishYield += chance
    bonusTags.push(`+${Math.round(chance * 100)}% Gamble`)
  }

  // 11. Evento Fish Frenzy & Sinergia Frenzied Fish
  const hasFishFrenzy = isFishingBuffActive("Fish Frenzy", userState)
  if (hasFishFrenzy) {
    let frenzyBonus = 1.0
    const rankFrenzied = getFishingSkillRank("Frenzied Fish", userState)
    if (rankFrenzied > 0) {
      const skillBonus = rankFrenzied + 0.5
      frenzyBonus += skillBonus
      bonusTags.push(`+${frenzyBonus.toFixed(1)} Frenesí+Skill`)
    } else {
      bonusTags.push("+1 Frenesí")
    }
    fishYield += frenzyBonus
  }

  return {
    yield: fishYield,
    bonusTags,
    seasonalMatches,
  }
}

/**
 * Calcula el costo de la caña (Rod) teniendo en cuenta Ancient Rod y la habilidad Reel Deal.
 */
export function calculateEffectiveRodCost(
  baseRodCraftFlower: number,
  stonePriceFlower: number,
  woodPriceFlower: number,
  userState?: SflUserGameState | null
): number {
  if (isFishingBuffActive("Ancient Rod", userState)) {
    return 0
  }
  const reelDealRank = getFishingSkillRank("Reel Deal", userState)
  if (reelDealRank > 0) {
    const mult = reelDealRank === 3 ? 0.4 : reelDealRank === 2 ? 0.45 : 0.5
    const coinPortion = Math.max(0, baseRodCraftFlower - stonePriceFlower - (woodPriceFlower * 3))
    return stonePriceFlower + (woodPriceFlower * 3) + (coinPortion * mult)
  }
  return baseRodCraftFlower
}
