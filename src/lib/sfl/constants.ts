import { getItemPrice, getFlowerPrice } from "./market"
import rawFishList from "../../content/data/sfl/fishing/fish.json"
import rawCrustaceansList from "../../content/data/sfl/fishing/crustaceans.json"
import rawFishMarketList from "../../content/data/sfl/fishing/fish_market.json"

// ============================================================================
// CONSTANTES BASE OFICIALES DE SUNFLOWER LAND
// ============================================================================

export const OFFICIAL_COINS_PER_FLOWER = 320
export const DEFAULT_OIL_MULTIPLIER = 16.67
export const BASE_GEM_FIAT_PRICE = 0.0129
export const CRYPTO_PAYMENT_DISCOUNT = 0.8 // 20% descuento pagando con cripto en SFL

export const OIL_DRILL_RECIPE = {
  coins: 100,
  ingredients: [
    { name: "Wood", amount: 20 },
    { name: "Iron", amount: 9 },
    { name: "Leather", amount: 10 },
  ],
} as const

export const ROD_RECIPE = {
  coins: 20,
  ingredients: [
    { name: "Wood", amount: 3 },
    { name: "Stone", amount: 1 },
  ],
} as const

export const CRAB_POT_RECIPE = {
  coins: 250,
  ingredients: [
    { name: "Feather", amount: 5 },
    { name: "Wool", amount: 3 },
  ],
} as const

export const MARINER_POT_RECIPE = {
  coins: 500,
  ingredients: [
    { name: "Feather", amount: 10 },
    { name: "Merino Wool", amount: 10 },
  ],
} as const

export const FREE_COMPOST_BAITS = new Set(["Earthworm", "Grub", "Red Wiggler"])

// ============================================================================
// 1. GEMAS — Tiers, bonos y conversiones
// ============================================================================

export interface GemCalculation {
  unitFiat: number
  unitUsd: number
  totalUsd: number
  unitFlower: number
  totalFlower: number
  bonusPercent: number
}

/**
 * Retorna el precio fiat base (USD) por gema según los paquetes escalonados del juego.
 */
export function getGemFiatPrice(gems: number): number {
  if (gems < 650) return 1.29 / 100
  if (gems < 1350) return 6.49 / 650
  if (gems < 2800) return 12.99 / 1350
  if (gems < 8000) return 25.99 / 2800
  if (gems < 15500) return 0.0087825 // Hidden tier
  if (gems < 200000) return 129.99 / 15500
  return 1299.99 / 200000
}

/**
 * Calcula el bono porcentual de gemas recibido frente al precio base (0.0129).
 */
export function calculateGemBonus(fiatPricePerGem: number): number {
  if (fiatPricePerGem <= 0) return 0
  return Math.max(0, BASE_GEM_FIAT_PRICE / fiatPricePerGem - 1)
}

/**
 * Calcula el costo en USD por gema y total con el descuento del 20% de pago cripto.
 */
export function calculateGemCostUsd(gems: number = 1): { unitUsd: number; totalUsd: number } {
  const fiatPerGem = getGemFiatPrice(gems)
  const unitUsd = fiatPerGem * CRYPTO_PAYMENT_DISCOUNT
  return {
    unitUsd,
    totalUsd: gems * unitUsd,
  }
}

/**
 * Devuelve el costo de 1 gema expresado en FLOWER según el precio actual de FLOWER.
 */
export function getGemFlowerPrice(gems: number = 1, flowerPrice?: number): number {
  const { unitUsd } = calculateGemCostUsd(gems)
  const effectiveFlowerPrice = flowerPrice && flowerPrice > 0 ? flowerPrice : getFlowerPrice()
  return effectiveFlowerPrice > 0 ? unitUsd / effectiveFlowerPrice : 0
}

/**
 * Desglose completo de gemas para cotizaciones.
 */
