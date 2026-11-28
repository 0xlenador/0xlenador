// ============================================================
// src/lib/sfl/animals.ts
// Motor centralizado (SSOT) de datos y cálculos oficiales para
// Animales, Alimentación, Afecto, Buffs, Treats y Edificios
// de Sunflower Land.
//
// Responsabilidad única: Compartir una sola fuente de verdad
// matemática entre el renderizado SSR (Astro) y la reactividad
// en vivo del navegador (window.SflAnimals + SflUserState + SflMarket).
// ============================================================

import buildingsDataRaw from "../../content/data/sfl/animals/buildings.json"
import animalsDataRaw from "../../content/data/sfl/animals/animals.json"
import consumablesDataRaw from "../../content/data/sfl/animals/consumables.json"
import skillsDataRaw from "../../content/data/sfl/skills.json"
import { getItemPrice, getState, getFlowerPrice, getBettyRatio } from "./market"
import {
  calculateGemCostUsd,
  getHoneyTreatPrice,
  getSaltLickPrice,
  getTruffleSeasoningPrice,
  getRefinedSaltPrice,
  OFFICIAL_COINS_PER_FLOWER,
} from "./constants"
import { resolveCost } from "./prices"
import {
  SflUserState,
  type SflUserGameState,
  type AnimalTreatType,
  type AnimalManualBoosts,
} from "./state"

// ---------------------------------------------------------------------------
// Tipos e Interfaces
// ---------------------------------------------------------------------------

export type AnimalBuildingId = "hen_house" | "barn" | "pigpen"
export type AnimalId = "chicken" | "cow" | "sheep" | "pig"
export type ConsumableCategory = "feed" | "slop" | "medicine" | "mud" | "beetle" | "treat"

export interface IngredientCost {
  name: string
  amount: number
  image: string
}

export interface BountyCategoryDetail {
  count: number
  minLevel?: number | null
  maxLevel?: number | null
}

export interface LevelBounties {
  totalWeekly: number
  tickets?: BountyCategoryDetail
  coins?: BountyCategoryDetail
  gems?: BountyCategoryDetail
  bristles?: BountyCategoryDetail
}

export interface BuildingLevel {
  level: number
  name: string
  capacity: number
  coins: number
  ingredients: IngredientCost[]
  bounties?: LevelBounties
}

export interface AnimalBuilding {
  id: AnimalBuildingId
  name: string
  description: string
  unlockBumpkinLevel: number
  allowedAnimals: AnimalId[]
  icon: string
  levels: BuildingLevel[]
}

export interface AnimalLevel {
  level: number
  xpRequired: number
  cumulativeXp: number
}

export interface CareTool {
  id: string
  name: string
  xp: number
  image: string
}

export interface AnimalDropYieldTier {
  minLevel: number
  maxLevel: number
  amount: number
}

export interface AnimalDropInfo {
  id: string
  name: string
  image: string
  unlockLevel: number
  yieldTiers?: AnimalDropYieldTier[]
  amount?: number
}

export interface AnimalData {
  id: AnimalId
  name: string
  buildingId: AnimalBuildingId
  icon: string
  purchaseCost: {
    coins: number
  }
  maxLevel: number
  sleepDurationHours: number
  careTools: CareTool[]
  acceptedFoods: string[]
  drops: {
    primary: AnimalDropInfo
    secondary?: AnimalDropInfo
  }
  levels: AnimalLevel[]
}

export interface ConsumableItem {
  id: string
  name: string
  description: string
  category: ConsumableCategory
  targetAnimals: AnimalId[]
  xp?: number
  isUniversalFavorite?: boolean
  cost?: number
  resource?: string
  image?: string
  effect?: string
  durationCycles?: number
  feedReductionPercent?: number
  yieldMultiplier?: number
  sleepReductionPercent?: number
  effects?: {
    xpBoostPercent?: number
    sicknessImmunity?: boolean
    [key: string]: unknown
  }
  tier?: number
  unlockLevel?: number
  craftingIngredients?: IngredientCost[]
  options?: IngredientCost[]
}

export interface LoveProbabilities {
  petting: number
  brush: number
  music: number
}

export interface AffectionToolItem {
  id: string
  name: string
  xp: number
  baseXp: number
  percent: number
  image: string
}

export interface FoodCandidate {
  id: string
  name: string
  displayName: string
  image: string
  ingredient: string
  ingredientImage?: string
  ingredientName?: string
  ingredientAmount?: number
  priceSource: "p2p" | "craft" | "gem"
  ingredientsList: Array<{ name: string; amount: number }>
  baseXp: number
  effectiveXp: number
  xp: number
  unitCostFlower: number
  requiredPerFeed: number
  effectivePerFeed: number
  costPerFeed: number
  costPerXp: number
  isBeetle: boolean
  isOmnifeed: boolean
  isFree?: boolean
  isFav: boolean
  isOptimal: boolean
}

export interface ActiveBoostSummary {
  name: string
  value: string
  source: "skill" | "collectible" | "wearable" | "shrine" | "other" | "treat"
}

export interface ResolvedAnimalModifiers {
  animalId: AnimalId
  auto: {
    foodMultiplier: number
    foodXpMultiplier: number
    affectionMultiplier: number
    affectionFlatBonus: number
    primaryMultiplier: number
    primaryFlatBonus: number
    secondaryMultiplier: number
    secondaryFlatBonus: number
    sleepSubtractHours: number
    sleepMultiplier: number
    shrineSpeedMultiplier: number
    isFreeFeed: boolean
    freeFeedSource: string | null
    kaleMixAmount: number | null
    vibraphoneMultiplier: number
  }
  effective: {
    foodMultiplier: number
    foodXpMultiplier: number
    affectionMultiplier: number
    affectionFlatBonus: number
    primaryMultiplier: number
    primaryFlatBonus: number
    secondaryMultiplier: number
    secondaryFlatBonus: number
    sleepHoursBase: number
    isFreeFeed: boolean
    freeFeedSource: string | null
    kaleMixAmount: number | null
    vibraphoneMultiplier: number
  }
  hasOverrides: {
    food: boolean
    foodXp: boolean
    careMultiplier: boolean
    primaryDrop: boolean
    secondaryDrop: boolean
  }
  activeBoosts: ActiveBoostSummary[]
}

export interface CalculatedDropItem {
  name: string
  baseAmount: number
  amount: number
  unitPrice: number
  image: string
  isPrimary: boolean
  isSecondary: boolean
}

export interface AnimalLevelCalculation {
  level: number
  fromLevel: number
  toLevel: number
  xpRequired: number
  sleepHours: number
  isInstant: boolean
  residualXp: number
  residualGenerated: number
  affectionTools: AffectionToolItem[]
  affectionXp: number
  loveProb: LoveProbabilities
  food: {
    id: string
    name: string
    displayName: string
    image: string
    ingredient: string
    ingredientImage?: string
    ingredientName?: string
    ingredientAmount?: number
    units: number
    neededFeeds: number
    xp: number
    baseXp: number
    costFlower: number
    costUsd: number
    isBeetle: boolean
    isFree: boolean
    isFav: boolean
    isOptimal: boolean
  }
  selectedFoodId: string
  optimalFoodId: string
  options: FoodCandidate[]
  totalXpObtained: number
  totalFoodXp: number
  totalAvailable: number
  resources: CalculatedDropItem[]
  revenueFlower: number
  revenueUsd: number
  treatApplied: AnimalTreatType | null
  treatStartsHere: boolean
  treatCostFlower: number
  mudActive: boolean
  mudCostFlower: number
  profitFlower: number
  profitUsd: number
}

export interface AnimalProgressionResult {
  animalId: AnimalId
  name: string
  icon: string
  buildingId: AnimalBuildingId
  buildingName: string
  buildingIcon: string
  costCoins: number
  purchaseCostFlower: number
  baseSleepHours: number
  effectiveSleepHours: number
  modifiers: ResolvedAnimalModifiers
  targetLevel: number
  treatType: AnimalTreatType
  treatStartLevel: number | null
  treatDurationCycles: number
  mudLevel: number | null
  levels: AnimalLevelCalculation[]
  totals: {
    targetLevel: number
    totalCostFlower: number
    totalCostUsd: number
    totalRevenueFlower: number
    totalRevenueUsd: number
    totalProfitFlower: number
    totalProfitUsd: number
    totalHours: number
    totalFeeds: number
    totalXp: number
    roiPercent: number
  }
}

export interface AnimalCalculationContext {
  marketPrices?: Record<string, number>
  flowerPriceUsd?: number
  coinsPerFlower?: number
  userState?: SflUserGameState | null
  targetLevel?: number
  selectedFoods?: Record<number, string>
  treatType?: AnimalTreatType
  treatStartLevel?: number | null
  mudPigLevel?: number | null
  manualBoosts?: AnimalManualBoosts | null
  customUnitPriceResolver?: (name: string) => number
}

// ---------------------------------------------------------------------------
// Constantes Oficiales Verificadas contra sunflower-land/sunflower-land
// ---------------------------------------------------------------------------

export const ORDERED_ANIMAL_IDS = ["chicken", "sheep", "cow", "pig"] as const

export const REQUIRED_FOOD_QTY: Record<AnimalId, number> = {
  chicken: 1,
  sheep: 3,
  cow: 5,
  pig: 1,
}

export const LOVE_ITEM_XP = {
  petting_hand: 25,
  brush: 40,
  music_box: 50,
} as const

export const MAX_LOVES_PER_SLEEP = 2

export const LOVE_REQUESTS: Record<number, LoveProbabilities> = {
  0: { petting: 0, brush: 0, music: 0 },
  1: { petting: 1.0, brush: 0, music: 0 },
  2: { petting: 0.8, brush: 0.2, music: 0 },
  3: { petting: 0.7, brush: 0.3, music: 0 },
  4: { petting: 0.6, brush: 0.3, music: 0.1 },
  5: { petting: 0.5, brush: 0.4, music: 0.1 },
  6: { petting: 0.5, brush: 0.3, music: 0.2 },
  7: { petting: 0.4, brush: 0.4, music: 0.2 },
  8: { petting: 0.4, brush: 0.3, music: 0.3 },
  9: { petting: 0.3, brush: 0.4, music: 0.3 },
  10: { petting: 0.3, brush: 0.3, music: 0.4 },
  11: { petting: 0.2, brush: 0.4, music: 0.4 },
  12: { petting: 0.2, brush: 0.3, music: 0.5 },
  13: { petting: 0.1, brush: 0.4, music: 0.5 },
  14: { petting: 0.1, brush: 0.3, music: 0.6 },
  15: { petting: 0.1, brush: 0.2, music: 0.7 },
}

