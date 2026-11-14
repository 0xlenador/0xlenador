// ============================================================
// src/lib/sfl/animals.ts
// Motor centralizado de datos y cálculos para Animales y
// Edificios de Sunflower Land.
//
// Responsabilidad única: Proveer tipos estrictos, acceso
// normalizado a los datos de animales, edificios y consumibles,
// y cálculos matemáticos (XP, costos de construcción, slops y ROI).
// ============================================================

import buildingsDataRaw from "../../content/data/sfl/animals/buildings.json"
import animalsDataRaw from "../../content/data/sfl/animals/animals.json"
import consumablesDataRaw from "../../content/data/sfl/animals/consumables.json"
import { getItemPrice, getState } from "./market"

// ---------------------------------------------------------------------------
// Tipos e Interfaces
// ---------------------------------------------------------------------------

export type AnimalBuildingId = "hen_house" | "barn" | "pigpen"
export type AnimalId = "chicken" | "cow" | "sheep" | "pig"
export type ConsumableCategory = "feed" | "slop" | "medicine" | "mud" | "beetle"

export interface IngredientCost {
  name: string
  amount: number
  image: string
}

export interface LevelBounties {
  totalWeekly: number
  seasonalTickets: number
  coins: number
  gems: number
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

// ---------------------------------------------------------------------------
// Acceso Estático a Datos Tipados
// ---------------------------------------------------------------------------

export const ANIMAL_BUILDINGS = buildingsDataRaw as unknown as Record<AnimalBuildingId, AnimalBuilding>
export const ANIMALS = animalsDataRaw as unknown as Record<AnimalId, AnimalData>
export const ANIMAL_CONSUMABLES = consumablesDataRaw as unknown as Record<string, ConsumableItem>

/** Retorna todos los edificios de animales disponibles */
export function getAnimalBuildings(): AnimalBuilding[] {
  return Object.values(ANIMAL_BUILDINGS)
}

/** Retorna un edificio de animal específico por su ID */
export function getAnimalBuilding(id: AnimalBuildingId): AnimalBuilding | undefined {
  return ANIMAL_BUILDINGS[id]
}

/** Retorna todos los animales disponibles */
export function getAnimals(): AnimalData[] {
  return Object.values(ANIMALS)
}

/** Retorna un animal por su ID */
export function getAnimal(id: AnimalId): AnimalData | undefined {
  return ANIMALS[id]
}

/** Retorna los animales permitidos en un edificio específico */
export function getAnimalsByBuilding(buildingId: AnimalBuildingId): AnimalData[] {
  return getAnimals().filter((animal) => animal.buildingId === buildingId)
}

/** Retorna todos los consumibles por categoría */
export function getConsumablesByCategory(category: ConsumableCategory): ConsumableItem[] {
  return Object.values(ANIMAL_CONSUMABLES).filter((c) => c.category === category)
}

/** Retorna un consumible específico por ID */
export function getConsumable(id: string): ConsumableItem | undefined {
  return ANIMAL_CONSUMABLES[id]
}

// ---------------------------------------------------------------------------
// Motores de Cálculo y Lógica de Negocio
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
 * Calcula el costo total de construcción o mejora de un edificio en FLOWER y USD,
 * cruzando monedas (según tasa Betty) e ingredientes (según precio de mercado P2P).
 */
export function calculateBuildingUpgradeCost(
  buildingId: AnimalBuildingId,
  targetLevel: number,
  options?: {
    coinsPerFlower?: number
    flowerPriceUsd?: number
    unitPriceResolver?: (itemName: string) => number
  }
): BuildingCostCalculation | null {
  const building = getAnimalBuilding(buildingId)
  if (!building) return null

  const levelInfo = building.levels.find((lvl) => lvl.level === targetLevel)
  if (!levelInfo) return null

  const marketState = getState()
  const bettyRatio = options?.coinsPerFlower || marketState.bettyRatio || 320
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
  const totalCostUsd = totalCostFlower * flowerUsd

  return {
    coins: levelInfo.coins,
    coinsInFlower: coinsFlower,
    ingredientsCostFlower,
    totalCostFlower,
    totalCostUsd,
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
 * Evalúa todas las opciones de ingredientes de un Slop (ej: basic_slop, hearty_slop, etc.)
 * y determina cuál es la opción más económica en tiempo real según el mercado P2P.
 */
export function getCheapestSlopOption(
  slopId: string,
  options?: {
    flowerPriceUsd?: number
    unitPriceResolver?: (itemName: string) => number
  }
): CheapestSlopResult | null {
  const slop = getConsumable(slopId)
  if (!slop || !slop.options || slop.options.length === 0) return null

  const marketState = getState()
  const flowerUsd = options?.flowerPriceUsd || marketState.flowerPrice || 0.144

  const evaluated = slop.options.map((opt) => {
    const unitPrice = options?.unitPriceResolver
      ? options.unitPriceResolver(opt.name)
      : getItemPrice(opt.name)
    const totalCost = unitPrice * opt.amount

    return {
      name: opt.name,
      amount: opt.amount,
      image: opt.image,
      unitPriceFlower: unitPrice,
      totalCostFlower: totalCost,
    }
  })

  // Filtrar opciones con precio válido > 0 y ordenar ascendente por costo total
  const sorted = [...evaluated].filter((opt) => opt.totalCostFlower > 0).sort((a, b) => a.totalCostFlower - b.totalCostFlower)

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

/**
 * Calcula la XP total requerida para llevar un animal desde su nivel actual a un nivel objetivo.
 */
export function calculateXpNeeded(
  animalId: AnimalId,
  currentLevel: number,
  targetLevel: number
): number {
  const animal = getAnimal(animalId)
  if (!animal || currentLevel >= targetLevel) return 0

  const startLevelObj = animal.levels.find((l) => l.level === currentLevel)
  const targetLevelObj = animal.levels.find((l) => l.level === targetLevel)

  const startCumulative = startLevelObj ? startLevelObj.cumulativeXp : 0
  const targetCumulative = targetLevelObj ? targetLevelObj.cumulativeXp : 0

  return Math.max(0, targetCumulative - startCumulative)
}

