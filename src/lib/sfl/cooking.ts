// ============================================================================
// src/lib/sfl/cooking.ts
// Motor centralizado de recetas, tiempos, costos y XP de cocina para Sunflower Land.
//
// Responsabilidad única:
// 1. Cargar y normalizar recetas de cocina (incluyendo peces envejecidos de Aging Shed).
// 2. Resolver cálculos de XP de alimentos aplicando buffs y habilidades de cocina.
// 3. Resolver tiempos de cocción aplicando bonos de edificios (Oil), tótems, santuarios y skills.
// 4. Calcular costos de ingredientes (recursión para sub-recetas, costos de captura de peces, debuffs).
// 5. Proveer cálculos de optimización y progresión de niveles del Bumpkin (Skill Calculator).
// ============================================================================

import recipesDataRaw from "../../content/data/sfl/recipes.json"
import agingShedDataRaw from "../../content/data/sfl/aging_shed.json"
import fishDataRaw from "../../content/data/sfl/fishing/fish.json"
import levelExperienceRaw from "../../content/data/sfl/level_experience.json"
import {
  isEffectTargetMatch,
  speedMultiplierToTimeFactor,
  type BuffDefinition,
  type ActiveBuffSelections,
} from "./buffs"
import { getUnitCost } from "./prices"

// ----------------------------------------------------------------------------
// Tipos e Interfaces
// ----------------------------------------------------------------------------

export interface RecipeIngredient {
  name: string
  amount: number
  image?: string
}

export interface CookingRecipe {
  name: string
  building: string
  time: string
  xp: number
  ingredients: RecipeIngredient[]
  image?: string
  event?: string
  eventDate?: string
  instant?: number
  agedXp?: number
  primeAgedXp?: number
  hidden?: boolean
}

export interface CookingCostResult {
  total: number
  baseTotal: number
  missing: boolean
  costMultiplier: number
}

export interface CalculatedRecipeMetrics {
  recipe: CookingRecipe
  finalXp: number
  cost: CookingCostResult
  timeSeconds: number
  xpPerSfl: number
  xpPerDay: number
}

export interface LevelProgressResult {
  startLevel: number
  targetLevel: number
  startXp: number
  targetXp: number
  rangeXp: number
  rangeCost: number
  dishesRange: number
  nextLevelXp: number
  nextDeltaXp: number
  costNextLevel: number
  dishesNextLevel: number
  totalCost: number
  dishesTotal: number
  skillsEarnedInRange: number
  avgCostPerSkill: number
  avgXpPerSkill: number
  dishesAvgSkill: number
}

export interface RecipeCostOptions {
  priceDict?: Record<string, number>
  visited?: Set<string>
  isTopLevel?: boolean
  activeSkills?: Record<string, number>
  rodCost?: number
  coinsPerFlower?: number
  flowerPriceUsd?: number
  customFishFlakeCost?: number | null
  customFishStickCost?: number | null
  customFishOilCost?: number | null
  customCrabStickCost?: number | null
  allRecipes?: CookingRecipe[]
  resolveFishCatchCost?: (fishName: string) => number | null
  isAgingShed?: boolean
  isFish?: boolean
}

// ----------------------------------------------------------------------------
// Constantes de Pesca para Ingredientes
// ----------------------------------------------------------------------------

export const KNOWN_FISH_INGREDIENTS = new Set([
  "Anchovy",
  "Angelfish",
  "Barred Knifejaw",
  "Blowfish",
  "Blue Marlin",
  "Butterflyfish",
  "Clownfish",
  "Cobia",
  "Coelacanth",
  "Football fish",
  "Halibut",
  "Hammerhead shark",
  "Horse Mackerel",
  "Mahi Mahi",
  "Napoleanfish",
  "Oarfish",
  "Olive Flounder",
  "Parrotfish",
  "Phantom Barracuda",
  "Porgy",
  "Ray",
  "Red Snapper",
  "Rock Blackfish",
  "Saw Shark",
  "Sea Bass",
  "Sea Horse",
  "Squid",
  "Sunfish",
  "Surgeonfish",
  "Tilapia",
  "Trout",
  "Tuna",
  "Walleye",
  "Weakfish",
  "Whale Shark",
  "White Shark",
  "Zebra Turkeyfish",
  "Crystal Shrimp",
  "Deep Sea Pig",
  "Deep Sea Slug",
  "Dollocaris",
  "Garden Eel",
  "Giant Isopod",
  "Gilded Swordfish",
  "Longhorn Cowfish",
  "Nautilus",
  "Twilight Anglerfish",
  "Octopus",
  "Moray Eel",
])