export const BEETLES_LIST = [
  {
    id: "green_beetle",
    name: "Green Beetle",
    xp: 100,
    img: "/img/sunflowerland/green_beetle.webp",
  },
  { id: "blue_beetle", name: "Blue Beetle", xp: 200, img: "/img/sunflowerland/blue_beetle.webp" },
  { id: "pink_beetle", name: "Pink Beetle", xp: 400, img: "/img/sunflowerland/pink_beetle.webp" },
  {
    id: "amber_beetle",
    name: "Amber Beetle",
    xp: 800,
    img: "/img/sunflowerland/amber_beetle.webp",
  },
] as const

export const BEETLE_IDS = new Set<string>(BEETLES_LIST.map((b) => b.id))
export const BEETLE_NAMES = new Set<string>(BEETLES_LIST.map((b) => b.name))

export const MUD_PER_APPLICATION = 25
export const MUD_XP_MULTIPLIER = 1.25
export const SALT_LICK_YIELD_MULTIPLIER = 1.05
export const HONEY_TREAT_FEED_MULTIPLIER = 0.75
export const TRUFFLE_SEASONING_SLEEP_MULTIPLIER = 0.5
export const PIG_ONESIE_XP_MULTIPLIER = 1.05

// Tabla oficial ANIMAL_FOOD_EXPERIENCE por nivel (0..15)
export function getBaseFoodXp(animalId: AnimalId, fromLevel: number, foodId: string): number {
  const beetle = BEETLES_LIST.find((b) => b.id === foodId || b.name === foodId)
  if (beetle) return beetle.xp

  const clean = foodId.toLowerCase()
  if (animalId === "pig") {
    if (clean.startsWith("basic_slop")) return fromLevel <= 2 ? 60 : 10
    if (clean.startsWith("hearty_slop"))
      return fromLevel >= 3 && fromLevel <= 5 ? 60 : fromLevel <= 2 ? 10 : 20
    if (clean.startsWith("rich_slop"))
      return fromLevel >= 6 && fromLevel <= 9 ? 60 : fromLevel <= 5 ? 20 : 30
    if (clean.startsWith("gourmet_slop")) return fromLevel >= 10 ? 80 : 30
    return 60
  }

  if (clean === "kernel_blend") return fromLevel <= 2 ? 60 : 10
  if (clean === "hay") return fromLevel >= 3 && fromLevel <= 5 ? 60 : fromLevel <= 2 ? 10 : 20
  if (clean === "nutribarley")
    return fromLevel >= 6 && fromLevel <= 9 ? 60 : fromLevel <= 5 ? 20 : 30
  if (clean === "mixed_grain") return fromLevel >= 10 ? 80 : 30
  if (clean === "omnifeed") return fromLevel >= 10 ? 80 : 60
  return 60
}

export function getPreferredSlopIdForLevel(fromLevel: number): string {
  if (fromLevel <= 2) return "basic_slop"
  if (fromLevel <= 5) return "hearty_slop"
  if (fromLevel <= 9) return "rich_slop"
  return "gourmet_slop"
}

export const SLOP_TIERS = ["basic_slop", "hearty_slop", "rich_slop", "gourmet_slop"] as const

// ---------------------------------------------------------------------------
// Acceso Estático a Datos Tipados
// ---------------------------------------------------------------------------

export const ANIMAL_BUILDINGS = buildingsDataRaw as unknown as Record<
  AnimalBuildingId,
  AnimalBuilding
>
export const ANIMALS = animalsDataRaw as unknown as Record<AnimalId, AnimalData>
export const ANIMAL_CONSUMABLES = consumablesDataRaw as unknown as Record<string, ConsumableItem>

export function getAnimalBuildings(): AnimalBuilding[] {
  return Object.values(ANIMAL_BUILDINGS)
}

export function getAnimalBuilding(id: AnimalBuildingId): AnimalBuilding | undefined {
  return ANIMAL_BUILDINGS[id]
}

export function getAnimals(): AnimalData[] {
  return ORDERED_ANIMAL_IDS.map((id) => ANIMALS[id]).filter(Boolean)
}

export function getAnimal(id: AnimalId): AnimalData | undefined {
  return ANIMALS[id]
}

export function getAnimalsByBuilding(buildingId: AnimalBuildingId): AnimalData[] {
  return getAnimals().filter((animal) => animal.buildingId === buildingId)
}

export function getConsumablesByCategory(category: ConsumableCategory): ConsumableItem[] {
  return Object.values(ANIMAL_CONSUMABLES).filter((c) => c.category === category)
}

export function getConsumable(id: string): ConsumableItem | undefined {
  return ANIMAL_CONSUMABLES[id]
}