export function calculateGems(
  gems: number = 1,
  customBonus?: number | null,
  flowerPrice?: number,
): GemCalculation {
  let unitFiat = BASE_GEM_FIAT_PRICE
  let bonus = 0

  if (customBonus !== undefined && customBonus !== null && customBonus >= 0) {
    bonus = customBonus
    unitFiat = BASE_GEM_FIAT_PRICE / (1 + customBonus)
  } else {
    unitFiat = getGemFiatPrice(gems)
    bonus = calculateGemBonus(unitFiat)
  }

  const unitUsd = unitFiat * CRYPTO_PAYMENT_DISCOUNT
  const totalUsd = gems * unitUsd
  const effectiveFlowerPrice = flowerPrice && flowerPrice > 0 ? flowerPrice : getFlowerPrice()
  const unitFlower = effectiveFlowerPrice > 0 ? unitUsd / effectiveFlowerPrice : 0
  const totalFlower = gems * unitFlower

  return {
    unitFiat,
    unitUsd,
    totalUsd,
    unitFlower,
    totalFlower,
    bonusPercent: Math.round(bonus * 100),
  }
}

// ============================================================================
// 2. PETRÓLEO (OIL) — Costo dinámico del Drill y unidad de Oil
// ============================================================================

export type MaterialPriceResolver = (materialName: string) => number

/**
 * Calcula el costo de fabricar 1 Oil Drill en FLOWER.
 */
export function calculateOilDrillCost(
  coinsPerFlower: number = OFFICIAL_COINS_PER_FLOWER,
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  const coinsFlower = coinsPerFlower > 0 ? OIL_DRILL_RECIPE.coins / coinsPerFlower : 0
  const getPrice = resolveMaterialPrice || getItemPrice

  let materialsFlower = 0
  for (const ing of OIL_DRILL_RECIPE.ingredients) {
    const p = getPrice(ing.name) || 0
    materialsFlower += p * ing.amount
  }

  return coinsFlower + materialsFlower
}

/**
 * Calcula el costo de 1 unidad de Oil dividiendo el costo del Drill entre su producción (16.67 por defecto).
 */
export function calculateOilUnitPrice(
  coinsPerFlower: number = OFFICIAL_COINS_PER_FLOWER,
  multiplier: number = DEFAULT_OIL_MULTIPLIER,
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  if (multiplier <= 0) return 0
  const drillCost = calculateOilDrillCost(coinsPerFlower, resolveMaterialPrice)
  return drillCost / multiplier
}

// ============================================================================
// 3. AGING SHED & CONSUMIBLES DE ANIMALES
// ============================================================================

/**
 * Devuelve el costo de 1 unidad de Refined Salt en FLOWER (10 Salt P2P).
 */
export function getRefinedSaltPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  const getPrice = resolveMaterialPrice || getItemPrice
  const saltPrice = getPrice("Salt") || 0
  return saltPrice * 10
}

/**
 * Devuelve el costo de 1 lote crafteado de Honey Treat (5 Refined Salt + 5 Honey).
 * Cada crafteo produce 6 unidades.
 */
export function getHoneyTreatBatchPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  const getPrice = resolveMaterialPrice || getItemPrice
  const refinedSaltPrice = getRefinedSaltPrice(getPrice)
  const honeyPrice = getPrice("Honey") || 0
  return refinedSaltPrice * 5 + honeyPrice * 5
}

/**
 * Devuelve el costo de 1 unidad individual de Honey Treat en FLOWER (lote / 6).
 */
export function getHoneyTreatPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  return getHoneyTreatBatchPrice(resolveMaterialPrice) / 6
}

/**
 * Devuelve el costo de 1 unidad de Honey Treat en USD según el precio de FLOWER.
 */
export function getHoneyTreatPriceUsd(
  flowerPrice?: number,
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  const effFlowerPrice = flowerPrice && flowerPrice > 0 ? flowerPrice : getFlowerPrice()
  return getHoneyTreatPrice(resolveMaterialPrice) * effFlowerPrice
}

/**
 * Devuelve el costo de 1 lote crafteado de Truffle Seasoning (5 Refined Salt + 10 Truffle).
 * Cada crafteo produce 6 unidades.
 */
export function getTruffleSeasoningBatchPrice(
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  const getPrice = resolveMaterialPrice || getItemPrice
  const refinedSaltPrice = getRefinedSaltPrice(getPrice)
  const trufflePrice = getPrice("Truffle") || 0
  return refinedSaltPrice * 5 + trufflePrice * 10
}

