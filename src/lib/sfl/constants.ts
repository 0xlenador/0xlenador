import { getItemPrice, getFlowerPrice } from "./market"

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
  const rawFishFlower = getPrice(rawFishName) || 0
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

  // 5. Recursos P2P estándar
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