// ----------------------------------------------------------------------------
// Carga y Normalización de Recetas
// ----------------------------------------------------------------------------

let cachedAllRecipes: CookingRecipe[] | null = null

/** Extrae las recetas de peces envejecidos de Aging Shed */
export function getAgedFishRecipes(): CookingRecipe[] {
  const agedFishRecipes: CookingRecipe[] = []
  const agingTab = (agingShedDataRaw as any)?.building?.tabs?.find(
    (t: any) => t.id === "aging"
  )

  if (agingTab?.categories) {
    agingTab.categories.forEach((cat: any) => {
      ;(cat.items || []).forEach((item: any) => {
        const rawFish = item.name.replace(/^Aged\s+/, "")
        const sec = Number(item.timeSeconds) || 0
        const h = String(Math.floor(sec / 3600)).padStart(2, "0")
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0")
        const s = String(sec % 60).padStart(2, "0")
        const agedXp = Number(item.agedXp) || 0
        const primeXp = Number(item.primeAgedXp) || Math.round(agedXp * 1.3)
        // Esperanza matemática: 90% aged + 10% prime
        const expectedXp = Math.round(agedXp * 0.9 + primeXp * 0.1)

        agedFishRecipes.push({
          name: item.name,
          building: "Aging Shed",
          time: `${h}:${m}:${s}`,
          xp: expectedXp,
          agedXp,
          primeAgedXp: primeXp,
          ingredients: [
            { name: rawFish, amount: 1 },
            { name: "Salt", amount: Number(item.salt) || 0 },
          ],
          image: item.image || `/img/sunflowerland/fish/${rawFish}.png`,
        })
      })
    })
  }

  return agedFishRecipes
}

/** Extrae las recetas de peces crudos (consumibles de pesca) */
export function getRawFishRecipes(): CookingRecipe[] {
  const rawFishRecipes: CookingRecipe[] = []
  const fishList = (fishDataRaw as any) || []

  fishList.forEach((fish: any) => {
    if (!fish.name || !fish.xp) return
    rawFishRecipes.push({
      name: fish.name,
      building: "Fish",
      time: "00:00:00",
      xp: Number(fish.xp) || 0,
      ingredients: [
        {
          name: fish.name,
          amount: 1,
          image: fish.image || `/img/sunflowerland/fish/${fish.name}.png`,
        },
      ],
      image: fish.image || `/img/sunflowerland/fish/${fish.name}.png`,
    })
  })

  return rawFishRecipes
}

/** Devuelve todas las recetas combinadas (recipes.json + Aging Shed + Peces Crudos) */
export function getAllCookingRecipes(): CookingRecipe[] {
  if (cachedAllRecipes) return cachedAllRecipes

  const baseRecipes: CookingRecipe[] = (
    ((recipesDataRaw as any)?.recipes || []) as CookingRecipe[]
  ).filter((r) => !r.hidden)
  const agedRecipes = getAgedFishRecipes()
  const rawFishRecipes = getRawFishRecipes()

  cachedAllRecipes = [...baseRecipes, ...agedRecipes, ...rawFishRecipes]
  return cachedAllRecipes
}

// ----------------------------------------------------------------------------
// Utilidades de Tiempo
// ----------------------------------------------------------------------------

/** Parsea un string de tiempo en formato "hh:mm:ss" o "Xd hh:mm:ss" a segundos totales */
export function parseCookingTime(timeStr: string): number {
  if (!timeStr) return 0
  let days = 0
  let tStr = timeStr

  if (timeStr.includes("d ")) {
    const parts = timeStr.split("d ")
    days = parseInt(parts[0], 10) || 0
    tStr = parts[1]
  }

  const parts = tStr.split(":").map(Number)
  const h = parts[0] || 0
  const m = parts[1] || 0
  const s = parts[2] || 0

  return days * 86400 + h * 3600 + m * 60 + s
}

/** Formatea segundos totales a string "hh:mm:ss" o "Xd hh:mm:ss" */
export function formatCookingTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "00:00:00"
  const days = Math.floor(totalSeconds / 86400)
  let remaining = totalSeconds % 86400
  const h = Math.floor(remaining / 3600)
  remaining %= 3600
  const m = Math.floor(remaining / 60)
  const s = Math.floor(remaining % 60)

  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return days > 0 ? `${days}d ${timeStr}` : timeStr
}