/**
 * Devuelve el costo de 1 unidad individual de Truffle Seasoning en FLOWER (lote / 6).
 */
export function getTruffleSeasoningPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  return getTruffleSeasoningBatchPrice(resolveMaterialPrice) / 6
}

/**
 * Devuelve el costo de 1 unidad de Truffle Seasoning en USD según el precio de FLOWER.
 */
export function getTruffleSeasoningPriceUsd(
  flowerPrice?: number,
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  const effFlowerPrice = flowerPrice && flowerPrice > 0 ? flowerPrice : getFlowerPrice()
  return getTruffleSeasoningPrice(resolveMaterialPrice) * effFlowerPrice
}

/**
 * Devuelve el costo de 1 lote crafteado de Salt Lick (5 Refined Salt).
 * Cada crafteo produce 6 unidades.
 */
export function getSaltLickBatchPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  const getPrice = resolveMaterialPrice || getItemPrice
  const refinedSaltPrice = getRefinedSaltPrice(getPrice)
  return refinedSaltPrice * 5
}

/**
 * Devuelve el costo de 1 unidad individual de Salt Lick en FLOWER (lote / 6).
 */
export function getSaltLickPrice(resolveMaterialPrice?: MaterialPriceResolver): number {
  return getSaltLickBatchPrice(resolveMaterialPrice) / 6
}

/**
 * Devuelve el costo de 1 unidad de Salt Lick en USD según el precio de FLOWER.
 */
export function getSaltLickPriceUsd(
  flowerPrice?: number,
  resolveMaterialPrice?: MaterialPriceResolver,
): number {
  const effFlowerPrice = flowerPrice && flowerPrice > 0 ? flowerPrice : getFlowerPrice()
  return getSaltLickPrice(resolveMaterialPrice) * effFlowerPrice
}

// ============================================================================
// 4. AGING SHED — Costo de curado de peces envejecidos
// ============================================================================

export interface AgedFishCostBreakdown {
  fishId: string
  fishName: string
  saltRequired: number
  timeSeconds: number
  rawFishFlower: number
  saltFlower: number
  totalFlower: number
  totalUsd: number
  agedXp: number
  primeAgedXp: number
}

/**
 * Calcula el desglose de costo de envejecer un pez en la Aging Shed.
 * Costo total = Precio del pez crudo (P2P) + (cantidad de sal × precio unitario de Salt P2P).
 */
export function calculateAgedFishCost(
  fish: {
    id: string
    name: string
    salt: number
    timeSeconds: number
    agedXp: number
    primeAgedXp: number
  },
  resolvePrice?: MaterialPriceResolver,
  flowerPriceUsd?: number,
): AgedFishCostBreakdown {
  const getPrice = resolvePrice || getItemPrice
  const effFlowerPrice = flowerPriceUsd && flowerPriceUsd > 0 ? flowerPriceUsd : getFlowerPrice()

  // El nombre del pez crudo se extrae quitando el prefijo "Aged "
  const rawFishName = fish.name.replace(/^Aged\s+/, "")
  let rawFishFlower = getPrice(rawFishName) || 0

  // Si no cotiza en el mercado P2P directo, resolverlo mediante su costo de pesca
  if (rawFishFlower === 0) {
    const catchCost = calculateFishCatchCost(rawFishName, {
      coinsPerFlower: OFFICIAL_COINS_PER_FLOWER,
      flowerPriceUsd: effFlowerPrice,
      resolveBasePrice: getPrice,
    })
    if (catchCost && catchCost.totalFlower > 0) {
      rawFishFlower = catchCost.totalFlower
    }
  }

  const saltFlower = (getPrice("Salt") || 0) * fish.salt

  const totalFlower = rawFishFlower + saltFlower
  const totalUsd = totalFlower * effFlowerPrice

  return {
    fishId: fish.id,
    fishName: fish.name,
    saltRequired: fish.salt,
    timeSeconds: fish.timeSeconds,
    rawFishFlower,
    saltFlower,
    totalFlower,
    totalUsd,
    agedXp: fish.agedXp,
    primeAgedXp: fish.primeAgedXp,
  }
}

// ============================================================================
// 5. CRAFTING & RESOLUCIÓN UNIVERSAL DE MATERIALES
// ============================================================================