/** Obtiene los drops base por nivel desde animals.json (SSOT unificada) */
export function getDropsForAnimalLevel(
  animalId: AnimalId,
  level: number,
): Array<{
  name: string
  amount: number
  image: string
  isPrimary: boolean
  isSecondary: boolean
}> {
  const animalDef = ANIMALS[animalId]
  if (!animalDef?.drops) return []

  const resolveDropAmount = (drop?: AnimalDropInfo): number => {
    if (!drop || level < (drop.unlockLevel || 1)) return 0
    if (Array.isArray(drop.yieldTiers)) {
      const tier = drop.yieldTiers.find((t) => level >= t.minLevel && level <= t.maxLevel)
      return tier ? tier.amount : 0
    }
    return drop.amount || 0
  }

  const result: Array<{
    name: string
    amount: number
    image: string
    isPrimary: boolean
    isSecondary: boolean
  }> = []

  const primary = animalDef.drops.primary
  const primaryAmt = resolveDropAmount(primary)
  if (primaryAmt > 0) {
    result.push({
      name: primary.name,
      amount: primaryAmt,
      image: primary.image,
      isPrimary: true,
      isSecondary: false,
    })
  }

  const secondary = animalDef.drops.secondary
  const secondaryAmt = resolveDropAmount(secondary)
  if (secondary && secondaryAmt > 0) {
    result.push({
      name: secondary.name,
      amount: secondaryAmt,
      image: secondary.image,
      isPrimary: false,
      isSecondary: true,
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers internos de lectura de buffs y precios
// ---------------------------------------------------------------------------

function roundExact(val: number, decimals: number = 4): number {
  const factor = 10 ** decimals
  return Math.round((val + Number.EPSILON) * factor) / factor
}

function getEffectiveUserState(userState?: SflUserGameState | null): SflUserGameState {
  if (userState) return userState
  if (typeof window !== "undefined" && typeof SflUserState?.getState === "function") {
    return SflUserState.getState()
  }
  return { skills: {}, buffs: {}, preferences: {}, updatedAt: 0 }
}

function hasActiveBuff(state: SflUserGameState, ...keys: string[]): boolean {
  return keys.some(
    (k) => Boolean(state.buffs?.[k]) || Boolean(state.skills?.[k] && state.skills[k] > 0),
  )
}

function getSkillRankFromState(state: SflUserGameState, skillName: string): number {
  const rank = state.skills?.[skillName]
  if (typeof rank === "number" && rank > 0) return rank
  return state.buffs?.[skillName] ? 1 : 0
}

function getSkillRankValues(
  skillName: string,
  mathKey: "mathematics_1" | "mathematics_2" = "mathematics_1",
): number[] {
  const animalSkills = (skillsDataRaw as any)?.Animals || {}
  const skill = animalSkills[skillName]
  const byRank = skill?.[mathKey]?.calc_by_rank
  if (!byRank) return []
  return [byRank.rank_1, byRank.rank_2, byRank.rank_3].filter((v) => typeof v === "number")
}

// ---------------------------------------------------------------------------
// Extracción de Modificadores desde SflUserState + Manual Overrides
// ---------------------------------------------------------------------------

/**
 * Resuelve todos los modificadores automáticos activos desde skills/buffs de SflUserState
 * aplicando con exactitud el orden oficial de Sunflower Land (incluyendo debuffs cruzados),
 * y aplica opcionalmente overrides manuales definidos en la tarjeta.
 */
export function resolveAnimalModifiers(
  animalId: AnimalId,
  userState?: SflUserGameState | null,
  manualBoosts?: AnimalManualBoosts | null,
): ResolvedAnimalModifiers {
  const state = getEffectiveUserState(userState)
  const activeBoosts: ActiveBoostSummary[] = []

  const isChicken = animalId === "chicken"
  const isSheep = animalId === "sheep"
  const isCow = animalId === "cow"
  const isPig = animalId === "pig"

  // 1. Alimentación (Consumo / Free Feed / XP / Kale Mix)
  let foodMultiplier = 1
  let foodXpMultiplier = 1
  let isFreeFeed = false
  let freeFeedSource: string | null = null

  if (isChicken && hasActiveBuff(state, "Gold Egg", "409")) {
    isFreeFeed = true
    freeFeedSource = "Gold Egg"
    activeBoosts.push({ name: "Gold Egg", value: "Free", source: "collectible" })
  } else if (isCow && hasActiveBuff(state, "Golden Cow", "2178")) {
    isFreeFeed = true
    freeFeedSource = "Golden Cow"
    activeBoosts.push({ name: "Golden Cow", value: "Free", source: "collectible" })
  } else if (isSheep && hasActiveBuff(state, "Golden Sheep", "2193")) {
    isFreeFeed = true
    freeFeedSource = "Golden Sheep"
    activeBoosts.push({ name: "Golden Sheep", value: "Free", source: "collectible" })
  }

  if (isChicken && hasActiveBuff(state, "Fat Chicken", "611")) {
    foodMultiplier *= 0.9
    activeBoosts.push({ name: "Fat Chicken", value: "x0.9", source: "collectible" })
  }
  if (isChicken && hasActiveBuff(state, "Cluckulator", "2157")) {
    foodMultiplier *= 0.75
    activeBoosts.push({ name: "Cluckulator", value: "x0.75", source: "collectible" })
  }
  if (isCow && hasActiveBuff(state, "Dr Cow", "2256")) {
    foodMultiplier *= 0.95
    activeBoosts.push({ name: "Dr Cow", value: "x0.95", source: "collectible" })
  }
  if (isSheep && hasActiveBuff(state, "Mermaid Sheep", "2537")) {
    foodMultiplier *= 0.95
    activeBoosts.push({ name: "Mermaid Sheep", value: "x0.95", source: "collectible" })
  }
  if ((isCow || isSheep) && hasActiveBuff(state, "Infernal Bullwhip", "400")) {
    foodMultiplier *= 0.5
    activeBoosts.push({ name: "Infernal Bullwhip", value: "x0.5", source: "wearable" })
  }
  if (isChicken && hasActiveBuff(state, "Bantam Shrine", "9033")) {
    foodMultiplier *= 0.95
    activeBoosts.push({ name: "Bantam Shrine", value: "x0.95 feed", source: "shrine" })
  }
  if ((isCow || isSheep) && hasActiveBuff(state, "Collie Shrine", "9032")) {
    foodMultiplier *= 0.95
    activeBoosts.push({ name: "Collie Shrine", value: "x0.95 feed", source: "shrine" })
  }

  const effFeedRank = getSkillRankFromState(state, "Efficient Feeding")
  if (effFeedRank > 0) {
    const ranks = getSkillRankValues("Efficient Feeding")
    const val = ranks[effFeedRank - 1] ?? 0.95
    foodMultiplier *= val
    activeBoosts.push({ name: "Efficient Feeding", value: `x${val}`, source: "skill" })
  }

  // Habilidades de dieta con buff al animal propio y debuff cruzado a los demás 3
  const dietSkills: Array<{ skill: string; target: AnimalId }> = [
    { skill: "Clucky Grazing", target: "chicken" },
    { skill: "Sheepwise Diet", target: "sheep" },
    { skill: "Cow-Smart Nutrition", target: "cow" },
    { skill: "Swill Savvy", target: "pig" },
  ]
  for (const d of dietSkills) {
    const rank = getSkillRankFromState(state, d.skill)
    if (!rank) continue
    const isFavAnimal = d.target === animalId
    const ranks = getSkillRankValues(d.skill, isFavAnimal ? "mathematics_1" : "mathematics_2")
    const val = ranks[rank - 1] ?? (isFavAnimal ? 0.75 : 1.5)
    foodMultiplier *= val
    activeBoosts.push({ name: d.skill, value: `x${val}`, source: "skill" })
  }

  const chonkyRank = getSkillRankFromState(state, "Chonky Feed")
  if (chonkyRank > 0) {
    const xpRanks = getSkillRankValues("Chonky Feed", "mathematics_1")
    const feedRanks = getSkillRankValues("Chonky Feed", "mathematics_2")
    const xpMult = xpRanks[chonkyRank - 1] ?? 2
    const feedMult = feedRanks[chonkyRank - 1] ?? 1.5
    foodXpMultiplier *= xpMult
    foodMultiplier *= feedMult
    activeBoosts.push({
      name: "Chonky Feed",
      value: `${xpMult}x XP / x${feedMult} feed`,
      source: "skill",
    })
  }

  if (hasActiveBuff(state, "Pig Onesie", "587")) {
    foodXpMultiplier *= PIG_ONESIE_XP_MULTIPLIER
    activeBoosts.push({ name: "Pig Onesie", value: "x1.05 XP", source: "wearable" })
  }

  // Kale Mix (cambia la receta de Mixed Grain por 3 / 2.5 / 2 Kale)
  const kaleRank = getSkillRankFromState(state, "Kale Mix")
  let kaleMixAmount: number | null = null
  if (kaleRank > 0) {
    const kaleRanks = getSkillRankValues("Kale Mix")
    kaleMixAmount = kaleRanks[kaleRank - 1] ?? 3
    activeBoosts.push({ name: "Kale Mix", value: `${kaleMixAmount} Kale`, source: "skill" })
  }

  // 2. Afecto diario (Multiplicador primero, bonos planos después)
  let affectionMultiplier = 1
  let affectionFlatBonus = 0
  const heartRank = getSkillRankFromState(state, "Heartwarming Instruments")
  if (heartRank > 0) {
    const heartRanks = getSkillRankValues("Heartwarming Instruments")
    const pctBonus = heartRanks[heartRank - 1] ?? 0.5
    affectionMultiplier += pctBonus
    activeBoosts.push({
      name: "Heartwarming Instruments",
      value: `+${Math.round(pctBonus * 100)}%`,
      source: "skill",
    })
  }
  if (isCow && hasActiveBuff(state, "Baby Cow", "2525")) {
    affectionFlatBonus += 10
    activeBoosts.push({ name: "Baby Cow", value: "+10 XP", source: "collectible" })
  }
  if (isSheep && hasActiveBuff(state, "Spa Sheep", "2999")) {
    affectionFlatBonus += 5
    activeBoosts.push({ name: "Spa Sheep", value: "+5 XP", source: "collectible" })
  }

  // 3. Tiempo de Sueño (Fijo -2h primero, multiplicadores permanentes, shrines live al final)
  let sleepSubtractHours = 0
  let sleepMultiplier = 1
  let shrineSpeedMultiplier = 1

  if (isChicken) {
    if (hasActiveBuff(state, "El Pollo Veloz", "470")) {
      sleepSubtractHours += 2
      activeBoosts.push({ name: "El Pollo Veloz", value: "-2h", source: "collectible" })
    }
    if (hasActiveBuff(state, "Speed Chicken", "610")) {
      sleepMultiplier *= 0.9
      activeBoosts.push({ name: "Speed Chicken", value: "x0.9", source: "collectible" })
    }
    if (hasActiveBuff(state, "Janitor Chicken", "2528")) {
      sleepMultiplier *= 0.95
      activeBoosts.push({ name: "Janitor Chicken", value: "x0.95", source: "collectible" })
    }
    if (hasActiveBuff(state, "Flamingo Chicken", "2996")) {
      sleepMultiplier *= 0.975
      activeBoosts.push({ name: "Flamingo Chicken", value: "x0.975", source: "collectible" })
    }
    if (hasActiveBuff(state, "Bantam Shrine", "9033")) {
      shrineSpeedMultiplier *= 1.35
    }
  } else if (isSheep) {
    if (hasActiveBuff(state, "Dream Scarf")) {
      sleepMultiplier *= 0.8
      activeBoosts.push({ name: "Dream Scarf", value: "x0.8", source: "wearable" })
    }
    if (hasActiveBuff(state, "Farm Dog", "406")) {
      sleepMultiplier *= 0.75
      activeBoosts.push({ name: "Farm Dog", value: "x0.75", source: "collectible" })
    }
    if (hasActiveBuff(state, "Beetle Sheep", "3056")) {
      sleepMultiplier *= 0.925
      activeBoosts.push({ name: "Beetle Sheep", value: "x0.925", source: "collectible" })
    }
    if (hasActiveBuff(state, "Collie Shrine", "9032")) {
      shrineSpeedMultiplier *= 1.35
    }
  } else if (isCow) {
    if (hasActiveBuff(state, "Mammoth", "2191")) {
      sleepMultiplier *= 0.75
      activeBoosts.push({ name: "Mammoth", value: "x0.75", source: "collectible" })
    }
    if (hasActiveBuff(state, "Ascended Cow", "3034")) {
      sleepMultiplier *= 0.975
      activeBoosts.push({ name: "Ascended Cow", value: "x0.975", source: "collectible" })
    }
    if (hasActiveBuff(state, "Collie Shrine", "9032")) {
      shrineSpeedMultiplier *= 1.35
    }
  }

  if (hasActiveBuff(state, "Wrangler", "9031")) {
    sleepMultiplier *= 0.9
    activeBoosts.push({ name: "Wrangler", value: "x0.9", source: "other" })
  }

  const restlessRank = getSkillRankFromState(state, "Restless Animals")
  if (restlessRank > 0) {
    const restlessRanks = getSkillRankValues("Restless Animals")
    const val = restlessRanks[restlessRank - 1] ?? 0.9
    sleepMultiplier *= val
    activeBoosts.push({ name: "Restless Animals", value: `x${val}`, source: "skill" })
  }

  // 4. Producción / Drops (Multiplicadores sobre base + sumas/restas planas después)
  let primaryMultiplier = 1
  let primaryFlatBonus = 0
  let secondaryMultiplier = 1
  let secondaryFlatBonus = 0

  // Bonos universales de producción animal
  if (hasActiveBuff(state, "Cattlegrim", "164")) {
    primaryFlatBonus += 0.25
    if (!isPig) secondaryFlatBonus += 0.25
    activeBoosts.push({ name: "Cattlegrim", value: "+0.25", source: "wearable" })
  }
  if (hasActiveBuff(state, "Barn Manager", "9030")) {
    primaryFlatBonus += 0.1
    if (!isPig) secondaryFlatBonus += 0.1
    activeBoosts.push({ name: "Barn Manager", value: "+0.1", source: "other" })
  }

  // Abundant Harvest: +0.2 / +0.35 / +0.5 a Egg, Wool y Milk
  const abundantRank = getSkillRankFromState(state, "Abundant Harvest")
  const abundantVal =
    abundantRank > 0 ? (getSkillRankValues("Abundant Harvest")[abundantRank - 1] ?? 0.2) : 0
  if (abundantRank > 0 && (isChicken || isSheep || isCow)) {
    primaryFlatBonus += abundantVal
    activeBoosts.push({ name: "Abundant Harvest", value: `+${abundantVal}`, source: "skill" })
  }

  // Bale + Double Bale + Bale Economy
  const hasBale = hasActiveBuff(state, "Bale", "3055")
  const doubleBaleRank = getSkillRankFromState(state, "Double Bale")
  const hasBaleEconomy = getSkillRankFromState(state, "Bale Economy") > 0
  if (hasBale) {
    const dblMult =
      doubleBaleRank > 0 ? (getSkillRankValues("Double Bale")[doubleBaleRank - 1] ?? 2) : 1
    const baleAmt = roundExact(0.1 * dblMult, 2)
    if (isChicken || ((isSheep || isCow) && hasBaleEconomy)) {
      primaryFlatBonus += baleAmt
      activeBoosts.push({
        name: doubleBaleRank ? "Double Bale" : "Bale",
        value: `+${baleAmt}`,
        source: "collectible",
      })
    }
  }

  // Fibras secundarias (Feather, Merino Wool, Leather)
  if (!isPig) {
    const fineFibersRank = getSkillRankFromState(state, "Fine Fibers")
    if (fineFibersRank > 0) {
      const val = getSkillRankValues("Fine Fibers")[fineFibersRank - 1] ?? 0.1
      secondaryFlatBonus += val
      activeBoosts.push({ name: "Fine Fibers", value: `+${val}`, source: "skill" })
    }

    const fibreSkills: Array<{ skill: string; owner: AnimalId }> = [
      { skill: "Featherweight", owner: "chicken" },
      { skill: "Merino Whisperer", owner: "sheep" },
      { skill: "Leathercraft Mastery", owner: "cow" },
    ]
    for (const fs of fibreSkills) {
      const rank = getSkillRankFromState(state, fs.skill)
      if (!rank) continue
      const isFav = fs.owner === animalId
      const ranks = getSkillRankValues(fs.skill, isFav ? "mathematics_1" : "mathematics_2")
      const val = ranks[rank - 1] ?? (isFav ? 0.35 : 0.1)
      if (isFav) {
        secondaryFlatBonus += val
        activeBoosts.push({ name: fs.skill, value: `+${val}`, source: "skill" })
      } else {
        secondaryFlatBonus -= val
        activeBoosts.push({ name: fs.skill, value: `-${val}`, source: "skill" })
      }
    }
  }

  // Específicos por especie
  if (isChicken) {
    // Egg
    if (hasActiveBuff(state, "Chicken Coop", "408")) {
      primaryFlatBonus += 1
      activeBoosts.push({ name: "Chicken Coop", value: "+1 Egg", source: "collectible" })
    }
    if (hasActiveBuff(state, "Rich Chicken", "612")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Rich Chicken", value: "+0.1 Egg", source: "collectible" })
    }
    if (hasActiveBuff(state, "Undead Rooster", "1114")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Undead Rooster", value: "+0.1 Egg", source: "collectible" })
    }
    if (hasActiveBuff(state, "Ayam Cemani", "445")) {
      primaryFlatBonus += 0.2
      activeBoosts.push({ name: "Ayam Cemani", value: "+0.2 Egg", source: "collectible" })
    }
    if (hasActiveBuff(state, "Squid Chicken", "2538")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Squid Chicken", value: "+0.1 Egg", source: "collectible" })
    }
    if (hasActiveBuff(state, "Ascended Chicken", "3033")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Ascended Chicken", value: "+0.1 Egg", source: "collectible" })
    }
    // Feather
    if (hasActiveBuff(state, "Chicken Suit")) {
      secondaryFlatBonus += 1
      activeBoosts.push({ name: "Chicken Suit", value: "+1 Feather", source: "wearable" })
    }
    if (hasActiveBuff(state, "Alien Chicken", "2162")) {
      secondaryFlatBonus += 0.1
      activeBoosts.push({ name: "Alien Chicken", value: "+0.1 Feather", source: "collectible" })
    }
  } else if (isSheep) {
    // Wool
    if (hasActiveBuff(state, "Black Sheep Onesie", "402")) {
      primaryFlatBonus += 2
      activeBoosts.push({ name: "Black Sheep Onesie", value: "+2 Wool", source: "wearable" })
    }
    if (hasActiveBuff(state, "White Sheep Onesie", "401")) {
      primaryFlatBonus += 0.25
      activeBoosts.push({ name: "White Sheep Onesie", value: "+0.25 Wool", source: "wearable" })
    }
    if (hasActiveBuff(state, "Astronaut Sheep", "2532")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Astronaut Sheep", value: "+0.1 Wool", source: "collectible" })
    }
    if (hasActiveBuff(state, "Ascended Sheep", "3035")) {
      primaryFlatBonus += 0.05
      activeBoosts.push({ name: "Ascended Sheep", value: "+0.05 Wool", source: "collectible" })
    }
    // Merino Wool
    if (hasActiveBuff(state, "Merino Jumper", "405")) {
      secondaryFlatBonus += 1
      activeBoosts.push({ name: "Merino Jumper", value: "+1 Merino", source: "wearable" })
    }
    if (hasActiveBuff(state, "Toxic Tuft", "2164")) {
      secondaryFlatBonus += 0.1
      activeBoosts.push({ name: "Toxic Tuft", value: "+0.1 Merino", source: "collectible" })
    }
  } else if (isCow) {
    // Milk
    if (hasActiveBuff(state, "Longhorn Cowfish", "1540")) {
      primaryFlatBonus += 0.2
      activeBoosts.push({ name: "Longhorn Cowfish", value: "+0.2 Milk", source: "collectible" })
    }
    if (hasActiveBuff(state, "Spa Cow", "2998")) {
      primaryFlatBonus += 0.1
      activeBoosts.push({ name: "Spa Cow", value: "+0.1 Milk", source: "collectible" })
    }
    if (hasActiveBuff(state, "Milk Apron")) {
      primaryFlatBonus += 0.5
      activeBoosts.push({ name: "Milk Apron", value: "+0.5 Milk", source: "wearable" })
    }
    if (hasActiveBuff(state, "Cowbell Necklace")) {
      primaryFlatBonus += 2
      activeBoosts.push({ name: "Cowbell Necklace", value: "+2 Milk", source: "wearable" })
    }
    // Leather
    if (hasActiveBuff(state, "Moo-ver", "2155")) {
      secondaryFlatBonus += 0.25
      activeBoosts.push({ name: "Moo-ver", value: "+0.25 Leather", source: "collectible" })
    }
    if (hasActiveBuff(state, "Mootant", "2163")) {
      secondaryFlatBonus += 0.1
      activeBoosts.push({ name: "Mootant", value: "+0.1 Leather", source: "collectible" })
    }
    if (hasActiveBuff(state, "Training Whistle", "501")) {
      secondaryFlatBonus += 1
      activeBoosts.push({ name: "Training Whistle", value: "+1 Leather", source: "wearable" })
    }
  } else if (isPig) {
    const truffleRank = getSkillRankFromState(state, "Truffle Yield")
    if (truffleRank > 0) {
      const val = getSkillRankValues("Truffle Yield")[truffleRank - 1] ?? 1.1
      primaryMultiplier *= val
      activeBoosts.push({ name: "Truffle Yield", value: `x${val}`, source: "skill" })
    }
  }

  // Vibraphone (2x cosechas por treat / Mud)
  const vibraphoneMultiplier = hasActiveBuff(state, "Vibraphone", "3053") ? 2 : 1
  if (vibraphoneMultiplier === 2) {
    activeBoosts.push({ name: "Vibraphone", value: "2x treats", source: "collectible" })
  }

  const baseHours = ANIMALS[animalId]?.sleepDurationHours || 24
  const sleepHoursBase = Math.max(
    0,
    roundExact(((baseHours - sleepSubtractHours) * sleepMultiplier) / shrineSpeedMultiplier, 2),
  )

  const auto = {
    foodMultiplier: roundExact(foodMultiplier, 4),
    foodXpMultiplier: roundExact(foodXpMultiplier, 4),
    affectionMultiplier: roundExact(affectionMultiplier, 4),
    affectionFlatBonus: roundExact(affectionFlatBonus, 2),
    primaryMultiplier: roundExact(primaryMultiplier, 4),
    primaryFlatBonus: roundExact(primaryFlatBonus, 2),
    secondaryMultiplier: roundExact(secondaryMultiplier, 4),
    secondaryFlatBonus: roundExact(secondaryFlatBonus, 2),
    sleepSubtractHours,
    sleepMultiplier: roundExact(sleepMultiplier, 4),
    shrineSpeedMultiplier,
    isFreeFeed,
    freeFeedSource,
    kaleMixAmount,
    vibraphoneMultiplier,
  }

  const hasOverrides = {
    food: manualBoosts?.food !== null && manualBoosts?.food !== undefined,
    foodXp: manualBoosts?.foodXp !== null && manualBoosts?.foodXp !== undefined,
    careMultiplier:
      manualBoosts?.careMultiplier !== null && manualBoosts?.careMultiplier !== undefined,
    primaryDrop: manualBoosts?.primaryDrop !== null && manualBoosts?.primaryDrop !== undefined,
    secondaryDrop:
      manualBoosts?.secondaryDrop !== null && manualBoosts?.secondaryDrop !== undefined,
  }

  return {
    animalId,
    auto,
    effective: {
      foodMultiplier: hasOverrides.food
        ? Math.max(0, Number(manualBoosts!.food))
        : auto.foodMultiplier,
      foodXpMultiplier: hasOverrides.foodXp
        ? Math.max(0.1, Number(manualBoosts!.foodXp))
        : auto.foodXpMultiplier,
      affectionMultiplier: hasOverrides.careMultiplier
        ? Math.max(0, Number(manualBoosts!.careMultiplier))
        : auto.affectionMultiplier,
      affectionFlatBonus: auto.affectionFlatBonus,
      primaryMultiplier: auto.primaryMultiplier,
      primaryFlatBonus: hasOverrides.primaryDrop
        ? Number(manualBoosts!.primaryDrop)
        : auto.primaryFlatBonus,
      secondaryMultiplier: auto.secondaryMultiplier,
      secondaryFlatBonus: hasOverrides.secondaryDrop
        ? Number(manualBoosts!.secondaryDrop)
        : auto.secondaryFlatBonus,
      sleepHoursBase,
      isFreeFeed: hasOverrides.food ? Number(manualBoosts!.food) === 0 : auto.isFreeFeed,
      freeFeedSource: hasOverrides.food ? null : auto.freeFeedSource,
      kaleMixAmount: auto.kaleMixAmount,
      vibraphoneMultiplier: auto.vibraphoneMultiplier,
    },
    hasOverrides,
    activeBoosts,
  }
}

// ---------------------------------------------------------------------------
// Costos de Alimentos, Slops, Treats y Escarabajos
// ---------------------------------------------------------------------------

export function resolveAnimalItemCostFlower(
  name: string,
  marketPrices: Record<string, number>,
  flowerUsd: number,
  bettyRatio: number,
  userState?: SflUserGameState | null,
  customResolver?: (n: string) => number,
): { cost: number; priceSource: "p2p" | "craft" } {
  const custom = customResolver ? customResolver(name) : 0
  if (custom > 0) return { cost: custom, priceSource: "p2p" }

  const p2p = marketPrices[name] ?? getItemPrice(name) ?? 0
  if (p2p > 0) return { cost: p2p, priceSource: "p2p" }

  const res = resolveCost(name, {
    flowerPriceUsd: flowerUsd,
    coinsPerFlower: bettyRatio,
    resolveBasePrice: (item) => marketPrices[item] ?? getItemPrice(item) ?? 0,
    userState: userState || null,
  })
  const craftCost = res.craftCostFlower > 0 ? res.craftCostFlower : res.marketPriceFlower
  return { cost: craftCost, priceSource: "craft" }
}

export function getTreatUnitPrices(
  marketPrices: Record<string, number>,
  flowerUsd: number,
  bettyRatio: number,
  userState?: SflUserGameState | null,
): {
  honeyTreatFlower: number
  saltLickFlower: number
  truffleSeasoningFlower: number
  mudBathFlower: number
} {
  const resolveMat = (n: string) => marketPrices[n] ?? getItemPrice(n) ?? 0
  const honeyTreatFlower = getHoneyTreatPrice(resolveMat)
  const saltLickFlower = getSaltLickPrice(resolveMat)
  const truffleSeasoningFlower = getTruffleSeasoningPrice(resolveMat)
  const mudUnit = resolveAnimalItemCostFlower(
    "Mud",
    marketPrices,
    flowerUsd,
    bettyRatio,
    userState,
  ).cost
  const mudBathFlower = mudUnit * MUD_PER_APPLICATION

  return {
    honeyTreatFlower,
    saltLickFlower,
    truffleSeasoningFlower,
    mudBathFlower,
  }
}

/**
 * Evalua TODAS las opciones de alimento elegibles para `(animalId, fromLevel)`
 * tomando en cuenta `Kale Mix`, `Pig Onesie`, `Chonky Feed`, `Mud` y la inmunidad
 * oficial de Escarabajos a modifiers de alimentación/XP (salvo `Mud` en Cerdo).
 */
export function getFoodOptionsForLevel(
  animalId: AnimalId,
  fromLevel: number,
  options: {
    marketPrices: Record<string, number>
    flowerPriceUsd: number
    coinsPerFlower: number
    modifiers: ResolvedAnimalModifiers["effective"]
    hasHoneyTreat?: boolean
    mudActive?: boolean
    userState?: SflUserGameState | null
    customUnitPriceResolver?: (name: string) => number
  },
): { optimal: FoodCandidate; options: FoodCandidate[] } {
  const {
    marketPrices,
    flowerPriceUsd,
    coinsPerFlower,
    modifiers,
    hasHoneyTreat = false,
    mudActive = false,
    userState,
    customUnitPriceResolver,
  } = options

  const candidates: FoodCandidate[] = []
  const reqQty = REQUIRED_FOOD_QTY[animalId] || 1
  const resolveP2P = (n: string) =>
    (customUnitPriceResolver ? customUnitPriceResolver(n) : 0) ||
    marketPrices[n] ||
    getItemPrice(n) ||
    0

  const effectiveFoodMult = modifiers.isFreeFeed
    ? 0
    : modifiers.foodMultiplier * (hasHoneyTreat ? HONEY_TREAT_FEED_MULTIPLIER : 1)

  const pigMudMult = animalId === "pig" && mudActive ? MUD_XP_MULTIPLIER : 1

  if (animalId === "pig") {
    const preferredSlopId = getPreferredSlopIdForLevel(fromLevel)
    for (const slopId of SLOP_TIERS) {
      const consumable = ANIMAL_CONSUMABLES[slopId]
      const slopOpts = consumable?.options || []
      const baseXp = getBaseFoodXp("pig", fromLevel, slopId)
      const effectiveXp = roundExact(baseXp * modifiers.foodXpMultiplier * pigMudMult, 4)

      let bestSlopCandidate: FoodCandidate | null = null
      for (const opt of slopOpts) {
        const { cost: unitPrice, priceSource } = resolveAnimalItemCostFlower(
          opt.name,
          marketPrices,
          flowerPriceUsd,
          coinsPerFlower,
          userState,
          customUnitPriceResolver,
        )
        if (unitPrice <= 0) continue

        const unitSlopCost = unitPrice * opt.amount
        const effectivePerFeed = roundExact(1 * effectiveFoodMult, 4)
        const costPerFeed = unitSlopCost * effectivePerFeed

        const candidate: FoodCandidate = {
          id: `${slopId}_${opt.name}`,
          name: consumable?.name || slopId,
          displayName: `${consumable?.name || slopId} (${opt.name})`,
          image: consumable?.image || `/img/sunflowerland/animals/${slopId}.webp`,
          ingredient: `${opt.amount}x ${opt.name}`,
          ingredientImage: opt.image,
          ingredientName: opt.name,
          ingredientAmount: opt.amount,
          priceSource,
          ingredientsList: [{ name: opt.name, amount: opt.amount }],
          baseXp,
          effectiveXp,
          xp: effectiveXp,
          unitCostFlower: unitSlopCost,
          requiredPerFeed: 1,
          effectivePerFeed,
          costPerFeed,
          costPerXp: effectiveXp > 0 ? costPerFeed / effectiveXp : Infinity,
          isBeetle: false,
          isOmnifeed: false,
          isFree: modifiers.isFreeFeed,
          isFav: slopId === preferredSlopId,
          isOptimal: false,
        }

        // Incluir todas las opciones válidas del tier favorito y la mejor de tiers secundarios
        if (slopId === preferredSlopId) {
          candidates.push(candidate)
        } else if (!bestSlopCandidate || candidate.costPerFeed < bestSlopCandidate.costPerFeed) {
          bestSlopCandidate = candidate
        }
      }

      if (bestSlopCandidate) {
        candidates.push(bestSlopCandidate)
      }
    }

    if (candidates.length === 0) {
      const fallbackDef = ANIMAL_CONSUMABLES[preferredSlopId]
      const baseXp = getBaseFoodXp("pig", fromLevel, preferredSlopId)
      const effectiveXp = roundExact(baseXp * modifiers.foodXpMultiplier * pigMudMult, 4)
      candidates.push({
        id: preferredSlopId,
        name: fallbackDef?.name || "Slop",
        displayName: fallbackDef?.name || "Slop",
        image: fallbackDef?.image || `/img/sunflowerland/animals/${preferredSlopId}.webp`,
        ingredient: "150x Potato",
        ingredientImage: "/img/sunflowerland/Potato.png",
        ingredientName: "Potato",
        ingredientAmount: 150,
        priceSource: "p2p",
        ingredientsList: [{ name: "Potato", amount: 150 }],
        baseXp,
        effectiveXp,
        xp: effectiveXp,
        unitCostFlower: 0.0346,
        requiredPerFeed: 1,
        effectivePerFeed: effectiveFoodMult,
        costPerFeed: 0.0346 * effectiveFoodMult,
        costPerXp: (0.0346 * effectiveFoodMult) / effectiveXp,
        isBeetle: false,
        isOmnifeed: false,
        isFree: modifiers.isFreeFeed,
        isFav: true,
        isOptimal: false,
      })
    }
  } else {
    // Chicken, Cow, Sheep
    const cornPrice = resolveP2P("Corn") || 0.02
    const wheatPrice = resolveP2P("Wheat") || 0.01598
    const barleyPrice = resolveP2P("Barley") || 0.02285
    const kalePrice = resolveP2P("Kale") || 0.045

    const mixedIsKale = modifiers.kaleMixAmount !== null && modifiers.kaleMixAmount > 0
    const kaleQty = modifiers.kaleMixAmount || 3
    const mixedUnitPrice = mixedIsKale ? kalePrice * kaleQty : cornPrice + wheatPrice + barleyPrice
    const mixedIngredientLabel = mixedIsKale
      ? `${roundExact(reqQty * kaleQty, 2)}x Kale`
      : `${reqQty}x Corn, ${reqQty}x Wheat, ${reqQty}x Barley`
    const mixedIngredientsList = mixedIsKale
      ? [{ name: "Kale", amount: kaleQty }]
      : [
          { name: "Corn", amount: 1 },
          { name: "Wheat", amount: 1 },
          { name: "Barley", amount: 1 },
        ]

    const grainsDef = [
      {
        id: "kernel_blend",
        name: "Kernel Blend",
        image: "/img/sunflowerland/animals/kernel_blend.webp",
        ingredient: `${reqQty}x Corn`,
        ingredientsList: [{ name: "Corn", amount: 1 }],
        unitPrice: cornPrice,
        isFav: fromLevel <= 2,
      },
      {
        id: "hay",
        name: "Hay",
        image: "/img/sunflowerland/animals/hay.webp",
        ingredient: `${reqQty}x Wheat`,
        ingredientsList: [{ name: "Wheat", amount: 1 }],
        unitPrice: wheatPrice,
        isFav: fromLevel >= 3 && fromLevel <= 5,
      },
      {
        id: "nutribarley",
        name: "NutriBarley",
        image: "/img/sunflowerland/animals/nutri_barley.webp",
        ingredient: `${reqQty}x Barley`,
        ingredientsList: [{ name: "Barley", amount: 1 }],
        unitPrice: barleyPrice,
        isFav: fromLevel >= 6 && fromLevel <= 9,
      },
      {
        id: "mixed_grain",
        name: "Mixed Grain",
        image: "/img/sunflowerland/animals/mixed_grain.webp",
        ingredient: mixedIngredientLabel,
        ingredientsList: mixedIngredientsList,
        unitPrice: mixedUnitPrice,
        isFav: fromLevel >= 10,
      },
    ]

    for (const g of grainsDef) {
      const baseXp = getBaseFoodXp(animalId, fromLevel, g.id)
      const effectiveXp = roundExact(baseXp * modifiers.foodXpMultiplier, 4)
      const effectivePerFeed = roundExact(reqQty * effectiveFoodMult, 4)
      const costPerFeed = modifiers.isFreeFeed ? 0 : effectivePerFeed * g.unitPrice
      candidates.push({
        id: g.id,
        name: g.name,
        displayName: g.name,
        image: g.image,
        ingredient: g.ingredient,
        priceSource: "p2p",
        ingredientsList: g.ingredientsList,
        baseXp,
        effectiveXp,
        xp: effectiveXp,
        unitCostFlower: g.unitPrice,
        requiredPerFeed: reqQty,
        effectivePerFeed,
        costPerFeed,
        costPerXp: effectiveXp > 0 ? costPerFeed / effectiveXp : Infinity,
        isBeetle: false,
        isOmnifeed: false,
        isFree: modifiers.isFreeFeed,
        isFav: g.isFav,
        isOptimal: false,
      })
    }

    // Omnifeed (Chicken, Cow, Sheep) — sujeto a Chonky Feed / dieta / Honey Treat igual que granos en getBoostedFoodQuantity
    const gemUsd = calculateGemCostUsd(1).unitUsd
    const gemFlowerPrice = flowerPriceUsd > 0 ? gemUsd / flowerPriceUsd : 0
    if (gemFlowerPrice > 0) {
      const baseXp = getBaseFoodXp(animalId, fromLevel, "omnifeed")
      const effectiveXp = roundExact(baseXp * modifiers.foodXpMultiplier, 4)
      const effectivePerFeed = roundExact(reqQty * effectiveFoodMult, 4)
      const costPerFeed = modifiers.isFreeFeed ? 0 : effectivePerFeed * gemFlowerPrice
      const omniDef = ANIMAL_CONSUMABLES.omnifeed

      candidates.push({
        id: "omnifeed",
        name: omniDef?.name || "Omnifeed",
        displayName: "Omnifeed",
        image: omniDef?.image || "/img/sunflowerland/animals/omnifeed.webp",
        ingredient: `${reqQty}x Gem`,
        priceSource: "gem",
        ingredientsList: [{ name: "Gem", amount: 1 }],
        baseXp,
        effectiveXp,
        xp: effectiveXp,
        unitCostFlower: gemFlowerPrice,
        requiredPerFeed: reqQty,
        effectivePerFeed,
        costPerFeed,
        costPerXp: effectiveXp > 0 ? costPerFeed / effectiveXp : Infinity,
        isBeetle: false,
        isOmnifeed: true,
        isFree: modifiers.isFreeFeed,
        isFav: true,
        isOptimal: false,
      })
    }
  }

  // Escarabajos: Ración siempre = 1, inmunes a buffs/debuffs de comida y Chonky/Pig Onesie; solo Mud x1.25 aplica en Cerdos
  for (const b of BEETLES_LIST) {
    const price = resolveP2P(b.name)
    if (price > 0) {
      const baseXp = b.xp
      const effectiveXp = roundExact(baseXp * pigMudMult, 4)
      const costPerFeed = modifiers.isFreeFeed ? 0 : price
      candidates.push({
        id: b.id,
        name: b.name,
        displayName: b.name,
        image: b.img,
        ingredient: "Beetle P2P",
        priceSource: "p2p",
        ingredientsList: [{ name: b.name, amount: 1 }],
        baseXp,
        effectiveXp,
        xp: effectiveXp,
        unitCostFlower: price,
        requiredPerFeed: 1,
        effectivePerFeed: modifiers.isFreeFeed ? 0 : 1,
        costPerFeed,
        costPerXp: effectiveXp > 0 ? costPerFeed / effectiveXp : Infinity,
        isBeetle: true,
        isOmnifeed: false,
        isFree: modifiers.isFreeFeed,
        isFav: true,
        isOptimal: false,
      })
    }
  }

  candidates.sort((a, b) => a.costPerXp - b.costPerXp || b.effectiveXp - a.effectiveXp)
  const optimal = candidates[0]
  if (optimal) optimal.isOptimal = true

  return { optimal, options: candidates }
}

// ---------------------------------------------------------------------------
// Motor Completo de Progresión 0 → 15 por Especie
// ---------------------------------------------------------------------------

interface PrecomputedLevelStep {
  toLvl: number
  fromLvl: number
  xpReq: number
  isInstant: boolean
  activeTreatHere: AnimalTreatType | null
  treatStartsHere: boolean
  hasSaltLick: boolean
  hasTruffleSeasoning: boolean
  sleepHours: number
  loveProb: LoveProbabilities
  affectionTools: AffectionToolItem[]
  affectionXp: number
  rawOptions: FoodCandidate[]
  forcedFood?: FoodCandidate
  treatCostFlower: number
  mudAppliesHere: boolean
  mudCostFlower: number
}

interface DpRouteNode {
  residualXp: number
  totalCost: number
  lastSurplus: number
  rankScore: number
  chosenFoodId: string
  parentIdx: number
}

function solveOptimalFoodRoute(
  steps: PrecomputedLevelStep[],
  startIdx: number,
  endIdx: number,
  initialCarryover: number,
  isFreeFeedMode: boolean,
  ignoreForcedOnFirstStep: boolean = false,
): string[] {
  if (startIdx > endIdx || startIdx < 0 || endIdx >= steps.length) return []

  let frontier: Array<{ residualXp: number; totalCost: number; rankScore: number }> = [
    {
      residualXp: roundExact(Math.max(0, initialCarryover), 2),
      totalCost: 0,
      rankScore: 0,
    },
  ]
  const layers: DpRouteNode[][] = []

  const getRankScore = (cand: FoodCandidate, neededFeeds: number): number => {
    const favPenalty = cand.isFav ? 0 : 1000
    const nonGrainWhenZeroPenalty =
      (neededFeeds === 0 || isFreeFeedMode) && (cand.isBeetle || cand.isOmnifeed) ? 5000 : 0
    return (
      nonGrainWhenZeroPenalty +
      favPenalty +
      (Number.isFinite(cand.costPerXp) ? cand.costPerXp : 999)
    )
  }

  const calcStepOutcome = (
    step: PrecomputedLevelStep,
    parentResidual: number,
    cand: FoodCandidate,
  ) => {
    const neededFromFood = Math.max(
      0,
      roundExact(step.xpReq - parentResidual - step.affectionXp, 4),
    )
    const unitFoodXp = Math.max(0.01, cand.effectiveXp)
    const neededFeeds = neededFromFood > 0 ? Math.ceil(neededFromFood / unitFoodXp - 1e-9) : 0
    const stepCost =
      cand.isFree || isFreeFeedMode
        ? 0
        : cand.isBeetle
          ? neededFeeds * cand.unitCostFlower
          : neededFeeds * cand.effectivePerFeed * cand.unitCostFlower
    const totalFoodXp = roundExact(neededFeeds * unitFoodXp, 2)
    const totalAvailable = roundExact(parentResidual + step.affectionXp + totalFoodXp, 2)
    const nextResidual = Math.max(0, roundExact(totalAvailable - step.xpReq, 2))
    return { stepCost, nextResidual, neededFeeds }
  }

  for (let idx = startIdx; idx <= endIdx; idx++) {
    const step = steps[idx]
    const useForced = step.forcedFood && !(ignoreForcedOnFirstStep && idx === startIdx)
    const allowed = useForced ? [step.forcedFood!] : step.rawOptions
    const byResidual = new Map<number, DpRouteNode>()

    for (let pIdx = 0; pIdx < frontier.length; pIdx++) {
      const parent = frontier[pIdx]
      for (const cand of allowed) {
        const { stepCost, nextResidual, neededFeeds } = calcStepOutcome(
          step,
          parent.residualXp,
          cand,
        )
        const totalCost = parent.totalCost + stepCost
        const rankScore = parent.rankScore + getRankScore(cand, neededFeeds)
        const existing = byResidual.get(nextResidual)

        if (
          !existing ||
          totalCost < existing.totalCost - 1e-8 ||
          (Math.abs(totalCost - existing.totalCost) <= 1e-8 &&
            rankScore < existing.rankScore - 1e-8)
        ) {
          byResidual.set(nextResidual, {
            residualXp: nextResidual,
            totalCost,
            lastSurplus: nextResidual,
            rankScore,
            chosenFoodId: cand.id,
            parentIdx: pIdx,
          })
        }
      }
    }

    let nextNodes = Array.from(byResidual.values())
    if (idx < endIdx && !isFreeFeedMode) {
      // Poda Pareto: con mayor o igual XP residual solo interesan rutas estrictamente más baratas
      nextNodes.sort(
        (a, b) =>
          b.residualXp - a.residualXp || a.totalCost - b.totalCost || a.rankScore - b.rankScore,
      )
      const pruned: DpRouteNode[] = []
      let minCostSeen = Infinity
      for (const node of nextNodes) {
        if (node.totalCost < minCostSeen - 1e-8) {
          pruned.push(node)
          minCostSeen = node.totalCost
        }
      }
      nextNodes = pruned
    } else if (idx < endIdx && isFreeFeedMode && nextNodes.length > 64) {
      nextNodes.sort((a, b) => a.rankScore - b.rankScore || a.lastSurplus - b.lastSurplus)
      nextNodes = nextNodes.slice(0, 64)
    }

    layers.push(nextNodes)
    frontier = nextNodes.map((n) => ({
      residualXp: n.residualXp,
      totalCost: n.totalCost,
      rankScore: n.rankScore,
    }))
  }

  // En el nivel final del tramo, el excedente vale 0: elegir menor costo total (y menor sobrante ante empate)
  const finalLayer = layers[layers.length - 1]
  if (!finalLayer || finalLayer.length === 0) return []

  let bestIdx = 0
  for (let i = 1; i < finalLayer.length; i++) {
    const a = finalLayer[i]
    const b = finalLayer[bestIdx]
    if (
      a.totalCost < b.totalCost - 1e-6 ||
      (Math.abs(a.totalCost - b.totalCost) <= 1e-6 &&
        (a.lastSurplus < b.lastSurplus - 1e-6 ||
          (Math.abs(a.lastSurplus - b.lastSurplus) <= 1e-6 && a.rankScore < b.rankScore)))
    ) {
      bestIdx = i
    }
  }

  const chosenIds: string[] = new Array(endIdx - startIdx + 1)
  let cursor = bestIdx
  for (let layerIdx = layers.length - 1; layerIdx >= 0; layerIdx--) {
    const node = layers[layerIdx][cursor]
    chosenIds[layerIdx] = node.chosenFoodId
    cursor = node.parentIdx
  }
  return chosenIds
}

/**
 * Calcula toda la progresión de 15 niveles (0→1 .. 14→15) para una especie,
 * aplicando todas las reglas oficiales de Sunflower Land y minimizando el costo
 * total de la ruta hasta `targetLevel` mediante programación dinámica.
 */
export function calculateAnimalProgression(
  animalId: AnimalId,
  ctx: AnimalCalculationContext = {},
): AnimalProgressionResult {
  const rawAnimal = ANIMALS[animalId]
  const rawBuilding = ANIMAL_BUILDINGS[rawAnimal.buildingId]
  const marketState = getState()
  const marketPrices = ctx.marketPrices || {}
  const flowerUsd = ctx.flowerPriceUsd || marketState.flowerPrice || 0.144
  const bettyRatio = ctx.coinsPerFlower || marketState.bettyRatio || OFFICIAL_COINS_PER_FLOWER

  const modifiers = resolveAnimalModifiers(animalId, ctx.userState, ctx.manualBoosts)
  const eff = modifiers.effective

  const targetLevel = Math.max(1, Math.min(15, ctx.targetLevel ?? 15))
  const treatType: AnimalTreatType = ctx.treatType || "honey_treat"
  let mudLevel =
    animalId === "pig" && ctx.mudPigLevel !== undefined && ctx.mudPigLevel !== null
      ? Number(ctx.mudPigLevel)
      : null
  if (mudLevel !== null && (Number.isNaN(mudLevel) || mudLevel < 1 || mudLevel > 15)) {
    mudLevel = null
  }

  // Reglas de duración de treat (Honey Treat / Salt Lick: 3 cosechas × Vibraphone; Truffle Seasoning: 1 sueño × Vibraphone)
  const treatDurationCycles =
    treatType === "truffle_seasoning" ? 1 * eff.vibraphoneMultiplier : 3 * eff.vibraphoneMultiplier

  // Honey Treat no puede aplicarse en 0 > 1 ni sobre animales con Golden asset gratis
  let treatStartLevel =
    ctx.treatStartLevel !== undefined && ctx.treatStartLevel !== null
      ? Number(ctx.treatStartLevel)
      : null
  if (treatStartLevel !== null) {
    if (treatType === "honey_treat" && (treatStartLevel <= 1 || eff.isFreeFeed)) {
      treatStartLevel = null
    } else if (treatStartLevel < 1 || treatStartLevel > 15) {
      treatStartLevel = null
    }
  }

  const treatPrices = getTreatUnitPrices(marketPrices, flowerUsd, bettyRatio, ctx.userState)
  const treatUnitPrice =
    treatType === "honey_treat"
      ? treatPrices.honeyTreatFlower
      : treatType === "salt_lick"
        ? treatPrices.saltLickFlower
        : treatPrices.truffleSeasoningFlower

  const purchaseCostFlower = bettyRatio > 0 ? rawAnimal.purchaseCost.coins / bettyRatio : 0
  const hasFoodManualOverride = Boolean(modifiers.hasOverrides?.food)
  const isFreeFeedMode = Boolean(modifiers.isFreeFeed && !hasFoodManualOverride)

  // Fase 1: Precomputar parámetros y opciones por cada nivel 1..15
  const precomputedSteps: PrecomputedLevelStep[] = rawAnimal.levels.map((lvlObj) => {
    const toLvl = lvlObj.level
    const fromLvl = toLvl - 1
    const xpReq = lvlObj.xpRequired
    const isInstant = fromLvl === 0

    // ¿Qué treat cubre este salto?
    const isTreatWindow =
      treatStartLevel !== null &&
      toLvl >= treatStartLevel &&
      toLvl < treatStartLevel + treatDurationCycles &&
      !(treatType === "honey_treat" && (isInstant || eff.isFreeFeed))

    const activeTreatHere: AnimalTreatType | null = isTreatWindow ? treatType : null
    const treatStartsHere = isTreatWindow && toLvl === treatStartLevel
    const hasHoneyTreat = activeTreatHere === "honey_treat"
    const hasSaltLick = activeTreatHere === "salt_lick"
    const hasTruffleSeasoning = activeTreatHere === "truffle_seasoning"

    // Duración del sueño en este nivel
    const sleepHours = isInstant
      ? 0
      : roundExact(
          eff.sleepHoursBase * (hasTruffleSeasoning ? TRUFFLE_SEASONING_SLEEP_MULTIPLIER : 1),
          2,
        )

    // Probabilidades oficiales de afecto y XP diaria (2x)
    const loveProb = isInstant
      ? { petting: 0, brush: 0, music: 0 }
      : LOVE_REQUESTS[fromLvl] || { petting: 0, brush: 0, music: 0 }

    const applyLoveXp = (baseToolXp: number) =>
      roundExact(baseToolXp * eff.affectionMultiplier + eff.affectionFlatBonus, 2)

    const affectionTools: AffectionToolItem[] = []
    if (!isInstant) {
      if (loveProb.petting > 0) {
        affectionTools.push({
          id: "petting_hand",
          name: "Petting Hand",
          baseXp: LOVE_ITEM_XP.petting_hand,
          xp: applyLoveXp(LOVE_ITEM_XP.petting_hand),
          percent: Math.round(loveProb.petting * 100),
          image: "/img/sunflowerland/tools/Petting Hand.webp",
        })
      }
      if (loveProb.brush > 0) {
        affectionTools.push({
          id: "brush",
          name: "Brush",
          baseXp: LOVE_ITEM_XP.brush,
          xp: applyLoveXp(LOVE_ITEM_XP.brush),
          percent: Math.round(loveProb.brush * 100),
          image: "/img/sunflowerland/tools/Brush.webp",
        })
      }
      if (loveProb.music > 0) {
        affectionTools.push({
          id: "music_box",
          name: "Music Box",
          baseXp: LOVE_ITEM_XP.music_box,
          xp: applyLoveXp(LOVE_ITEM_XP.music_box),
          percent: Math.round(loveProb.music * 100),
          image: "/img/sunflowerland/tools/Music Box.webp",
        })
      }
    }

    const expectedSingleLoveXp = isInstant
      ? 0
      : (loveProb.petting * LOVE_ITEM_XP.petting_hand +
          loveProb.brush * LOVE_ITEM_XP.brush +
          loveProb.music * LOVE_ITEM_XP.music_box) *
          eff.affectionMultiplier +
        eff.affectionFlatBonus

    const affectionXp = isInstant ? 0 : roundExact(expectedSingleLoveXp * MAX_LOVES_PER_SLEEP, 2)

    const mudAppliesHere = animalId === "pig" && mudLevel !== null && toLvl === mudLevel

    // Alimento para este nivel
    const { options: rawOptions } = getFoodOptionsForLevel(animalId, fromLvl, {
      marketPrices,
      flowerPriceUsd: flowerUsd,
      coinsPerFlower: bettyRatio,
      modifiers: eff,
      hasHoneyTreat,
      mudActive: mudAppliesHere,
      userState: ctx.userState,
      customUnitPriceResolver: ctx.customUnitPriceResolver,
    })

    const requestedFoodId = ctx.selectedFoods?.[toLvl]
    const forcedFood = requestedFoodId
      ? rawOptions.find((o) => o.id === requestedFoodId)
      : undefined

    // Costo de treat: se imputa en el nivel donde se aplica; Mud solo cubre 1 nivel (sin Vibraphone) y coexiste con treats
    const treatCostFlower = treatStartsHere ? treatUnitPrice : 0
    const mudCostFlower = mudAppliesHere ? treatPrices.mudBathFlower : 0

    return {
      toLvl,
      fromLvl,
      xpReq,
      isInstant,
      activeTreatHere,
      treatStartsHere,
      hasSaltLick,
      hasTruffleSeasoning,
      sleepHours,
      loveProb,
      affectionTools,
      affectionXp,
      rawOptions,
      forcedFood,
      treatCostFlower,
      mudAppliesHere,
      mudCostFlower,
    }
  })

  // Fase 2: Optimizar ruta principal (1 .. targetLevel) por costo total mínimo real
  const targetEndIdx = targetLevel - 1
  const optimalMainRouteIds = solveOptimalFoodRoute(
    precomputedSteps,
    0,
    targetEndIdx,
    0,
    isFreeFeedMode,
  )

  // Fase 3: Simulación secuencial exacta de la progresión y optimización de niveles > targetLevel
  let currentCarryover = 0
  let tailRouteIds: string[] = []
  let tailComputed = false

  let totalCostFlower = 0
  let totalRevenueFlower = 0
  let totalProfitFlower = 0
  let totalHours = 0
  let totalFeeds = 0
  let totalXp = 0

  const levels: AnimalLevelCalculation[] = precomputedSteps.map((step, idx) => {
    const receivedResidual = step.isInstant ? 0 : currentCarryover

    if (idx > targetEndIdx && !tailComputed) {
      tailComputed = true
      tailRouteIds = solveOptimalFoodRoute(
        precomputedSteps,
        idx,
        precomputedSteps.length - 1,
        receivedResidual,
        isFreeFeedMode,
      )
    }

    const dpSelectedId =
      idx <= targetEndIdx ? optimalMainRouteIds[idx] : tailRouteIds[idx - (targetEndIdx + 1)]

    let optimalFoodId = dpSelectedId || step.rawOptions[0]?.id || ""
    if (step.forcedFood && step.forcedFood.id !== optimalFoodId) {
      const hypotheticalEndIdx = idx <= targetEndIdx ? targetEndIdx : precomputedSteps.length - 1
      const hypo = solveOptimalFoodRoute(
        precomputedSteps,
        idx,
        hypotheticalEndIdx,
        receivedResidual,
        isFreeFeedMode,
        true,
      )
      if (hypo[0]) optimalFoodId = hypo[0]
    }

    const chosenFood =
      step.forcedFood || step.rawOptions.find((o) => o.id === dpSelectedId) || step.rawOptions[0]

    const neededFromFood = Math.max(
      0,
      roundExact(step.xpReq - receivedResidual - step.affectionXp, 4),
    )
    const unitFoodXp = Math.max(0.01, chosenFood.effectiveXp)
    const neededFeeds = neededFromFood > 0 ? Math.ceil(neededFromFood / unitFoodXp - 1e-9) : 0

    // Ordenar opciones del desplegable: óptimo real primero, luego por costo total para este nivel
    const sortedOptions: FoodCandidate[] = step.rawOptions
      .map((opt) => ({
        ...opt,
        isOptimal: opt.id === optimalFoodId,
      }))
      .sort((a, b) => {
        if (a.isOptimal !== b.isOptimal) return a.isOptimal ? -1 : 1
        const feedsA =
          neededFromFood > 0 ? Math.ceil(neededFromFood / Math.max(0.01, a.effectiveXp) - 1e-9) : 0
        const feedsB =
          neededFromFood > 0 ? Math.ceil(neededFromFood / Math.max(0.01, b.effectiveXp) - 1e-9) : 0
        const costA = isFreeFeedMode || a.isFree ? 0 : feedsA * a.costPerFeed
        const costB = isFreeFeedMode || b.isFree ? 0 : feedsB * b.costPerFeed
        if (Math.abs(costA - costB) > 1e-6) return costA - costB
        const surpA = Math.max(0, feedsA * a.effectiveXp - neededFromFood)
        const surpB = Math.max(0, feedsB * b.effectiveXp - neededFromFood)
        if (Math.abs(surpA - surpB) > 1e-4) return surpA - surpB
        return a.costPerXp - b.costPerXp
      })

    // Escarabajos no reciben Honey Treat ni multiplicadores de comida
    const effectiveUnitsPerFeed = chosenFood.isBeetle
      ? chosenFood.isFree
        ? 0
        : 1
      : chosenFood.effectivePerFeed

    const foodUnits = roundExact(neededFeeds * effectiveUnitsPerFeed, 2)
    const foodCostFlower =
      chosenFood.isFree || isFreeFeedMode
        ? 0
        : chosenFood.isBeetle
          ? neededFeeds * chosenFood.unitCostFlower
          : neededFeeds * effectiveUnitsPerFeed * chosenFood.unitCostFlower

    const totalCycleCostFlower = foodCostFlower + step.treatCostFlower + step.mudCostFlower
    const totalCycleCostUsd = totalCycleCostFlower * flowerUsd

    const totalFoodXp = roundExact(neededFeeds * unitFoodXp, 2)
    const totalXpObtained = roundExact(step.affectionXp + totalFoodXp, 2)
    const totalAvailable = roundExact(receivedResidual + totalXpObtained, 2)
    const residualGenerated = Math.max(0, roundExact(totalAvailable - step.xpReq, 2))
    currentCarryover = residualGenerated

    // Recursos obtenidos (orden oficial: base * mult_salt_lick + bonos_planos)
    const baseDrops = getDropsForAnimalLevel(animalId, step.toLvl)
    let revenueFlower = 0
    const resources: CalculatedDropItem[] = baseDrops.map((res) => {
      const mult =
        (res.isPrimary ? eff.primaryMultiplier : eff.secondaryMultiplier) *
        (step.hasSaltLick ? SALT_LICK_YIELD_MULTIPLIER : 1)
      const flat = res.isPrimary ? eff.primaryFlatBonus : eff.secondaryFlatBonus
      const amount = Math.max(0, roundExact(res.amount * mult + flat, 2))
      const unitPrice =
        (ctx.customUnitPriceResolver ? ctx.customUnitPriceResolver(res.name) : 0) ||
        marketPrices[res.name] ||
        getItemPrice(res.name) ||
        0

      revenueFlower += amount * unitPrice
      return {
        name: res.name,
        baseAmount: res.amount,
        amount,
        unitPrice,
        image: res.image,
        isPrimary: res.isPrimary,
        isSecondary: res.isSecondary,
      }
    })

    const revenueUsd = revenueFlower * flowerUsd
    const profitFlower = revenueFlower - totalCycleCostFlower
    const profitUsd = profitFlower * flowerUsd

    if (step.toLvl <= targetLevel) {
      totalCostFlower += totalCycleCostFlower
      totalRevenueFlower += revenueFlower
      totalProfitFlower += profitFlower
      totalHours += step.sleepHours
      totalFeeds += neededFeeds
      totalXp += totalXpObtained
    }

    return {
      level: step.toLvl,
      fromLevel: step.fromLvl,
      toLevel: step.toLvl,
      xpRequired: step.xpReq,
      sleepHours: step.sleepHours,
      isInstant: step.isInstant,
      residualXp: receivedResidual,
      residualGenerated,
      affectionTools: step.affectionTools,
      affectionXp: step.affectionXp,
      loveProb: step.loveProb,
      food: {
        id: chosenFood.id,
        name: chosenFood.name,
        displayName: chosenFood.displayName,
        image: chosenFood.image,
        ingredient: chosenFood.ingredient,
        ingredientImage: chosenFood.ingredientImage,
        ingredientName: chosenFood.ingredientName,
        ingredientAmount: chosenFood.ingredientAmount,
        units: foodUnits,
        neededFeeds,
        xp: unitFoodXp,
        baseXp: chosenFood.baseXp,
        costFlower: totalCycleCostFlower,
        costUsd: totalCycleCostUsd,
        isBeetle: chosenFood.isBeetle,
        isFree: Boolean(chosenFood.isFree),
        isFav: chosenFood.isFav,
        isOptimal: chosenFood.id === optimalFoodId,
      },
      selectedFoodId: chosenFood.id,
      optimalFoodId,
      options: sortedOptions,
      totalXpObtained,
      totalFoodXp,
      totalAvailable,
      resources,
      revenueFlower,
      revenueUsd,
      treatApplied: step.activeTreatHere,
      treatStartsHere: step.treatStartsHere,
      treatCostFlower: step.treatCostFlower,
      mudActive: step.mudAppliesHere,
      mudCostFlower: step.mudCostFlower,
      profitFlower,
      profitUsd,
    }
  })

  const totalCostUsd = totalCostFlower * flowerUsd
  const totalRevenueUsd = totalRevenueFlower * flowerUsd
  const totalProfitUsd = totalProfitFlower * flowerUsd
  const roiPercent = totalCostFlower > 0 ? (totalProfitFlower / totalCostFlower) * 100 : 0

  return {
    animalId,
    name: rawAnimal.name,
    icon: rawAnimal.icon,
    buildingId: rawAnimal.buildingId,
    buildingName: rawBuilding?.name || rawAnimal.buildingId,
    buildingIcon: rawBuilding?.icon || rawAnimal.icon,
    costCoins: rawAnimal.purchaseCost.coins,
    purchaseCostFlower,
    baseSleepHours: rawAnimal.sleepDurationHours,
    effectiveSleepHours: eff.sleepHoursBase,
    modifiers,
    targetLevel,
    treatType,
    treatStartLevel,
    treatDurationCycles,
    mudLevel,
    levels,
    totals: {
      targetLevel,
      totalCostFlower,
      totalCostUsd,
      totalRevenueFlower,
      totalRevenueUsd,
      totalProfitFlower,
      totalProfitUsd,
      totalHours: roundExact(totalHours, 2),
      totalFeeds,
      totalXp: roundExact(totalXp, 2),
      roiPercent: roundExact(roiPercent, 1),
    },
  }
}

// ---------------------------------------------------------------------------
// Costo de Edificios, Slops rápidos y Resumen Hero Global
// ---------------------------------------------------------------------------

export interface BuildingCostCalculation {
  coins: number
  coinsInFlower: number
  ingredientsCostFlower: number
  totalCostFlower: number
  totalCostUsd: number
  breakdown: Array<{
    name: string
    amount: number
    image: string
    unitPriceFlower: number
    totalPriceFlower: number
  }>
}

/**
 * Calcula el costo total de construcción o mejora de un edificio en FLOWER y USD.
 */
export function calculateBuildingUpgradeCost(
  buildingId: AnimalBuildingId,
  targetLevel: number,
  options?: {
    coinsPerFlower?: number
    flowerPriceUsd?: number
    unitPriceResolver?: (itemName: string) => number
  },
): BuildingCostCalculation | null {
  const building = getAnimalBuilding(buildingId)
  if (!building) return null

  const levelInfo = building.levels.find((lvl) => lvl.level === targetLevel)
  if (!levelInfo) return null

  const marketState = getState()
  const bettyRatio = options?.coinsPerFlower || marketState.bettyRatio || OFFICIAL_COINS_PER_FLOWER
  const flowerUsd = options?.flowerPriceUsd || marketState.flowerPrice || 0.144
  const coinsFlower = bettyRatio > 0 ? levelInfo.coins / bettyRatio : 0

  let ingredientsCostFlower = 0
  const breakdown: BuildingCostCalculation["breakdown"] = []

  for (const ing of levelInfo.ingredients) {
    const unitPrice = options?.unitPriceResolver
      ? options.unitPriceResolver(ing.name)
      : getItemPrice(ing.name)
    const totalIngFlower = unitPrice * ing.amount
    ingredientsCostFlower += totalIngFlower
    breakdown.push({
      name: ing.name,
      amount: ing.amount,
      image: ing.image,
      unitPriceFlower: unitPrice,
      totalPriceFlower: totalIngFlower,
    })
  }

  const totalCostFlower = coinsFlower + ingredientsCostFlower
  return {
    coins: levelInfo.coins,
    coinsInFlower: coinsFlower,
    ingredientsCostFlower,
    totalCostFlower,
    totalCostUsd: totalCostFlower * flowerUsd,
    breakdown,
  }
}

export interface CheapestSlopResult {
  slopId: string
  bestOption: IngredientCost
  unitPriceFlower: number
  totalCostFlower: number
  totalCostUsd: number
  allOptions: Array<{
    name: string
    amount: number
    image: string
    unitPriceFlower: number
    totalCostFlower: number
  }>
}

/**
 * Evalúa todas las opciones de ingredientes de un Slop usando P2P y resolveCost para no-P2P.
 */
export function getCheapestSlopOption(
  slopId: string,
  options?: {
    flowerPriceUsd?: number
    coinsPerFlower?: number
    unitPriceResolver?: (itemName: string) => number
  },
): CheapestSlopResult | null {
  const slop = getConsumable(slopId)
  if (!slop || !slop.options || slop.options.length === 0) return null

  const marketState = getState()
  const flowerUsd = options?.flowerPriceUsd || marketState.flowerPrice || getFlowerPrice() || 0.144
  const bettyRatio =
    options?.coinsPerFlower ||
    marketState.bettyRatio ||
    getBettyRatio() ||
    OFFICIAL_COINS_PER_FLOWER

  const evaluated = slop.options.map((opt) => {
    const { cost: unitPrice } = resolveAnimalItemCostFlower(
      opt.name,
      {},
      flowerUsd,
      bettyRatio,
      null,
      options?.unitPriceResolver,
    )
    const totalCost = unitPrice * opt.amount
    return {
      name: opt.name,
      amount: opt.amount,
      image: opt.image,
      unitPriceFlower: unitPrice,
      totalCostFlower: totalCost,
    }
  })

  const sorted = [...evaluated]
    .filter((opt) => opt.totalCostFlower > 0)
    .sort((a, b) => a.totalCostFlower - b.totalCostFlower)
  const best = sorted.length > 0 ? sorted[0] : evaluated[0]

  return {
    slopId,
    bestOption: {
      name: best.name,
      amount: best.amount,
      image: best.image,
    },
    unitPriceFlower: best.unitPriceFlower,
    totalCostFlower: best.totalCostFlower,
    totalCostUsd: best.totalCostFlower * flowerUsd,
    allOptions: evaluated,
  }
}

/** Calcula la XP acumulada faltante entre currentLevel y targetLevel */
export function calculateXpNeeded(
  animalId: AnimalId,
  currentLevel: number,
  targetLevel: number,
): number {
  const animal = getAnimal(animalId)
  if (!animal || currentLevel >= targetLevel) return 0
  const startLevelObj = animal.levels.find((l) => l.level === currentLevel)
  const targetLevelObj = animal.levels.find((l) => l.level === targetLevel)
  const startCumulative = startLevelObj ? startLevelObj.cumulativeXp : 0
  const targetCumulative = targetLevelObj ? targetLevelObj.cumulativeXp : 0
  return Math.max(0, targetCumulative - startCumulative)
}

export const SflAnimals = {
  ORDERED_ANIMAL_IDS,
  REQUIRED_FOOD_QTY,
  LOVE_ITEM_XP,
  LOVE_REQUESTS,
  BEETLES_LIST,
  ANIMAL_BUILDINGS,
  ANIMALS,
  ANIMAL_CONSUMABLES,
  getAnimalBuildings,
  getAnimalBuilding,
  getAnimals,
  getAnimal,
  getAnimalsByBuilding,
  getConsumablesByCategory,
  getConsumable,
  getDropsForAnimalLevel,
  getBaseFoodXp,
  resolveAnimalModifiers,
  resolveAnimalItemCostFlower,
  getTreatUnitPrices,
  getFoodOptionsForLevel,
  calculateAnimalProgression,
  calculateBuildingUpgradeCost,
  getCheapestSlopOption,
  calculateXpNeeded,
  getRefinedSaltPrice,
}

if (typeof window !== "undefined") {
  ;(window as any).SflAnimals = SflAnimals
}