// ----------------------------------------------------------------------------
// Cálculos de XP de Bumpkin
// ----------------------------------------------------------------------------

/**
 * Calcula la experiencia (XP) final de un alimento aplicando buffs de power-ups,
 * habilidades de cocina y ventajas globales (VIP, Faction Pet, etc.).
 */
export function calculateCookingXp(
  recipe: CookingRecipe,
  activeBuffDefinitions: BuffDefinition[],
  activeSkills: Record<string, number> = {}
): number {
  let baseExp = recipe.xp

  // Si es Aging Shed, recalcular esperanza matemática si hay buffs de prime chance activos
  if (recipe.building === "Aging Shed" && recipe.agedXp && recipe.primeAgedXp) {
    let primeChance = 0.1 // Base 10%
    for (const buff of activeBuffDefinitions) {
      for (const eff of buff.effects) {
        if ((eff.category === "aging_prime" || eff.effect_type === "prime") && eff.calc) {
          primeChance += eff.calc / 100
        }
      }
    }
    primeChance = Math.min(1, Math.max(0, primeChance))
    baseExp = Math.round(recipe.agedXp * (1 - primeChance) + recipe.primeAgedXp * primeChance)
  }

  let boostedExp = baseExp
  let additions = 0

  const targetContext = {
    itemName: recipe.name,
    building: recipe.building,
    ingredients: recipe.ingredients,
  }

  // 1. Buffs de Collectibles, Wearables y Shrines que aplican a bumpkin_xp
  for (const buff of activeBuffDefinitions) {
    if (buff.name === "VIP Pass" && !activeSkills["VIP Pass"]) {
      boostedExp *= 1.1
      continue
    }
    if (buff.name === "Blossom Beard" && !activeSkills["Blossom Beard"]) {
      boostedExp *= 1.1
      continue
    }
    if (
      buff.name === "Luminous Anglerfish" &&
      !activeSkills["Luminous Anglerfish"] &&
      isEffectTargetMatch("Fish", targetContext)
    ) {
      boostedExp *= 1.5
      continue
    }
    if (
      buff.name === "Astrolabe" &&
      !activeSkills["Astrolabe"] &&
      isEffectTargetMatch("Aged Fish", targetContext)
    ) {
      boostedExp *= 1.05
      continue
    }
    for (const eff of buff.effects) {
      if (eff.category !== "bumpkin_xp" && !(eff.category === "cooking" && eff.effect_type === "xp")) continue
      if (!isEffectTargetMatch(eff.target, targetContext)) continue

      if (eff.mathematics_operation === "multiply" && eff.calc) {
        boostedExp *= eff.calc
      } else if (eff.mathematics_operation === "add" && eff.calc) {
        additions += eff.calc
      }
    }
  }

  // 2. Habilidades de Bumpkin y Perks de Others
  for (const [skillName, rank] of Object.entries(activeSkills)) {
    if (!rank || rank <= 0) continue

    // Perks de Others (VIP Pass, Blossom Beard, Luminous Anglerfish, Faction Pet)
    if (skillName === "VIP Pass") {
      boostedExp *= 1.1
    } else if (skillName === "Blossom Beard") {
      boostedExp *= 1.1
    } else if (
      skillName === "Luminous Anglerfish" &&
      isEffectTargetMatch("Fish", targetContext)
    ) {
      boostedExp *= 1.5
    } else if (
      skillName === "Astrolabe" &&
      isEffectTargetMatch("Aged Fish", targetContext)
    ) {
      boostedExp *= 1.05
    } else if (skillName === "Faction Pet") {
      const petBonus = rank === 1 ? 0.1 : rank === 2 ? 0.2 : rank === 3 ? 0.3 : 0.5
      boostedExp *= 1 + petBonus
    }

    // Habilidades del árbol de Cocina
    else if (skillName === "Munching Mastery") {
      boostedExp *= 1.05
    } else if (skillName === "Juicy Boost" && recipe.building === "Smoothie Shack") {
      boostedExp *= 1.1
    } else if (
      skillName === "Double Nom" &&
      recipe.building !== "Aging Shed" &&
      recipe.building !== "Fish"
    ) {
      boostedExp *= 2
    } else if (skillName === "Fiery Jackpot" && recipe.building === "Fire Pit") {
      boostedExp *= 1.2
    } else if (
      skillName === "Fishy Feast" &&
      isEffectTargetMatch("Fish", targetContext)
    ) {
      boostedExp *= 1.2
    } else if (
      skillName === "Buzzworthy Treats" &&
      isEffectTargetMatch("Honey Foods", targetContext)
    ) {
      boostedExp *= 1.1
    } else if (skillName === "Drive-Through Deli" && recipe.building === "Deli") {
      const deliBonus = rank === 1 ? 0.15 : rank === 2 ? 0.2 : 0.25
      boostedExp *= 1 + deliBonus
    }
  }

  return boostedExp + additions
}