export interface CraftingContext {
  coinsPerFlower: number
  flowerPriceUsd: number
  oilMultiplier?: number
  gemUsd?: number
  resolveTreasureCoins?: (name: string) => number | null
  resolveBasePrice?: (name: string) => number
}

/**
 * Resuelve el costo unitario en FLOWER de cualquier material (Oil, Gem, Tesoros de Jafar o P2P).
 */
export function resolveMaterialFlowerCost(materialName: string, ctx: CraftingContext): number {
  // 1. Oil
  if (materialName === "Oil") {
    return calculateOilUnitPrice(
      ctx.coinsPerFlower,
      ctx.oilMultiplier ?? DEFAULT_OIL_MULTIPLIER,
      ctx.resolveBasePrice || getItemPrice,
    )
  }

  // 2. Gemas
  if (materialName === "Gem" || materialName === "Gems") {
    const gemUsd = ctx.gemUsd ?? calculateGemCostUsd(1).unitUsd
    return ctx.flowerPriceUsd > 0 ? gemUsd / ctx.flowerPriceUsd : 0
  }

  // 3. Aging Shed, Especias y Tratos de Animales
  if (materialName === "Refined Salt") {
    return getRefinedSaltPrice(ctx.resolveBasePrice || getItemPrice)
  }
  if (materialName === "Honey Treat") {
    return getHoneyTreatPrice(ctx.resolveBasePrice || getItemPrice)
  }
  if (materialName === "Truffle Seasoning") {
    return getTruffleSeasoningPrice(ctx.resolveBasePrice || getItemPrice)
  }
  if (materialName === "Salt Lick") {
    return getSaltLickPrice(ctx.resolveBasePrice || getItemPrice)
  }

  // 4. Tesoros de Jafar (con valor tasado en Coins)
  if (ctx.resolveTreasureCoins) {
    const treasureCoins = ctx.resolveTreasureCoins(materialName)
    if (treasureCoins !== null && treasureCoins > 0 && ctx.coinsPerFlower > 0) {
      return treasureCoins / ctx.coinsPerFlower
    }
  }

  // 5. Herramientas de Pesca
  if (materialName === "Rod") {
    return calculateRodCost(ctx)
  }
  if (materialName === "Crab Pot") {
    return calculateCrabPotCost(ctx)
  }
  if (materialName === "Mariner Pot") {
    return calculateMarinerPotCost(ctx)
  }

  // 6. Crustáceos de Trampa
  if (isCrustacean(materialName)) {
    const crust = calculateCrustaceanCost(materialName, ctx)
    if (crust && crust.totalFlower > 0) return crust.totalFlower
  }

  // 7. Cebos Especializados del Fish Market
  if (isFishMarketBait(materialName)) {
    const baitAvg = calculateFishMarketBaitAverageCost(materialName, ctx)
    if (baitAvg && baitAvg.totalFlower > 0) return baitAvg.totalFlower
  }

  // 8. Peces Regulares de Caña
  if (isFish(materialName)) {
    const fishCost = calculateFishCatchCost(materialName, ctx)
    if (fishCost && fishCost.totalFlower > 0) return fishCost.totalFlower
  }

  // 9. Recursos P2P estándar
  const getPrice = ctx.resolveBasePrice || getItemPrice
  return getPrice(materialName) || 0
}

export interface CraftCostBreakdown {
  coins: number
  coinsFlower: number
  materialsFlower: number
  totalFlower: number
  totalUsd: number
}

/**
 * Calcula el desglose completo del costo de crafteo para cualquier ítem.
 */
export function calculateItemCraftCost(
  item: { coins?: number; ingredients?: Array<{ name: string; amount: number }> },
  qty: number = 1,
  ctx: CraftingContext,
): CraftCostBreakdown {
  const unitCoins = item.coins || 0
  const totalCoins = unitCoins * qty
  const coinsFlower = ctx.coinsPerFlower > 0 ? totalCoins / ctx.coinsPerFlower : 0

  let materialsFlower = 0
  if (item.ingredients && item.ingredients.length > 0) {
    for (const ing of item.ingredients) {
      const unitP = resolveMaterialFlowerCost(ing.name, ctx)
      materialsFlower += unitP * ing.amount * qty
    }
  }

  const totalFlower = coinsFlower + materialsFlower
  const totalUsd = totalFlower * ctx.flowerPriceUsd

  return {
    coins: totalCoins,
    coinsFlower,
    materialsFlower,
    totalFlower,
    totalUsd,
  }
}

