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
  isFish,
  isCrustacean,
  isFishMarketBait,
  getFishData,
  getCrustaceanData,
  getFishMarketData,
  FREE_COMPOST_BAITS,
  GUARANTEED_CHUM_COMBOS,
  APEX_SHARKS,
  getAllFishCatchCosts,
  getAllCrustaceanCatchCosts,
  type FishCatchCostBreakdown,
  type CrustaceanCatchCostBreakdown,
  type FishMarketBaitCostBreakdown,
  isCaveResource,
  getCanonicalCaveResourceName,
  calculateSandShovelCost,
  calculateCaveBatchCost,
  calculateCaveResourceCost,
  calculateFishingLureCost,
  FINN_FISHING_LURE_TRADE,
  type FishingLureCostBreakdown,
  SAND_SHOVEL_RECIPE,
  DEFAULT_BEETLE_FALLBACK_PRICES,
  type CaveBatchCostBreakdown,
} from "./constants"
import {
  getRecipe,
  getAllRecipes,
  type UnifiedRecipe,
  CURRENT_SEASON,
  isSeasonalTicket,
  getCurrentSeason,
  type SeasonConfig,
} from "./crafting"
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

    // 1.1 Boleto de Temporada Activo (Seasonal Currency: ej. Beetle Wing)
    if (isSeasonalTicket(nameOrId)) {
      const ticketMarketFlower = this.getBasePrice(CURRENT_SEASON.ticketName)
      const ticketMarketUsd = ticketMarketFlower * this.flowerPrice
      const hasTicketMarket = ticketMarketFlower > 0
      const res: CostResolution = {
        name: CURRENT_SEASON.ticketName,
        id: CURRENT_SEASON.ticketName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        kind: "currency",
        category: "seasonal",
        yield: 1,
        isCraftable: false,
        craftCostFlower: ticketMarketFlower,
        craftCostUsd: ticketMarketUsd,
        hasMarketPrice: hasTicketMarket,
        marketPriceFlower: ticketMarketFlower,
        marketPriceUsd: ticketMarketUsd,
        coins: 0,
        coinsFlower: 0,
        ingredients: [],
        baseMaterials: hasTicketMarket
          ? [{ name: CURRENT_SEASON.ticketName, amount: 1, totalFlower: ticketMarketFlower }]
          : [],
        image: CURRENT_SEASON.ticketImage,
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

    // 2.1 Sand Shovel (Herramienta de Excavación)
    if (query === "sand shovel" || query === "sand_shovel") {
      const coinsShovel = SAND_SHOVEL_RECIPE.coins
      const coinsFlower = this.coinsRate > 0 ? coinsShovel / this.coinsRate : 0
      const woodRes = this.resolve("Wood", currentVisited)
      const stoneRes = this.resolve("Stone", currentVisited)

      const woodUnit = woodRes.craftCostFlower > 0 ? woodRes.craftCostFlower : woodRes.marketPriceFlower
      const stoneUnit = stoneRes.craftCostFlower > 0 ? stoneRes.craftCostFlower : stoneRes.marketPriceFlower

      const totalCraftFlower = coinsFlower + (2 * woodUnit) + (1 * stoneUnit)
      const totalCraftUsd = totalCraftFlower * this.flowerPrice

      const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()
      for (const base of woodRes.baseMaterials) {
        const amt = base.amount * 2
        const fl = base.totalFlower * 2
        const ex = baseMaterialsMap.get(base.name)
        if (ex) { ex.amount += amt; ex.totalFlower += fl }
        else { baseMaterialsMap.set(base.name, { amount: amt, totalFlower: fl }) }
      }
      for (const base of stoneRes.baseMaterials) {
        const amt = base.amount * 1
        const fl = base.totalFlower * 1
        const ex = baseMaterialsMap.get(base.name)
        if (ex) { ex.amount += amt; ex.totalFlower += fl }
        else { baseMaterialsMap.set(base.name, { amount: amt, totalFlower: fl }) }
      }

      const res: CostResolution = {
        name: "Sand Shovel",
        id: "sand_shovel",
        kind: "recipe",
        category: "tools",
        building: "Blacksmith",
        yield: 1,
        isCraftable: true,
        craftCostFlower: Number(totalCraftFlower.toFixed(6)),
        craftCostUsd: Number(totalCraftUsd.toFixed(4)),
        hasMarketPrice: false,
        marketPriceFlower: 0,
        marketPriceUsd: 0,
        coins: coinsShovel,
        coinsFlower: Number(coinsFlower.toFixed(6)),
        ingredients: [
          {
            name: "Wood",
            amount: 2,
            unitPriceFlower: woodUnit,
            totalFlower: 2 * woodUnit,
            isBaseResource: !woodRes.isCraftable,
          },
          {
            name: "Stone",
            amount: 1,
            unitPriceFlower: stoneUnit,
            totalFlower: 1 * stoneUnit,
            isBaseResource: !stoneRes.isCraftable,
          },
        ],
        baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
          name: k,
          amount: Number(v.amount.toFixed(4)),
          totalFlower: Number(v.totalFlower.toFixed(6)),
        })),
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 2.2 Recursos de Cueva (Mud, Wild Mushroom, Magic Mushroom)
    if (isCaveResource(nameOrId)) {
      const canonicalName = getCanonicalCaveResourceName(nameOrId)
      const shovelRes = this.resolve("Sand Shovel", currentVisited)
      const shovelUnitCost = shovelRes.craftCostFlower > 0 ? shovelRes.craftCostFlower : shovelRes.marketPriceFlower
      const shovelsCount = 25
      const shovelsTotalCost = shovelsCount * shovelUnitCost

      // Ingresos esperados de Beetles
      const greenP = this.getBasePrice("Green Beetle") || DEFAULT_BEETLE_FALLBACK_PRICES["Green Beetle"]
      const blueP = this.getBasePrice("Blue Beetle") || DEFAULT_BEETLE_FALLBACK_PRICES["Blue Beetle"]
      const pinkP = this.getBasePrice("Pink Beetle") || DEFAULT_BEETLE_FALLBACK_PRICES["Pink Beetle"]
      const amberP = this.getBasePrice("Amber Beetle") || DEFAULT_BEETLE_FALLBACK_PRICES["Amber Beetle"]
      const expectedBeetleUnitVal = (0.4 * greenP) + (0.3 * blueP) + (0.2 * pinkP) + (0.1 * amberP)
      const expectedBeetlesRev = 2 * expectedBeetleUnitVal

      // Evaluar Mud Mix con la mejor opción de cultivo
      const caveBatch = calculateCaveBatchCost({
        flowerPriceUsd: this.flowerPrice,
        coinsPerFlower: this.coinsRate,
        resolveBasePrice: (n) => this.getBasePrice(n),
      })

      const bestCropRes = this.resolve(caveBatch.bestCropName, currentVisited)
      const bestCropUnitFlower = bestCropRes.craftCostFlower > 0
        ? bestCropRes.craftCostFlower
        : (bestCropRes.marketPriceFlower > 0 ? bestCropRes.marketPriceFlower : caveBatch.bestCropUnitFlower)
      const bestCropTotalCost = bestCropUnitFlower * caveBatch.bestCropAmount

      const mudBatchTotalCost = shovelsTotalCost + bestCropTotalCost
      const mudNetDeficit = Math.max(0, mudBatchTotalCost - expectedBeetlesRev)
      const totalItems = caveBatch.totalItemsProduced || 43
      const unitCraftFlower = mudNetDeficit > 0 ? mudNetDeficit / totalItems : 0.005
      const unitCraftUsd = unitCraftFlower * this.flowerPrice

      // Consolidar materias primas base aplanadas (DAG flattening)
      const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()

      // Aplanar los materiales de 25 Sand Shovels (repartidos entre 43 ítems)
      for (const base of shovelRes.baseMaterials) {
        const scaledAmount = (base.amount * shovelsCount) / totalItems
        const scaledFlower = (base.totalFlower * shovelsCount) / totalItems
        const ex = baseMaterialsMap.get(base.name)
        if (ex) {
          ex.amount += scaledAmount
          ex.totalFlower += scaledFlower
        } else {
          baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
        }
      }

      // Aplanar el mejor cultivo (repartido entre 43 ítems)
      if (bestCropRes.baseMaterials.length > 0) {
        for (const base of bestCropRes.baseMaterials) {
          const scaledAmount = (base.amount * caveBatch.bestCropAmount) / totalItems
          const scaledFlower = (base.totalFlower * caveBatch.bestCropAmount) / totalItems
          const ex = baseMaterialsMap.get(base.name)
          if (ex) {
            ex.amount += scaledAmount
            ex.totalFlower += scaledFlower
          } else {
            baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
          }
        }
      } else {
        const scaledAmount = caveBatch.bestCropAmount / totalItems
        const scaledFlower = bestCropTotalCost / totalItems
        const ex = baseMaterialsMap.get(bestCropRes.name)
        if (ex) {
          ex.amount += scaledAmount
          ex.totalFlower += scaledFlower
        } else {
          baseMaterialsMap.set(bestCropRes.name, { amount: scaledAmount, totalFlower: scaledFlower })
        }
      }

      const totalCoinsShovels = (shovelRes.coins * shovelsCount) / totalItems

      const res: CostResolution = {
        name: canonicalName,
        id: query.replace(/[^a-z0-9]+/g, "_"),
        kind: "craftable",
        category: "cave",
        yield: 1,
        isCraftable: true,
        craftCostFlower: Number(unitCraftFlower.toFixed(6)),
        craftCostUsd: Number(unitCraftUsd.toFixed(4)),
        hasMarketPrice: false,
        marketPriceFlower: 0,
        marketPriceUsd: 0,
        coins: Math.round(totalCoinsShovels),
        coinsFlower: Number((totalCoinsShovels / this.coinsRate).toFixed(6)),
        ingredients: [
          {
            name: "Sand Shovel",
            amount: Number((shovelsCount / totalItems).toFixed(4)),
            unitPriceFlower: Number(shovelUnitCost.toFixed(6)),
            totalFlower: Number((shovelsTotalCost / totalItems).toFixed(6)),
            isBaseResource: false,
          },
          {
            name: bestCropRes.name,
            amount: Number((caveBatch.bestCropAmount / totalItems).toFixed(4)),
            unitPriceFlower: Number(bestCropUnitFlower.toFixed(6)),
            totalFlower: Number((bestCropTotalCost / totalItems).toFixed(6)),
            isBaseResource: !bestCropRes.isCraftable,
          },
        ],
        baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
          name: k,
          amount: Number(v.amount.toFixed(4)),
          totalFlower: Number(v.totalFlower.toFixed(6)),
        })),
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 2.3 Fishing Lure (Comprado a Finn: 100 Plumas por defecto o 10 Gemas)
    if (query === "fishing lure" || query === "fishing_lure") {
      const breakdown = calculateFishingLureCost(
        {
          flowerPriceUsd: this.flowerPrice,
          coinsPerFlower: this.coinsRate,
          resolveBasePrice: (n) => this.getBasePrice(n),
        },
        "feathers"
      )

      const isGems = breakdown.selectedMethod === "gems"
      const totalFlower = breakdown.selectedFlower
      const totalUsd = breakdown.selectedUsd

      const ingredientsBreakdown: IngredientBreakdown[] = isGems
        ? [
            {
              name: "Gem",
              amount: 10,
              unitPriceFlower: breakdown.gemsOption.totalFlower / 10,
              totalFlower: breakdown.gemsOption.totalFlower,
              isBaseResource: false,
            },
          ]
        : [
            {
              name: "Feather",
              amount: 100,
              unitPriceFlower: breakdown.feathersOption.featherUnitPriceFlower,
              totalFlower: breakdown.feathersOption.totalFlower,
              isBaseResource: true,
            },
          ]

      const baseMaterials = isGems
        ? [{ name: "Gem", amount: 10, totalFlower: breakdown.gemsOption.totalFlower }]
        : [{ name: "Feather", amount: 100, totalFlower: breakdown.feathersOption.totalFlower }]

      const res: CostResolution = {
        name: "Fishing Lure",
        id: "fishing_lure",
        kind: "craftable",
        category: "fishing",
        building: "Finn",
        yield: 1,
        isCraftable: true,
        craftCostFlower: Number(totalFlower.toFixed(6)),
        craftCostUsd: Number(totalUsd.toFixed(4)),
        hasMarketPrice: false,
        marketPriceFlower: 0,
        marketPriceUsd: 0,
        coins: 0,
        coinsFlower: 0,
        ingredients: ingredientsBreakdown,
        baseMaterials,
        image: "/img/sunflowerland/fish/a/Fishing Lure.png",
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 3. Precios de Mercado Base
    const marketPriceFlower = this.getBasePrice(nameOrId)
    const marketPriceUsd = marketPriceFlower * this.flowerPrice
    const hasMarketPrice = marketPriceFlower > 0

    // 4. ¿Es un Pez Regular de Caña (fish.json)?
    if (isFish(nameOrId)) {
      const fishData = getFishData(nameOrId)
      if (fishData) {
        const rodRes = this.resolve("Rod", currentVisited)

        // Caso A: Tiburones Apex (White Shark, Saw Shark, Whale Shark) -> usa su cebo garantizado del Fish Market
        if (APEX_SHARKS.has(fishData.name) && fishData.guaranteedBy) {
          const baitRes = this.resolve(fishData.guaranteedBy, currentVisited)
          const baitCost = baitRes.craftCostFlower > 0 ? baitRes.craftCostFlower : baitRes.marketPriceFlower
          const totalFishFlower = rodRes.craftCostFlower + baitCost
          const totalFishUsd = totalFishFlower * this.flowerPrice

          const ingredientsBreakdown: IngredientBreakdown[] = [
            {
              name: rodRes.name,
              amount: 1,
              unitPriceFlower: rodRes.craftCostFlower,
              totalFlower: rodRes.craftCostFlower,
              isBaseResource: false,
            },
            {
              name: baitRes.name,
              amount: 1,
              unitPriceFlower: baitCost,
              totalFlower: baitCost,
              isBaseResource: !baitRes.isCraftable,
            },
          ]

          const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()
          for (const base of rodRes.baseMaterials) {
            baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
          }
          for (const base of baitRes.baseMaterials) {
            const ex = baseMaterialsMap.get(base.name)
            if (ex) {
              ex.amount += base.amount
              ex.totalFlower += base.totalFlower
            } else {
              baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
            }
          }

          const res: CostResolution = {
            name: fishData.name,
            id: fishData.id,
            kind: "craftable",
            category: "fishing",
            yield: 1,
            isCraftable: true,
            craftCostFlower: totalFishFlower,
            craftCostUsd: totalFishUsd,
            hasMarketPrice,
            marketPriceFlower,
            marketPriceUsd,
            coins: 0,
            coinsFlower: 0,
            ingredients: ingredientsBreakdown,
            baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
              name: k,
              amount: v.amount,
              totalFlower: v.totalFlower,
            })),
          }
          this.memo.set(memoKey, res)
          return res
        }

        // Caso B: Pez con combinación garantizada Cebo + Chum oficial (Anchovy, Tuna, Red Snapper)
        const guaranteedCombos = GUARANTEED_CHUM_COMBOS[fishData.name]
        if (guaranteedCombos && guaranteedCombos.length > 0) {
          let bestComboRes: {
            baitRes: CostResolution | null
            baitName: string
            baitFlower: number
            chumRes: CostResolution
            chumAmount: number
            chumFlower: number
            totalFlower: number
          } | null = null

          for (const combo of guaranteedCombos) {
            let comboBait = combo.baits[0] || "Earthworm"
            let comboBaitFlower = Infinity
            let comboBaitRes: CostResolution | null = null

            for (const b of combo.baits) {
              if (FREE_COMPOST_BAITS.has(b)) {
                comboBait = b
                comboBaitFlower = 0
                comboBaitRes = null
                break
              }
              const sub = this.resolve(b, currentVisited)
              const cost = sub.craftCostFlower > 0 ? sub.craftCostFlower : sub.marketPriceFlower
              if (cost < comboBaitFlower) {
                comboBaitFlower = cost
                comboBait = b
                comboBaitRes = sub
              }
            }
            if (!Number.isFinite(comboBaitFlower)) comboBaitFlower = 0

            const chumSub = this.resolve(combo.item, currentVisited)
            const unitChumFlower = chumSub.craftCostFlower > 0 ? chumSub.craftCostFlower : chumSub.marketPriceFlower
            const totalChumFlower = unitChumFlower * combo.amount
            const comboTotal = rodRes.craftCostFlower + comboBaitFlower + totalChumFlower

            if (!bestComboRes || comboTotal < bestComboRes.totalFlower) {
              bestComboRes = {
                baitRes: comboBaitRes,
                baitName: comboBait,
                baitFlower: comboBaitFlower,
                chumRes: chumSub,
                chumAmount: combo.amount,
                chumFlower: totalChumFlower,
                totalFlower: comboTotal,
              }
            }
          }

          if (bestComboRes) {
            const totalFishFlower = bestComboRes.totalFlower
            const totalFishUsd = totalFishFlower * this.flowerPrice

            const ingredientsBreakdown: IngredientBreakdown[] = [
              {
                name: rodRes.name,
                amount: 1,
                unitPriceFlower: rodRes.craftCostFlower,
                totalFlower: rodRes.craftCostFlower,
                isBaseResource: false,
              },
            ]

            const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()
            for (const base of rodRes.baseMaterials) {
              baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
            }

            if (bestComboRes.baitRes && bestComboRes.baitFlower > 0) {
              ingredientsBreakdown.push({
                name: bestComboRes.baitRes.name,
                amount: 1,
                unitPriceFlower: bestComboRes.baitFlower,
                totalFlower: bestComboRes.baitFlower,
                isBaseResource: !bestComboRes.baitRes.isCraftable,
              })
              for (const base of bestComboRes.baitRes.baseMaterials) {
                const ex = baseMaterialsMap.get(base.name)
                if (ex) {
                  ex.amount += base.amount
                  ex.totalFlower += base.totalFlower
                } else {
                  baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
                }
              }
            }

            ingredientsBreakdown.push({
              name: bestComboRes.chumRes.name,
              amount: bestComboRes.chumAmount,
              unitPriceFlower: bestComboRes.chumFlower / bestComboRes.chumAmount,
              totalFlower: bestComboRes.chumFlower,
              isBaseResource: !bestComboRes.chumRes.isCraftable,
            })

            if (bestComboRes.chumRes.baseMaterials.length > 0) {
              for (const base of bestComboRes.chumRes.baseMaterials) {
                const scaledAmount = base.amount * bestComboRes.chumAmount
                const scaledFlower = base.totalFlower * bestComboRes.chumAmount
                const ex = baseMaterialsMap.get(base.name)
                if (ex) {
                  ex.amount += scaledAmount
                  ex.totalFlower += scaledFlower
                } else {
                  baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
                }
              }
            } else {
              const ex = baseMaterialsMap.get(bestComboRes.chumRes.name)
              if (ex) {
                ex.amount += bestComboRes.chumAmount
                ex.totalFlower += bestComboRes.chumFlower
              } else {
                baseMaterialsMap.set(bestComboRes.chumRes.name, {
                  amount: bestComboRes.chumAmount,
                  totalFlower: bestComboRes.chumFlower,
                })
              }
            }

            const res: CostResolution = {
              name: fishData.name,
              id: fishData.id,
              kind: "craftable",
              category: "fishing",
              yield: 1,
              isCraftable: true,
              craftCostFlower: totalFishFlower,
              craftCostUsd: totalFishUsd,
              hasMarketPrice,
              marketPriceFlower,
              marketPriceUsd,
              coins: 0,
              coinsFlower: 0,
              ingredients: ingredientsBreakdown,
              baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
                name: k,
                amount: v.amount,
                totalFlower: v.totalFlower,
              })),
            }
            this.memo.set(memoKey, res)
            return res
          }
        }

        // Caso C: Demás peces regulares (Cebo más económico min Baits + min Chum)
        let bestBaitName = fishData.baits[0] || "Earthworm"
        let bestBaitFlower = Infinity
        let bestBaitRes: CostResolution | null = null

        for (const b of fishData.baits) {
          if (FREE_COMPOST_BAITS.has(b)) {
            bestBaitName = b
            bestBaitFlower = 0
            bestBaitRes = null
            break
          }
          const sub = this.resolve(b, currentVisited)
          const cost = sub.craftCostFlower > 0 ? sub.craftCostFlower : sub.marketPriceFlower
          if (cost < bestBaitFlower) {
            bestBaitFlower = cost
            bestBaitName = b
            bestBaitRes = sub
          }
        }
        if (!Number.isFinite(bestBaitFlower)) {
          bestBaitFlower = 0
        }

        // Chum más económico (min Chum)
        let bestChumRes: { res: CostResolution; amount: number; totalFlower: number } | null = null
        let bestChumFlower = 0

        if (fishData.chum && fishData.chum.length > 0) {
          bestChumFlower = Infinity
          for (const opt of fishData.chum) {
            const sub = this.resolve(opt.item, currentVisited)
            const unitCost = sub.craftCostFlower > 0 ? sub.craftCostFlower : sub.marketPriceFlower
            const optTotal = unitCost * opt.amount
            if (optTotal < bestChumFlower) {
              bestChumFlower = optTotal
              bestChumRes = { res: sub, amount: opt.amount, totalFlower: optTotal }
            }
          }
          if (!Number.isFinite(bestChumFlower)) {
            bestChumFlower = 0
          }
        }

        const totalFishFlower = rodRes.craftCostFlower + bestBaitFlower + bestChumFlower
        const totalFishUsd = totalFishFlower * this.flowerPrice

        const ingredientsBreakdown: IngredientBreakdown[] = [
          {
            name: rodRes.name,
            amount: 1,
            unitPriceFlower: rodRes.craftCostFlower,
            totalFlower: rodRes.craftCostFlower,
            isBaseResource: false,
          },
        ]

        const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()

        // Aplanar materiales base de la Caña
        for (const base of rodRes.baseMaterials) {
          baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
        }

        if (bestBaitRes && bestBaitFlower > 0) {
          ingredientsBreakdown.push({
            name: bestBaitRes.name,
            amount: 1,
            unitPriceFlower: bestBaitFlower,
            totalFlower: bestBaitFlower,
            isBaseResource: !bestBaitRes.isCraftable,
          })
          for (const base of bestBaitRes.baseMaterials) {
            const ex = baseMaterialsMap.get(base.name)
            if (ex) {
              ex.amount += base.amount
              ex.totalFlower += base.totalFlower
            } else {
              baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
            }
          }
        }

        if (bestChumRes && bestChumFlower > 0) {
          ingredientsBreakdown.push({
            name: bestChumRes.res.name,
            amount: bestChumRes.amount,
            unitPriceFlower: bestChumRes.totalFlower / bestChumRes.amount,
            totalFlower: bestChumRes.totalFlower,
            isBaseResource: !bestChumRes.res.isCraftable,
          })
          if (bestChumRes.res.baseMaterials.length > 0) {
            for (const base of bestChumRes.res.baseMaterials) {
              const scaledAmount = base.amount * bestChumRes.amount
              const scaledFlower = base.totalFlower * bestChumRes.amount
              const ex = baseMaterialsMap.get(base.name)
              if (ex) {
                ex.amount += scaledAmount
                ex.totalFlower += scaledFlower
              } else {
                baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
              }
            }
          } else {
            const ex = baseMaterialsMap.get(bestChumRes.res.name)
            if (ex) {
              ex.amount += bestChumRes.amount
              ex.totalFlower += bestChumRes.totalFlower
            } else {
              baseMaterialsMap.set(bestChumRes.res.name, {
                amount: bestChumRes.amount,
                totalFlower: bestChumRes.totalFlower,
              })
            }
          }
        }

        const res: CostResolution = {
          name: fishData.name,
          id: fishData.id,
          kind: "craftable",
          category: "fishing",
          yield: 1,
          isCraftable: true,
          craftCostFlower: totalFishFlower,
          craftCostUsd: totalFishUsd,
          hasMarketPrice,
          marketPriceFlower,
          marketPriceUsd,
          coins: 0,
          coinsFlower: 0,
          ingredients: ingredientsBreakdown,
          baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
            name: k,
            amount: v.amount,
            totalFlower: v.totalFlower,
          })),
        }
        this.memo.set(memoKey, res)
        return res
      }
    }

    // 5. ¿Es un Crustáceo de Trampa (crustaceans.json)?
    if (isCrustacean(nameOrId)) {
      const crustData = getCrustaceanData(nameOrId)
      if (crustData) {
        const trapRes = this.resolve(crustData.trap, currentVisited)
        let totalChumFlower = 0
        const ingredientsBreakdown: IngredientBreakdown[] = [
          {
            name: trapRes.name,
            amount: 1,
            unitPriceFlower: trapRes.craftCostFlower,
            totalFlower: trapRes.craftCostFlower,
            isBaseResource: false,
          },
        ]

        const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()
        for (const base of trapRes.baseMaterials) {
          baseMaterialsMap.set(base.name, { amount: base.amount, totalFlower: base.totalFlower })
        }

        // Chum más económico (min Chum) — son alternativas excluyentes
        let bestChumRes: { res: CostResolution; amount: number; totalFlower: number } | null = null
        let bestChumFlower = 0

        if (crustData.chum && crustData.chum.length > 0) {
          let minChum = Infinity
          for (const opt of crustData.chum) {
            const sub = this.resolve(opt.item, currentVisited)
            const unitPrice = sub.craftCostFlower > 0 ? sub.craftCostFlower : sub.marketPriceFlower
            const optTotal = unitPrice * opt.amount
            if (optTotal < minChum) {
              minChum = optTotal
              bestChumRes = { res: sub, amount: opt.amount, totalFlower: optTotal }
            }
          }
          if (Number.isFinite(minChum)) {
            bestChumFlower = minChum
          }
        }

        if (bestChumRes && bestChumFlower > 0) {
          ingredientsBreakdown.push({
            name: bestChumRes.res.name,
            amount: bestChumRes.amount,
            unitPriceFlower: bestChumRes.totalFlower / bestChumRes.amount,
            totalFlower: bestChumRes.totalFlower,
            isBaseResource: !bestChumRes.res.isCraftable,
          })

          if (bestChumRes.res.baseMaterials.length > 0) {
            for (const base of bestChumRes.res.baseMaterials) {
              const scaledAmount = base.amount * bestChumRes.amount
              const scaledFlower = base.totalFlower * bestChumRes.amount
              const ex = baseMaterialsMap.get(base.name)
              if (ex) {
                ex.amount += scaledAmount
                ex.totalFlower += scaledFlower
              } else {
                baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
              }
            }
          } else {
            const ex = baseMaterialsMap.get(bestChumRes.res.name)
            if (ex) {
              ex.amount += bestChumRes.amount
              ex.totalFlower += bestChumRes.totalFlower
            } else {
              baseMaterialsMap.set(bestChumRes.res.name, {
                amount: bestChumRes.amount,
                totalFlower: bestChumRes.totalFlower,
              })
            }
          }
        }

        const totalCrustFlower = trapRes.craftCostFlower + bestChumFlower
        const totalCrustUsd = totalCrustFlower * this.flowerPrice

        const res: CostResolution = {
          name: crustData.name,
          id: crustData.id,
          kind: "craftable",
          category: "fishing",
          yield: 1,
          isCraftable: true,
          craftCostFlower: totalCrustFlower,
          craftCostUsd: totalCrustUsd,
          hasMarketPrice,
          marketPriceFlower,
          marketPriceUsd,
          coins: 0,
          coinsFlower: 0,
          ingredients: ingredientsBreakdown,
          baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
            name: k,
            amount: v.amount,
            totalFlower: v.totalFlower,
          })),
        }
        this.memo.set(memoKey, res)
        return res
      }
    }

    // 6. ¿Tiene Receta de Fabricación en el Catálogo Declarativo?
    const recipe = getRecipe(nameOrId)
    const effectiveMarketPriceFlower = recipe
      ? this.getBasePrice(recipe.name) || marketPriceFlower
      : marketPriceFlower
    const effectiveMarketPriceUsd = effectiveMarketPriceFlower * this.flowerPrice
    const effectiveHasMarketPrice = effectiveMarketPriceFlower > 0

    if (!recipe) {
      // Es un nodo terminal / Recurso Base (Wood, Salt, Gold, pez crudo, cultivo base, etc.)
      const res: CostResolution = {
        name: nameOrId,
        id: query.replace(/[^a-z0-9]+/g, "_"),
        kind: "p2p_resource",
        yield: 1,
        isCraftable: false,
        craftCostFlower: effectiveMarketPriceFlower,
        craftCostUsd: effectiveMarketPriceUsd,
        hasMarketPrice: effectiveHasMarketPrice,
        marketPriceFlower: effectiveMarketPriceFlower,
        marketPriceUsd: effectiveMarketPriceUsd,
        coins: 0,
        coinsFlower: 0,
        ingredients: [],
        baseMaterials: effectiveHasMarketPrice
          ? [{ name: nameOrId, amount: 1, totalFlower: effectiveMarketPriceFlower }]
          : [],
      }
      this.memo.set(memoKey, res)
      return res
    }

    // 6. Cebo Canónico del Fish Market (Promedio general de las 4 estaciones Σ / 4)
    if (recipe.category === "fish_market" && !recipe.id.includes("_")) {
      const seasons = ["spring", "summer", "autumn", "winter"] as const
      const seasonalResolutions: CostResolution[] = []
      let sumSeasonalFlower = 0

      for (const s of seasons) {
        const variantId = `${recipe.id}_${s}`
        const varRes = this.resolve(variantId, currentVisited)
        if (varRes) {
          seasonalResolutions.push(varRes)
          sumSeasonalFlower += varRes.craftCostFlower
        }
      }

      const avgCraftCostFlower =
        seasonalResolutions.length > 0 ? sumSeasonalFlower / seasonalResolutions.length : 0
      const avgCraftCostUsd = avgCraftCostFlower * this.flowerPrice

      // Consolidar materias primas base promedio
      const baseMaterialsMap = new Map<string, { amount: number; totalFlower: number }>()
      for (const sRes of seasonalResolutions) {
        for (const base of sRes.baseMaterials) {
          const scaledAmount = base.amount / seasonalResolutions.length
          const scaledFlower = base.totalFlower / seasonalResolutions.length
          const ex = baseMaterialsMap.get(base.name)
          if (ex) {
            ex.amount += scaledAmount
            ex.totalFlower += scaledFlower
          } else {
            baseMaterialsMap.set(base.name, { amount: scaledAmount, totalFlower: scaledFlower })
          }
        }
      }

      const res: CostResolution = {
        name: recipe.name,
        id: recipe.id,
        kind: "craftable",
        category: "fish_market",
        building: recipe.building,
        yield: 1,
        isCraftable: true,
        craftCostFlower: avgCraftCostFlower,
        craftCostUsd: avgCraftCostUsd,
        hasMarketPrice,
        marketPriceFlower,
        marketPriceUsd,
        coins: 0,
        coinsFlower: 0,
        ingredients: seasonalResolutions[0]?.ingredients || [],
        baseMaterials: Array.from(baseMaterialsMap.entries()).map(([k, v]) => ({
          name: k,
          amount: v.amount,
          totalFlower: v.totalFlower,
        })),
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
    if (effectiveHasMarketPrice && unitCraftFlower > 0) {
      const spreadFlower = effectiveMarketPriceFlower - unitCraftFlower
      const cheaperToCraft = spreadFlower > 0
      const savingsPercent =
        effectiveMarketPriceFlower > 0 ? (spreadFlower / effectiveMarketPriceFlower) * 100 : 0
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
      hasMarketPrice: effectiveHasMarketPrice,
      marketPriceFlower: Number(effectiveMarketPriceFlower.toFixed(6)),
      marketPriceUsd: Number(effectiveMarketPriceUsd.toFixed(4)),
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

  const effResolvePrice =
    resolvePrice ||
    ((name: string) => {
      const u = getUnitCost(name, flowerPriceUsd)
      return u.flower > 0 ? u.flower : getItemPrice(name)
    })

  return calculateAgedFishCost(
    {
      id: recipe.id,
      name: recipe.name,
      salt: saltAmount,
      timeSeconds: recipe.timeSeconds || 0,
      agedXp: recipe.agedXp || 0,
      primeAgedXp: recipe.primeAgedXp || 0,
    },
    effResolvePrice,
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

/**
 * Devuelve el costo de captura de un pez regular en formato CostResolution.
 */
export function getFishCost(
  fishNameOrId: string,
  options?: ResolveCostOptions,
): CostResolution | null {
  if (!isFish(fishNameOrId)) return null
  return resolveCost(fishNameOrId, options)
}

/**
 * Devuelve el costo de captura de un crustáceo de trampa en formato CostResolution.
 */
export function getCrustaceanCost(
  crustaceanNameOrId: string,
  options?: ResolveCostOptions,
): CostResolution | null {
  if (!isCrustacean(crustaceanNameOrId)) return null
  return resolveCost(crustaceanNameOrId, options)
}

/**
 * Devuelve el costo de todos los 38 peces regulares.
 */
export function getAllFishCosts(options?: ResolveCostOptions): CostResolution[] {
  const allFish = getAllFishCatchCosts({
    coinsPerFlower: options?.coinsPerFlower || getBettyRatio() || OFFICIAL_COINS_PER_FLOWER,
    flowerPriceUsd: options?.flowerPriceUsd || getFlowerPrice(),
  })
  return allFish
    .map((f) => resolveCost(f.name, options))
    .filter((r): r is CostResolution => r !== null)
}

/**
 * Devuelve el costo de todos los 16 crustáceos de trampa.
 */
export function getAllCrustaceanCosts(options?: ResolveCostOptions): CostResolution[] {
  const allCrust = getAllCrustaceanCatchCosts({
    coinsPerFlower: options?.coinsPerFlower || getBettyRatio() || OFFICIAL_COINS_PER_FLOWER,
    flowerPriceUsd: options?.flowerPriceUsd || getFlowerPrice(),
  })
  return allCrust
    .map((c) => resolveCost(c.name, options))
    .filter((r): r is CostResolution => r !== null)
}

/**
 * Devuelve el costo de un recurso de cueva (Mud, Wild Mushroom, Magic Mushroom).
 */
export function getCaveResourceCost(
  nameOrId: string,
  options?: ResolveCostOptions,
): CostResolution | null {
  if (!isCaveResource(nameOrId)) return null
  return resolveCost(nameOrId, options)
}

/**
 * Devuelve el costo de todos los recursos clave de cueva.
 */
export function getAllCaveResourceCosts(options?: ResolveCostOptions): CostResolution[] {
  return ["Mud", "Wild Mushroom", "Magic Mushroom"].map((name) => resolveCost(name, options))
}

// Re-export de la temporada activa y utilidades de fabricación
export { CURRENT_SEASON, isSeasonalTicket, getCurrentSeason, type SeasonConfig }
export { calculateFishingLureCost, FINN_FISHING_LURE_TRADE, type FishingLureCostBreakdown }
export { getRecipe, getAllRecipes, getRecipesByCategory, getRecipesByBuilding } from "./crafting"