// ----------------------------------------------------------------------------
// Cálculos de Tiempo de Cocción
// ----------------------------------------------------------------------------

/**
 * Calcula el tiempo final en segundos para una receta considerando combustible
 * de edificios (Oil), habilidades activas y reducciones de santuarios/relojes.
 */
export function calculateCookingTime(
  recipe: CookingRecipe,
  activeBuffDefinitions: BuffDefinition[],
  activeSkills: Record<string, number> = {}
): number {
  const baseSeconds = parseCookingTime(recipe.time)
  if (baseSeconds <= 0) return 0

  // 1. Caso especial: Aging Shed NO es un edificio de cocina
  // Los aceleradores de cocina (Boar Shrine, Legendary Shrine, Gourmet Hourglass, Totems, Oil, etc.)
  // NO aplican a la maduración/fermentación de peces.
  if (recipe.building === "Aging Shed") {
    let agingMultiplier = 1

    // Skill de envejecimiento: Speedy Aging (x0.90 en rank 1, x0.85 en rank 2, x0.80 en rank 3)
    if (activeSkills["Speedy Aging"]) {
      const rank = activeSkills["Speedy Aging"]
      const ranks = [0.9, 0.85, 0.8]
      agingMultiplier *= ranks[rank - 1] || 0.9
    }

    // Wearables / Collectibles específicos de aging (ej. Fish Trap x0.80, Salt Sculpture x0.95)
    for (const buff of activeBuffDefinitions) {
      for (const eff of buff.effects) {
        if (
          eff.category === "aging" ||
          eff.target === "Aged Fish" ||
          eff.target === "aging"
        ) {
          if (eff.mathematics_operation === "multiply" && eff.calc) {
            agingMultiplier *= eff.calc
          }
        }
      }
    }

    return baseSeconds * agingMultiplier
  }

  // 2. Edificios de cocina estándar (Fire Pit, Kitchen, Bakery, Deli, Smoothie Shack)
  let timeMultiplier = 1
  const targetContext = {
    itemName: recipe.name,
    building: recipe.building,
    ingredients: recipe.ingredients,
  }

  // 1. Reducciones por habilidades activas
  for (const [skillName, rank] of Object.entries(activeSkills)) {
    if (!rank || rank <= 0) continue

    if (
      skillName === "Fast Feasts" &&
      (recipe.building === "Fire Pit" || recipe.building === "Kitchen")
    ) {
      timeMultiplier *= 0.9
    } else if (
      skillName === "Frosted Cakes" &&
      (recipe.building === "Bakery" || recipe.name.includes("Cake"))
    ) {
      timeMultiplier *= 0.8
    } else if (skillName === "Swift Sizzle" && recipe.building === "Fire Pit") {
      timeMultiplier *= 0.7
    } else if (skillName === "Turbo Fry" && recipe.building === "Kitchen") {
      timeMultiplier *= 0.6
    } else if (skillName === "Fry Frenzy" && recipe.building === "Deli") {
      timeMultiplier *= 0.5
    }

    // Otros ítems temporales en activeSkills
    else if (skillName === "Desert Gnome") {
      timeMultiplier *= 0.9
    } else if (
      skillName === "Time Warp Totem" ||
      skillName === "Super Totem" ||
      skillName === "Gourmet Hourglass"
    ) {
      timeMultiplier *= 0.5
    } else if (skillName === "Faction Medallion") {
      timeMultiplier *= 0.75
    } else if (skillName === "Boar Shrine") {
      timeMultiplier *= 0.8
    } else if (skillName === "Legendary Shrine") {
      timeMultiplier *= 0.5
    }
  }

  // 2. Combustible base de Oil por edificio (cuando Oil está activo)
  const hasOil = Boolean(activeSkills["Oil"])
  if (hasOil) {
    if (recipe.building === "Fire Pit" && !activeSkills["Swift Sizzle"]) {
      timeMultiplier *= 0.8 // -20% base
    } else if (recipe.building === "Kitchen" && !activeSkills["Turbo Fry"]) {
      timeMultiplier *= 0.75 // -25% base
    } else if (recipe.building === "Bakery") {
      timeMultiplier *= 0.65 // -35% base
    } else if (recipe.building === "Deli" && !activeSkills["Fry Frenzy"]) {
      timeMultiplier *= 0.6 // -40% base
    }
  }

  // 3. Shrines y Consumibles de activeBuffDefinitions
  for (const buff of activeBuffDefinitions) {
    if (buff.name === "Boar Shrine") {
      timeMultiplier *= 0.8
      continue
    }
    if (buff.name === "Legendary Shrine") {
      timeMultiplier *= 0.5
      continue
    }
    for (const eff of buff.effects) {
      if (!isEffectTargetMatch(eff.target, targetContext)) continue

      if (eff.category === "cooking_time" && eff.mathematics_operation === "multiply" && eff.calc) {
        timeMultiplier *= eff.calc
      } else if (
        eff.category === "cooking_speed" &&
        eff.mathematics_operation === "speed_multiplier" &&
        eff.calc &&
        eff.calc > 0
      ) {
        timeMultiplier *= speedMultiplierToTimeFactor(eff.calc)
      }
    }
  }

  return baseSeconds * timeMultiplier
}