// ============================================================================
// 6. PESCA & TRAMPAS DE AGUA (FISH & CRUSTACEANS)
// ============================================================================

export interface FishCatchCostBreakdown {
  id: string
  name: string
  tier: "basic" | "advanced" | "expert"
  rodFlower: number
  selectedBait: string
  baitFlower: number
  selectedChum?: {
    item: string
    amount: number
    unitFlower: number
    totalFlower: number
  }
  chumFlower: number
  totalFlower: number
  totalUsd: number
  xp: number
}

export interface CrustaceanCatchCostBreakdown {
  id: string
  name: string
  trap: "Crab Pot" | "Mariner Pot"
  trapFlower: number
  selectedChum?: {
    item: string
    amount: number
    unitFlower: number
    totalFlower: number
  }
  chumIngredients: Array<{
    name: string
    amount: number
    unitFlower: number
    totalFlower: number
  }>
  chumFlower: number
  totalFlower: number
  totalUsd: number
  readyTimeHours: number
  requiredBumpkinLevel: number
}

export interface FishMarketBaitCostBreakdown {
  id: string
  name: string
  season?: string
  ingredients: Array<{
    name: string
    amount: number
    unitFlower: number
    totalFlower: number
  }>
  totalFlower: number
  totalUsd: number
  craftTimeHours: number
}

// Lookups rápidos indexados
const _fishByName = new Map<string, (typeof rawFishList)[number]>()
const _crustaceansByName = new Map<string, (typeof rawCrustaceansList)[number]>()
const _fishMarketByName = new Map<string, (typeof rawFishMarketList)[number]>()

function _normName(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "")
}

for (const f of rawFishList as Array<(typeof rawFishList)[number]>) {
  _fishByName.set(_normName(f.id), f)
  _fishByName.set(_normName(f.name), f)
}

for (const c of rawCrustaceansList as Array<(typeof rawCrustaceansList)[number]>) {
  _crustaceansByName.set(_normName(c.id), c)
  _crustaceansByName.set(_normName(c.name), c)
}

for (const m of rawFishMarketList as Array<(typeof rawFishMarketList)[number]>) {
  _fishMarketByName.set(_normName(m.id), m)
  _fishMarketByName.set(_normName(m.name), m)
}

export function isFish(nameOrId: string): boolean {
  return _fishByName.has(_normName(nameOrId))
}

export function isCrustacean(nameOrId: string): boolean {
  return _crustaceansByName.has(_normName(nameOrId))
}

export function isFishMarketBait(nameOrId: string): boolean {
  return _fishMarketByName.has(_normName(nameOrId))
}

export function getFishData(nameOrId: string) {
  return _fishByName.get(_normName(nameOrId)) || null
}

export function getCrustaceanData(nameOrId: string) {
  return _crustaceansByName.get(_normName(nameOrId)) || null
}

export function getFishMarketData(nameOrId: string) {
  return _fishMarketByName.get(_normName(nameOrId)) || null
}

export function calculateRodCost(ctx: CraftingContext): number {
  return calculateItemCraftCost(ROD_RECIPE, 1, ctx).totalFlower
}

export function calculateCrabPotCost(ctx: CraftingContext): number {
  return calculateItemCraftCost(CRAB_POT_RECIPE, 1, ctx).totalFlower
}

export function calculateMarinerPotCost(ctx: CraftingContext): number {
  return calculateItemCraftCost(MARINER_POT_RECIPE, 1, ctx).totalFlower
}

/**
 * Calcula el costo más óptimo/económico de captura para un pez regular (caña + min cebo + min chum).
 */
