// ============================================================
// src/lib/sfl/prices.ts
// Motor Universal de Cálculos Económicos y Costos de Sunflower Land.
//
// Arquitectura: Grafo Dirigido Acíclico (DAG) con resolución recursiva,
// detección de ciclos, memoización y desglose en materias primas base.
//
// Responsabilidad única: Proveer a cualquier calculadora o vista
// de la web el costo de fabricación (craftCost), precio de mercado P2P,
// arbitraje y desglose de componentes para CUALQUIER ítem del juego,
// de forma 100% declarativa y escalable a miles de recetas.
// ============================================================

import { getItemPrice, getFlowerPrice, getBettyRatio } from "./market"
import {
  calculateGemCostUsd,
  calculateAgedFishCost,
  OFFICIAL_COINS_PER_FLOWER,
  type MaterialPriceResolver,
  type AgedFishCostBreakdown,
} from "./constants"
import { getRecipe, getAllRecipes, type UnifiedRecipe } from "./recipes"
import { jafarData } from "../../content/data/sfl/jafar_shop"

// Catálogo indexado de tesoros de playa vendidos a Jafar (name -> coins)
const _jafarTreasures = new Map<string, number>()
const _jafarSellTab = (jafarData as any)?.npc?.tabs?.find((t: any) => t.id === "sell")
if (_jafarSellTab) {
  for (const cat of _jafarSellTab.categories) {
    if (cat?.items) {
      for (const item of cat.items) {
        if (item?.name && typeof item.coins === "number") {
          _jafarTreasures.set(item.name.toLowerCase().trim(), item.coins)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tipos e Interfaces Públicas
// ---------------------------------------------------------------------------

export interface UnitCost {
  flower: number
  usd: number
}

export interface CalculationContext {
  /** Precio de 1 FLOWER en USD. Si no se provee, consulta market.ts en tiempo real. */
  flowerPriceUsd?: number
  /** Tasa de conversión Coins por 1 FLOWER. Si no se provee, consulta la tasa Betty activa. */
  coinsPerFlower?: number
  /** Resolver personalizado para precios base de materiales (útil para simulaciones o testing). */
  resolveBasePrice?: MaterialPriceResolver
  /** Si true, si un componente intermedio se vende en P2P más barato que fabricarlo, toma el precio P2P. Default: false (calcula el costo de fabricación puro desde la raíz). */
  useOpportunityCost?: boolean
}

export interface IngredientBreakdown {
  name: string
  amount: number
  unitPriceFlower: number
  totalFlower: number
  isBaseResource: boolean
}

export interface BaseMaterialSummary {
  name: string
  amount: number
  totalFlower: number
}

export interface CostResolution {
  /** Nombre canónico del ítem */
  name: string
  /** Identificador único */
  id: string
  /** Tipo de entidad */
  kind: "recipe" | "p2p_resource" | "currency"
  /** Categoría del subsistema (ej: "cooking", "aging_shed", "blacksmith", "animals", "oil") */
  category?: string
  /** Edificio de producción (ej: "Deli", "Aging Shed", "Blacksmith", "Fire Pit") */
  building?: string
  /** Unidades producidas por lote (default: 1) */
  yield: number

  // --- Costo de Fabricación (Craft Cost) ---
  /** Indica si el ítem tiene receta de fabricación conocida */
  isCraftable: boolean
  /** Costo unitario de fabricación en FLOWER (lote ÷ yield) */
  craftCostFlower: number
  /** Costo unitario de fabricación en USD */
  craftCostUsd: number

  // --- Precio de Mercado P2P ---
  /** Indica si el ítem cotiza actualmente en el libro de órdenes P2P */
  hasMarketPrice: boolean
  /** Precio unitario actual en el mercado P2P en FLOWER */
  marketPriceFlower: number
  /** Precio unitario actual en el mercado P2P en USD */
  marketPriceUsd: number

  // --- Arbitraje / Margen de Fabricación ---
  /** Análisis de oportunidad: ¿Conviene fabricarlo o comprarlo en P2P? */
  arbitrage?: {
    cheaperToCraft: boolean
    /** Diferencia en FLOWER: marketPrice - craftCost (positivo = fabricar es más barato) */
    spreadFlower: number
    /** Porcentaje de ahorro fabricándolo tú mismo vs comprar en P2P */
    savingsPercent: number
  }

  // --- Desglose Directo de Ingredientes de la Receta ---
  coins: number
  coinsFlower: number
  ingredients: IngredientBreakdown[]

  // --- Desglose Aplanado a Materias Primas Raíz (DAG Flattened) ---
  /** Lista consolidada de materias primas base P2P requeridas (Wood, Salt, etc.) */
  baseMaterials: BaseMaterialSummary[]

  // --- Metadatos Operativos ---
  timeSeconds?: number
  xp?: number
  agedXp?: number
  primeAgedXp?: number
  image?: string
}

// ---------------------------------------------------------------------------
// Motor de Grafo Recursivo (DAG Solver)
// ---------------------------------------------------------------------------

class DagCostSolver {
  private memo = new Map<string, CostResolution>()
  private ctx: CalculationContext

  constructor(ctx: CalculationContext = {}) {
    this.ctx = ctx
  }

  private get flowerPrice(): number {
    return this.ctx.flowerPriceUsd && this.ctx.flowerPriceUsd > 0
      ? this.ctx.flowerPriceUsd
      : getFlowerPrice()
  }

  private get coinsRate(): number {
    if (this.ctx.coinsPerFlower && this.ctx.coinsPerFlower > 0) {
      return this.ctx.coinsPerFlower
    }
    const betty = getBettyRatio()
    return betty > 0 ? betty : OFFICIAL_COINS_PER_FLOWER
  }

  private getBasePrice(name: string): number {
    if (this.ctx.resolveBasePrice) return this.ctx.resolveBasePrice(name)
    return getItemPrice(name) || 0
  }

  /**
   * Resuelve cualquier ítem recursivamente navegando su árbol de dependencias.
   */
  public resolve(nameOrId: string, visited: Set<string> = new Set()): CostResolution {
    const query = nameOrId.toLowerCase().trim()
    const memoKey = query

    if (this.memo.has(memoKey)) {
      return this.memo.get(memoKey)!
    }

    // Prevención de ciclos infinitos en el grafo (A -> B -> A)
    if (visited.has(query)) {
      console.warn(`[SflCostEngine] Ciclo circular detectado en el grafo para: "${nameOrId}"`)
      return this.createFallback(nameOrId)
    }

    const currentVisited = new Set(visited)
    currentVisited.add(query)

    // 1. Monedas Especiales y Fiduciarias
    if (query === "coins" || query === "coin") {
      const unitFlower = this.coinsRate > 0 ? 1 / this.coinsRate : 0
      const res: CostResolution = {
        name: "Coins",
        id: "coins",
        kind: "currency",
        yield: 1,
        isCraftable: false,
        craftCostFlower: unitFlower,
        craftCostUsd: unitFlower * this.flowerPrice,
        hasMarketPrice: false,
        marketPriceFlower: 0,
        marketPriceUsd: 0,
        coins: 1,
        coinsFlower: unitFlower,
        ingredients: [],
        baseMaterials: [],
      }
      this.memo.set(memoKey, res)
      return res
    }

    if (query === "gem" || query === "gems") {
      const gemUsd = calculateGemCostUsd(1).unitUsd
      const unitFlower = this.flowerPrice > 0 ? gemUsd / this.flowerPrice : 0
      const res: CostResolution = {
        name: "Gem",
        id: "gem",
        kind: "currency",
        yield: 1,
        isCraftable: false,
        craftCostFlower: unitFlower,
        craftCostUsd: gemUsd,
        hasMarketPrice: false,
        marketPriceFlower: 0,
        marketPriceUsd: 0,
        coins: 0,
        coinsFlower: 0,
        ingredients: [],
        baseMaterials: [],
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 2. Tesoros de Playa vendidos a Jafar (Crab, Seaweed, Starfish, etc.)
    const treasureCoins = _jafarTreasures.get(query)
    if (treasureCoins !== undefined) {
      const unitFlower = this.coinsRate > 0 ? treasureCoins / this.coinsRate : 0
      const unitUsd = unitFlower * this.flowerPrice
      const res: CostResolution = {
        name: nameOrId,
        id: query.replace(/[^a-z0-9]+/g, "_"),
        kind: "p2p_resource",
        category: "treasure",
        yield: 1,
        isCraftable: false,
        craftCostFlower: unitFlower,
        craftCostUsd: unitUsd,
        hasMarketPrice: true,
        marketPriceFlower: unitFlower,
        marketPriceUsd: unitUsd,
        coins: treasureCoins,
        coinsFlower: unitFlower,
        ingredients: [],
        baseMaterials: [{ name: nameOrId, amount: 1, totalFlower: unitFlower }],
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 3. ¿Tiene Receta de Fabricación en el Catálogo Declarativo?
    const recipe = getRecipe(nameOrId)
    const marketPriceFlower = this.getBasePrice(recipe ? recipe.name : nameOrId)
    const marketPriceUsd = marketPriceFlower * this.flowerPrice
    const hasMarketPrice = marketPriceFlower > 0

    if (!recipe) {
      // Es un nodo terminal / Recurso Base (Wood, Salt, Gold, pez crudo, cultivo base, etc.)
      const res: CostResolution = {
        name: nameOrId,
        id: query.replace(/[^a-z0-9]+/g, "_"),
        kind: "p2p_resource",
        yield: 1,
        isCraftable: false,
        craftCostFlower: marketPriceFlower,
        craftCostUsd: marketPriceUsd,
        hasMarketPrice,
        marketPriceFlower,
        marketPriceUsd,
        coins: 0,
        coinsFlower: 0,
        ingredients: [],
        baseMaterials: hasMarketPrice
          ? [{ name: nameOrId, amount: 1, totalFlower: marketPriceFlower }]
          : [],
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 3. Resolución Compuesta de Receta (DAG traversal)
    const recipeYield = recipe.yield > 0 ? recipe.yield : 1
    const coinsRequired = recipe.coins || 0
    const coinsFlower = this.coinsRate > 0 ? coinsRequired / this.coinsRate : 0

    let totalBatchMaterialsFlower = 0
    const ingredientsBreakdown: IngredientBreakdown[] = []
    const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()

    for (const ing of recipe.ingredients) {
      const resolvedSub = this.resolve(ing.name, currentVisited)

      // Determinación del costo efectivo del componente
      let effectiveUnitFlower = resolvedSub.craftCostFlower
      if (this.ctx.useOpportunityCost && resolvedSub.hasMarketPrice) {
        effectiveUnitFlower = Math.min(resolvedSub.craftCostFlower, resolvedSub.marketPriceFlower)
      }

      const totalIngFlower = effectiveUnitFlower * ing.amount
      totalBatchMaterialsFlower += totalIngFlower

      ingredientsBreakdown.push({
        name: resolvedSub.name,
        amount: ing.amount,
        unitPriceFlower: effectiveUnitFlower,
        totalFlower: totalIngFlower,
        isBaseResource: !resolvedSub.isCraftable,
      })

      // Acumular materias primas base aplanadas (DAG flattening)
      if (resolvedSub.baseMaterials.length > 0) {
        for (const base of resolvedSub.baseMaterials) {
          const scaledAmount = (base.amount / resolvedSub.yield) * ing.amount
          const scaledFlower = (base.totalFlower / resolvedSub.yield) * ing.amount
          const existing = baseMaterialsMap.get(base.name)
          if (existing) {
            existing.amount += scaledAmount
            existing.totalFlower += scaledFlower
          } else {
            baseMaterialsMap.set(base.name, {
              amount: scaledAmount,
              totalFlower: scaledFlower,
            })
          }
        }
      } else if (!resolvedSub.isCraftable) {
        const existing = baseMaterialsMap.get(resolvedSub.name)
        if (existing) {
          existing.amount += ing.amount
          existing.totalFlower += totalIngFlower
        } else {
          baseMaterialsMap.set(resolvedSub.name, {
            amount: ing.amount,
            totalFlower: totalIngFlower,
          })
        }
      }
    }

    const totalBatchFlower = coinsFlower + totalBatchMaterialsFlower
    const unitCraftFlower = totalBatchFlower / recipeYield
    const unitCraftUsd = unitCraftFlower * this.flowerPrice

    // Consolidación de materias primas base por unidad final
    const baseMaterials: BaseMaterialSummary[] = []
    for (const [matName, data] of baseMaterialsMap.entries()) {
      baseMaterials.push({
        name: matName,
        amount: Number((data.amount / recipeYield).toFixed(4)),
        totalFlower: Number((data.totalFlower / recipeYield).toFixed(6)),
      })
    }

    // Análisis de arbitraje si existe en P2P
    let arbitrage: CostResolution["arbitrage"] = undefined
    if (hasMarketPrice && unitCraftFlower > 0) {
      const spreadFlower = marketPriceFlower - unitCraftFlower
      const cheaperToCraft = spreadFlower > 0
      const savingsPercent = marketPriceFlower > 0 ? (spreadFlower / marketPriceFlower) * 100 : 0
      arbitrage = {
        cheaperToCraft,
        spreadFlower: Number(spreadFlower.toFixed(6)),
        savingsPercent: Number(savingsPercent.toFixed(2)),
      }
    }

    const resolution: CostResolution = {
      name: recipe.name,
      id: recipe.id,
      kind: "recipe",
      category: recipe.category,
      building: recipe.building,
      yield: recipeYield,
      isCraftable: true,
      craftCostFlower: Number(unitCraftFlower.toFixed(6)),
      craftCostUsd: Number(unitCraftUsd.toFixed(4)),
      hasMarketPrice,
      marketPriceFlower: Number(marketPriceFlower.toFixed(6)),
      marketPriceUsd: Number(marketPriceUsd.toFixed(4)),
      arbitrage,
      coins: coinsRequired,
      coinsFlower: Number(coinsFlower.toFixed(6)),
      ingredients: ingredientsBreakdown,
      baseMaterials,
      timeSeconds: recipe.timeSeconds,
      xp: recipe.xp,
      agedXp: recipe.agedXp,
      primeAgedXp: recipe.primeAgedXp,
      image: recipe.image,
    }

    this.memo.set(memoKey, resolution)
    return resolution
  }

  private createFallback(name: string): CostResolution {
    return {
      name,
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      kind: "p2p_resource",
      yield: 1,
      isCraftable: false,
      craftCostFlower: 0,
      craftCostUsd: 0,
      hasMarketPrice: false,
      marketPriceFlower: 0,
      marketPriceUsd: 0,
      coins: 0,
      coinsFlower: 0,
      ingredients: [],
      baseMaterials: [],
    }
  }
}

// ---------------------------------------------------------------------------
// API Pública del Motor Universal de Cálculos
// ---------------------------------------------------------------------------

/**
 * Resuelve el desglose económico completo de CUALQUIER ítem de Sunflower Land.
 *
 * Funciona de forma totalmente declarativa: navega recursivamente el grafo de recetas,
 * calcula costos de ingredientes anidados, convierte monedas, detecta precios P2P y
 * genera análisis de arbitraje y desglose plano de materias primas.
 *
 * @example
 * const res = resolveCost("Pizza Margherita")
 * console.log(res.craftCostFlower) // Costo total calculado
 * console.log(res.baseMaterials)   // Desglose aplanado a Tomato, Milk, Wheat
 * console.log(res.arbitrage)       // Margen si se vende en P2P
 */
export function resolveCost(nameOrId: string, ctx?: CalculationContext): CostResolution {
  const solver = new DagCostSolver(ctx)
  return solver.resolve(nameOrId)
}

/**
 * Resuelve los costos de todas las recetas registradas en el catálogo.
 */
export function resolveAllCosts(ctx?: CalculationContext): CostResolution[] {
  const solver = new DagCostSolver(ctx)
  return getAllRecipes().map((r) => solver.resolve(r.name))
}

/**
 * Resuelve los costos de todas las recetas producidas en un edificio específico
 * (ej: "Aging Shed", "Deli", "Fire Pit", "Blacksmith", "Kitchen").
 */
export function resolveRecipesByBuilding(
  building: string,
  ctx?: CalculationContext,
): CostResolution[] {
  const needle = building.toLowerCase().trim()
  const solver = new DagCostSolver(ctx)
  return getAllRecipes()
    .filter((r) => r.building?.toLowerCase().trim() === needle)
    .map((r) => solver.resolve(r.name))
}

// ---------------------------------------------------------------------------
// API Retrocompatible (Garantiza Cero Regresiones en Vistas Existentes)
// ---------------------------------------------------------------------------

/**
 * Devuelve el costo unitario simple en FLOWER y USD de cualquier ítem.
 * Respeta la firma histórica consumida por calculadoras y vistas.
 */
export function getUnitCost(
  itemName: string,
  flowerPriceUsd?: number,
  resolvePrice?: MaterialPriceResolver,
): UnitCost {
  const res = resolveCost(itemName, {
    flowerPriceUsd,
    resolveBasePrice: resolvePrice,
  })

  // Si tiene precio en P2P y no es crafteable, toma el precio P2P.
  // Si es crafteable, toma el costo de crafteo.
  const flower = res.isCraftable ? res.craftCostFlower : res.marketPriceFlower
  const effFlowerPrice = flowerPriceUsd && flowerPriceUsd > 0 ? flowerPriceUsd : getFlowerPrice()

  return {
    flower,
    usd: flower * effFlowerPrice,
  }
}

/**
 * Devuelve el costo de envejecer un pez en la Aging Shed en el formato
 * exacto `AgedFishCostBreakdown` de `constants.ts`.
 */
export function getAgedFishCost(
  fishNameOrId: string,
  flowerPriceUsd?: number,
  resolvePrice?: MaterialPriceResolver,
): AgedFishCostBreakdown | null {
  const recipe = getRecipe(fishNameOrId)
  if (!recipe || recipe.category !== "aging_shed" || !recipe.name.startsWith("Aged ")) {
    return null
  }

  // Extrae el pez en el formato esperado por constants.ts
  const rawFishName = recipe.name.replace(/^Aged\s+/, "")
  const saltIng = recipe.ingredients.find((i) => i.name === "Salt")
  const saltAmount = saltIng ? saltIng.amount : 0

  return calculateAgedFishCost(
    {
      id: recipe.id,
      name: recipe.name,
      salt: saltAmount,
      timeSeconds: recipe.timeSeconds || 0,
      agedXp: recipe.agedXp || 0,
      primeAgedXp: recipe.primeAgedXp || 0,
    },
    resolvePrice || getItemPrice,
    flowerPriceUsd,
  )
}

/**
 * Retorna el desglose de costos de los 38 peces curados de la Aging Shed.
 */
export function getAllAgedFishCosts(
  flowerPriceUsd?: number,
  resolvePrice?: MaterialPriceResolver,
): AgedFishCostBreakdown[] {
  const agingRecipes = getAllRecipes().filter(
    (r) => r.category === "aging_shed" && r.name.startsWith("Aged "),
  )

  return agingRecipes
    .map((r) => getAgedFishCost(r.name, flowerPriceUsd, resolvePrice))
    .filter((r): r is AgedFishCostBreakdown => r !== null)
}