// ----------------------------------------------------------------------------
// Cálculos de Costo de Ingredientes
// ----------------------------------------------------------------------------

/**
 * Calcula el costo en FLOWER de los ingredientes de una receta, resolviendo
 * sub-recetas recursivamente y costos especiales de peces y derivados.
 */
export function calculateRecipeCost(
  ingredients: RecipeIngredient[],
  options: RecipeCostOptions = {}
): CookingCostResult {
  const {
    priceDict = {},
    visited = new Set<string>(),
    isTopLevel = true,
    activeSkills = {},
    rodCost = 0,
    coinsPerFlower = 1330,
    flowerPriceUsd = 0.0854,
    customFishFlakeCost = null,
    customFishStickCost = null,
    customFishOilCost = null,
    customCrabStickCost = null,
    allRecipes = getAllCookingRecipes(),
    resolveFishCatchCost,
  } = options

  let total = 0
  let missing = false

  for (const ing of ingredients) {
    const isKnownFish = KNOWN_FISH_INGREDIENTS.has(ing.name)
    const marketPrice = priceDict[ing.name]

    if (marketPrice !== undefined && marketPrice > 0) {
      total += marketPrice * ing.amount
    } else if (isKnownFish) {
      let fishCost = rodCost || 0
      if (resolveFishCatchCost) {
        const catchVal = resolveFishCatchCost(ing.name)
        if (catchVal !== null && catchVal > 0) {
          fishCost = catchVal
        }
      }
      total += fishCost * ing.amount
    } else if (ing.name === "Fish Flake") {
      const flakeCost =
        customFishFlakeCost !== null && customFishFlakeCost !== undefined
          ? customFishFlakeCost
          : rodCost
            ? 8 * rodCost
            : 0
      total += flakeCost * ing.amount
    } else if (ing.name === "Fish Stick") {
      const stickCost =
        customFishStickCost !== null && customFishStickCost !== undefined
          ? customFishStickCost
          : rodCost
            ? 10 * rodCost
            : 0
      total += stickCost * ing.amount
    } else if (ing.name === "Fish Oil") {
      const oilCost =
        customFishOilCost !== null && customFishOilCost !== undefined
          ? customFishOilCost
          : rodCost
            ? 14 * rodCost
            : 0
      total += oilCost * ing.amount
    } else if (ing.name === "Crab Stick") {
      const crabCost =
        customCrabStickCost !== null && customCrabStickCost !== undefined
          ? customCrabStickCost
          : 5.9
      total += crabCost * ing.amount
    } else {
      // Buscar si el ingrediente es en realidad otra receta
      const subRecipe = allRecipes.find((r) => r.name === ing.name)
      if (subRecipe && !visited.has(ing.name)) {
        visited.add(ing.name)
        const subCost = calculateRecipeCost(subRecipe.ingredients, {
          ...options,
          visited,
          isTopLevel: false,
        })
        if (subCost.missing) missing = true
        total += subCost.total * ing.amount
      } else {
        const unit = getUnitCost(ing.name, flowerPriceUsd)
        if (unit && unit.flower > 0) {
          total += unit.flower * ing.amount
        } else {
          missing = true
        }
      }
    }
  }

  // Modificadores de costo por habilidades (Debuffs de Double Nom o Instant Gratification)
  // Solo aplican a recetas de cocina, NO a Aging Shed ni a peces crudos
  let costMultiplier = 1
  if (isTopLevel && !options.isAgingShed && !options.isFish) {
    if (activeSkills["Double Nom"]) {
      costMultiplier *= 2
    }
    if (activeSkills["Instant Gratification"]) {
      costMultiplier *= 2
    }
  }

  return {
    total: total * costMultiplier,
    baseTotal: total,
    missing,
    costMultiplier,
  }
}