export function calculateFishCatchCost(
  fishNameOrId: string,
  ctx: CraftingContext,
): FishCatchCostBreakdown | null {
  const fish = _fishByName.get(_normName(fishNameOrId))
  if (!fish) return null

  // 1. Costo Caña (Rod)
  const rodFlower = calculateRodCost(ctx)

  // 2. Cebo más económico (min Baits)
  let selectedBait = fish.baits[0] || "Earthworm"
  let baitFlower = Infinity

  for (const bait of fish.baits) {
    if (FREE_COMPOST_BAITS.has(bait)) {
      baitFlower = 0
      selectedBait = bait
      break // La lombriz de compostera gratuita es el mínimo absoluto (0)
    }
    const cost = resolveMaterialFlowerCost(bait, ctx)
    if (cost < baitFlower) {
      baitFlower = cost
      selectedBait = bait
    }
  }
  if (!Number.isFinite(baitFlower)) {
    baitFlower = 0
  }

  // 3. Chum más económico (min Chum)
  let selectedChum: FishCatchCostBreakdown["selectedChum"] = undefined
  let chumFlower = 0

  if (fish.chum && fish.chum.length > 0) {
    chumFlower = Infinity
    for (const option of fish.chum) {
      const unitFlower = resolveMaterialFlowerCost(option.item, ctx)
      const optTotal = unitFlower * option.amount
      if (optTotal < chumFlower) {
        chumFlower = optTotal
        selectedChum = {
          item: option.item,
          amount: option.amount,
          unitFlower,
          totalFlower: optTotal,
        }
      }
    }
    if (!Number.isFinite(chumFlower)) {
      chumFlower = 0
    }
  }

  const totalFlower = rodFlower + baitFlower + chumFlower
  const totalUsd = totalFlower * ctx.flowerPriceUsd

  return {
    id: fish.id,
    name: fish.name,
    tier: fish.tier as "basic" | "advanced" | "expert",
    rodFlower,
    selectedBait,
    baitFlower,
    selectedChum,
    chumFlower,
    totalFlower,
    totalUsd,
    xp: fish.xp,
  }
}

/**
 * Calcula el costo de captura para un crustáceo de trampa (trampa + insumos obligatorios de chum).
 */
export function calculateCrustaceanCost(
  crustaceanNameOrId: string,
  ctx: CraftingContext,
): CrustaceanCatchCostBreakdown | null {
  const crustacean = _crustaceansByName.get(_normName(crustaceanNameOrId))
  if (!crustacean) return null

  // 1. Trampa requerida (Crab Pot o Mariner Pot)
  const isMariner = crustacean.trap === "Mariner Pot"
  const trapFlower = isMariner ? calculateMarinerPotCost(ctx) : calculateCrabPotCost(ctx)

  // 2. Chum más económico (min Chum) — son alternativas excluyentes, no acumulativas
  let selectedChum: CrustaceanCatchCostBreakdown["selectedChum"] = undefined
  let chumFlower = 0

  if (crustacean.chum && crustacean.chum.length > 0) {
    let bestChumFlower = Infinity
    for (const option of crustacean.chum) {
      const unitFlower = resolveMaterialFlowerCost(option.item, ctx)
      const optTotal = unitFlower * option.amount
      if (optTotal < bestChumFlower) {
        bestChumFlower = optTotal
        selectedChum = {
          item: option.item,
          amount: option.amount,
          unitFlower,
          totalFlower: optTotal,
        }
      }
    }
    if (Number.isFinite(bestChumFlower)) {
      chumFlower = bestChumFlower
    }
  }

  const chumIngredients: CrustaceanCatchCostBreakdown["chumIngredients"] = selectedChum
    ? [
        {
          name: selectedChum.item,
          amount: selectedChum.amount,
          unitFlower: selectedChum.unitFlower,
          totalFlower: selectedChum.totalFlower,
        },
      ]
    : []

  const totalFlower = trapFlower + chumFlower
  const totalUsd = totalFlower * ctx.flowerPriceUsd

  return {
    id: crustacean.id,
    name: crustacean.name,
    trap: crustacean.trap as "Crab Pot" | "Mariner Pot",
    trapFlower,
    selectedChum,
    chumIngredients,
    chumFlower,
    totalFlower,
    totalUsd,
    readyTimeHours: crustacean.readyTimeHours,
    requiredBumpkinLevel: crustacean.requiredBumpkinLevel,
  }
}