// ----------------------------------------------------------------------------
// Métricas Combinadas de Recetas
// ----------------------------------------------------------------------------

/**
 * Calcula todas las métricas operativas de una receta:
 * XP final, costo en FLOWER, tiempo en segundos, XP por FLOWER y XP por día.
 */
export function calculateRecipeMetrics(
  recipe: CookingRecipe,
  options: {
    activeBuffDefinitions?: BuffDefinition[]
    activeSkills?: Record<string, number>
    costOptions?: RecipeCostOptions
  } = {}
): CalculatedRecipeMetrics {
  const {
    activeBuffDefinitions = [],
    activeSkills = {},
    costOptions = {},
  } = options

  const isAgingShed = recipe.building === "Aging Shed"
  const isFish = recipe.building === "Fish"
  const finalXp = calculateCookingXp(recipe, activeBuffDefinitions, activeSkills)
  const timeSeconds = calculateCookingTime(recipe, activeBuffDefinitions, activeSkills)
  const cost = calculateRecipeCost(recipe.ingredients, {
    ...costOptions,
    activeSkills,
    isAgingShed,
    isFish,
  })

  const xpPerSfl = cost.total > 0 ? finalXp / cost.total : 0
  const xpPerDay = timeSeconds > 0 ? (86400 / timeSeconds) * finalXp : 0

  return {
    recipe,
    finalXp,
    cost,
    timeSeconds,
    xpPerSfl,
    xpPerDay,
  }
}

// ----------------------------------------------------------------------------
// Progresión de Niveles de Bumpkin (Skill Calculator)
// ----------------------------------------------------------------------------

/**
 * Calcula la progresión de niveles para el Bumpkin dado un nivel inicial y objetivo,
 * evaluando la receta óptima seleccionada.
 */
export function calculateLevelProgress(
  startLevel: number,
  targetLevel: number,
  bestRecipe: { xp: number; efficiency: number },
  levelExperienceTable: Record<string | number, number> = levelExperienceRaw as any
): LevelProgressResult {
  const clampedStart = Math.max(1, Math.min(200, startLevel))
  const clampedTarget = Math.max(1, Math.min(200, targetLevel))

  const s = Math.min(clampedStart, clampedTarget)
  const t = Math.max(clampedStart, clampedTarget)

  const startXp = levelExperienceTable[s] || 0
  const targetXp = levelExperienceTable[t] || 0
  const rangeXp = Math.max(0, targetXp - startXp)

  const nextLevelXp = t < 200 ? levelExperienceTable[t + 1] || targetXp : targetXp
  const nextDeltaXp = t < 200 ? nextLevelXp - targetXp : 0

  const eff = bestRecipe.efficiency > 0 ? bestRecipe.efficiency : 1
  const dishXp = bestRecipe.xp > 0 ? bestRecipe.xp : 1

  const dishesRange = rangeXp > 0 ? Math.ceil(rangeXp / dishXp) : 0
  const dishesNextLevel = nextDeltaXp > 0 ? Math.ceil(nextDeltaXp / dishXp) : 0
  const dishesTotal = targetXp > 0 ? Math.ceil(targetXp / dishXp) : 0

  const rangeCost = rangeXp / eff
  const costNextLevel = nextDeltaXp / eff
  const totalCost = targetXp / eff

  const skillsEarnedInRange = Math.max(1, t - s)
  const avgCostPerSkill = rangeCost / skillsEarnedInRange
  const avgXpPerSkill = rangeXp / skillsEarnedInRange
  const dishesAvgSkill = avgXpPerSkill > 0 ? Math.ceil(avgXpPerSkill / dishXp) : 0

  return {
    startLevel: s,
    targetLevel: t,
    startXp,
    targetXp,
    rangeXp,
    rangeCost,
    dishesRange,
    nextLevelXp,
    nextDeltaXp,
    costNextLevel,
    dishesNextLevel,
    totalCost,
    dishesTotal,
    skillsEarnedInRange,
    avgCostPerSkill,
    avgXpPerSkill,
    dishesAvgSkill,
  }
}