/**
 * Calcula el costo de fabricación de un cebo del Fish Market para una estación específica.
 */
export function calculateFishMarketBaitCost(
  baitNameOrId: string,
  season: "spring" | "summer" | "autumn" | "winter",
  ctx: CraftingContext,
): FishMarketBaitCostBreakdown | null {
  const item = _fishMarketByName.get(_normName(baitNameOrId))
  if (!item) return null

  const seasonalMap =
    (item.seasonalIngredients as Record<string, Record<string, number>>)?.[season] || {}

  const allIngredientsMap: Record<string, number> = {
    ...(item.baseIngredients || {}),
    ...seasonalMap,
  }

  const ingredients: FishMarketBaitCostBreakdown["ingredients"] = []
  let totalFlower = 0

  for (const [name, amount] of Object.entries(allIngredientsMap)) {
    const unitFlower = resolveMaterialFlowerCost(name, ctx)
    const ingTotal = unitFlower * Number(amount)
    totalFlower += ingTotal
    ingredients.push({
      name,
      amount: Number(amount),
      unitFlower,
      totalFlower: ingTotal,
    })
  }

  const totalUsd = totalFlower * ctx.flowerPriceUsd
  const timeHours = Number(item.craftTimeHours) || 1

  return {
    id: `${item.id}_${season}`,
    name: `${item.name} (${season.charAt(0).toUpperCase() + season.slice(1)})`,
    season,
    ingredients,
    totalFlower,
    totalUsd,
    craftTimeHours: timeHours,
  }
}

/**
 * Calcula el costo promedio de las 4 estaciones para un cebo del Fish Market (Σ / 4).
 */
export function calculateFishMarketBaitAverageCost(
  baitNameOrId: string,
  ctx: CraftingContext,
): FishMarketBaitCostBreakdown | null {
  const item = _fishMarketByName.get(_normName(baitNameOrId))
  if (!item) return null

  const seasons = ["spring", "summer", "autumn", "winter"] as const
  let sumFlower = 0
  const seasonalBreakdowns: FishMarketBaitCostBreakdown[] = []

  for (const s of seasons) {
    const b = calculateFishMarketBaitCost(item.id, s, ctx)
    if (b) {
      sumFlower += b.totalFlower
      seasonalBreakdowns.push(b)
    }
  }

  const avgFlower = seasonalBreakdowns.length > 0 ? sumFlower / seasonalBreakdowns.length : 0
  const avgUsd = avgFlower * ctx.flowerPriceUsd

  const consolidatedIngredientsMap = new Map<string, number>()
  for (const b of seasonalBreakdowns) {
    for (const ing of b.ingredients) {
      const cur = consolidatedIngredientsMap.get(ing.name) || 0
      consolidatedIngredientsMap.set(ing.name, cur + ing.amount / seasonalBreakdowns.length)
    }
  }

  const ingredients: FishMarketBaitCostBreakdown["ingredients"] = []
  for (const [name, avgAmount] of consolidatedIngredientsMap.entries()) {
    const unitFlower = resolveMaterialFlowerCost(name, ctx)
    ingredients.push({
      name,
      amount: avgAmount,
      unitFlower,
      totalFlower: unitFlower * avgAmount,
    })
  }

  return {
    id: item.id,
    name: item.name,
    ingredients,
    totalFlower: avgFlower,
    totalUsd: avgUsd,
    craftTimeHours: Number(item.craftTimeHours) || 1,
  }
}

export function getAllFishCatchCosts(ctx: CraftingContext): FishCatchCostBreakdown[] {
  const results: FishCatchCostBreakdown[] = []
  for (const f of rawFishList as Array<(typeof rawFishList)[number]>) {
    const c = calculateFishCatchCost(f.id, ctx)
    if (c) results.push(c)
  }
  return results
}

export function getAllCrustaceanCatchCosts(ctx: CraftingContext): CrustaceanCatchCostBreakdown[] {
  const results: CrustaceanCatchCostBreakdown[] = []
  for (const c of rawCrustaceansList as Array<(typeof rawCrustaceansList)[number]>) {
    const res = calculateCrustaceanCost(c.id, ctx)
    if (res) results.push(res)
  }
  return results
}
