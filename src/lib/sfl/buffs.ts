// ============================================================================
// src/lib/sfl/buffs.ts
// Motor centralizado y unificado de Buffs y Power-Ups para Sunflower Land.
//
// Responsabilidad única:
// 1. Unificar bajo una estructura común las 5 fuentes de ventajas del juego:
//    - Collectibles (powerups.json)
//    - Wearables (powerups.json)
//    - Skills (skills.json)
//    - Shrines (calculo_buffs.json)
//    - Consumables / Hourglasses / Totems (calculo_buffs.json)
//    - Others (VIP Pass, Bud, Faction, etc.) (calculo_buffs.json)
// 2. Proveer tipado estricto, indexación y búsqueda por dominios (cocina, pesca,
//    cultivos, minería, madera, animales, etc.).
// 3. Resolver valores matemáticos por rango/rango efectivo y aplicar cálculos
//    estandarizados (velocidad, XP, yields, reducciones de costos, etc.).
// ============================================================================

import powerupsDataRaw from "../../content/data/sfl/powerups.json"
import skillsDataRaw from "../../content/data/sfl/skills.json"
import calculoBuffsDataRaw from "../../content/data/sfl/calculo_buffs.json"

// ----------------------------------------------------------------------------
// Tipos e Interfaces
// ----------------------------------------------------------------------------

export type BuffType =
  | "collectible"
  | "wearable"
  | "skill"
  | "shrine"
  | "consumable"
  | "other"

export type BuffCategory =
  | "bumpkin_xp"
  | "cooking_speed"
  | "cooking_time"
  | "growth_speed"
  | "recovery_speed"
  | "sleep_speed"
  | "crafting_speed"
  | "production_speed"
  | "yield"
  | "feed_cost"
  | "pet_xp"
  | "trading_tax"
  | "marketplace_tax"
  | "expansion_cost"
  | "expansion_time"
  | "shop_discount"
  | "bee_swarm"
  | "utility"
  | string

export type MathematicsOperation =
  | "multiply"
  | "add"
  | "flat_bonus"
  | "speed_multiplier"
  | "chance"
  | "chance_additive"
  | "subtracted_from_base"
  | "flat_bonus_every_3rd"
  | "discount_or_flat"
  | "none"
  | string

export interface MathEffect {
  calc?: number | null
  calc_by_rank?: Record<string, number>
  category: BuffCategory
  subcategory?: string
  effect_type?: string
  target?: string
  target_food?: string
  mathematics_operation: MathematicsOperation
  description?: string
  chance?: number
}

export interface BuffDefinition {
  id?: number | string
  name: string
  type: BuffType
  category?: string // skill tree (e.g. 'Cooking'), 'wearable', 'collectible', etc.
  description: string
  image: string
  effects: MathEffect[]
  perks?: Record<string, any>
  raw?: any
}

export type ActiveBuffSelections = Record<string, number | boolean>

// ----------------------------------------------------------------------------
// Extractor de Efectos Matemáticos
// ----------------------------------------------------------------------------

export function extractMathEffects(rawItem: any): MathEffect[] {
  if (!rawItem || typeof rawItem !== "object") return []
  const effects: MathEffect[] = []
  const mathKeys = [
    "mathematics_1",
    "mathematics_2",
    "mathematics_3",
    "mathematics_4",
    "mathematics_5",
    "mathematics_6",
  ]

  for (const key of mathKeys) {
    const m = rawItem[key]
    if (m && typeof m === "object") {
      effects.push({
        calc: m.calc !== undefined ? m.calc : null,
        calc_by_rank: m.calc_by_rank || undefined,
        category: m.category || "",
        subcategory: m.subcategory || "",
        effect_type: m.effect_type || "",
        target: m.target || m.target_food || "all",
        target_food: m.target_food || m.target || "all",
        mathematics_operation: m.mathematics_operation || "multiply",
        description: m.description || "",
        chance: m.chance !== undefined ? m.chance : undefined,
      })
    }
  }

  return effects
}

// ----------------------------------------------------------------------------
// Catálogo Centralizado (Indexación en Memoria)
// ----------------------------------------------------------------------------

let cachedBuffList: BuffDefinition[] | null = null
let cachedBuffMap: Map<string, BuffDefinition> | null = null

export function getAllBuffs(): BuffDefinition[] {
  if (cachedBuffList) return cachedBuffList

  const list: BuffDefinition[] = []

  // 1. Collectibles de powerups.json
  const collectibles = (powerupsDataRaw as any)?.power_ups?.collectibles || {}
  for (const [key, data] of Object.entries<any>(collectibles)) {
    list.push({
      id: data.id !== undefined ? data.id : key,
      name: data.name || key,
      type: "collectible",
      category: data.category || "collectible",
      description: data.description || data.boost || "",
      image: data.image || "",
      effects: extractMathEffects(data),
      raw: data,
    })
  }

  // 2. Wearables de powerups.json
  const wearables = (powerupsDataRaw as any)?.power_ups?.wearables || {}
  for (const [key, data] of Object.entries<any>(wearables)) {
    list.push({
      id: data.id !== undefined ? data.id : key,
      name: data.name || key,
      type: "wearable",
      category: data.category || "wearable",
      description: data.description || data.boost || "",
      image: data.image || "",
      effects: extractMathEffects(data),
      raw: data,
    })
  }

  // 3. Skills de skills.json (13 árboles)
  const skillsData = skillsDataRaw as Record<string, Record<string, any>>
  for (const [treeName, treeSkills] of Object.entries(skillsData)) {
    for (const [skillName, data] of Object.entries(treeSkills)) {
      list.push({
        id: data.id,
        name: data.name || skillName,
        type: "skill",
        category: treeName,
        description: data.description || "",
        image: data.image || "",
        effects: extractMathEffects(data),
        raw: data,
      })
    }
  }

  // 4. Shrines de calculo_buffs.json
  const shrines = (calculoBuffsDataRaw as any)?.shrines || {}
  for (const [name, data] of Object.entries<any>(shrines)) {
    list.push({
      id: data.id || `shrine_${name.toLowerCase().replace(/\s+/g, "_")}`,
      name: data.name || name,
      type: "shrine",
      category: "shrine",
      description: data.description || "",
      image: data.image || "",
      effects: extractMathEffects(data),
      raw: data,
    })
  }

  // 5. Consumables de calculo_buffs.json (Hourglasses, Totems)
  const consumables = (calculoBuffsDataRaw as any)?.consumables || {}
  for (const [name, data] of Object.entries<any>(consumables)) {
    list.push({
      id: data.id,
      name: data.name || name,
      type: "consumable",
      category: "consumable",
      description: data.description || "",
      image: data.image || "",
      effects: extractMathEffects(data),
      raw: data,
    })
  }

  // 6. Others de calculo_buffs.json (VIP Pass, Blossom Beard, etc.)
  const others = (calculoBuffsDataRaw as any)?.others || {}
  for (const [name, data] of Object.entries<any>(others)) {
    list.push({
      id: data.id,
      name: data.name || name,
      type: "other",
      category: "other",
      description: data.description || "",
      image: data.image || "",
      effects: extractMathEffects(data),
      perks: data.perks || undefined,
      raw: data,
    })
  }

  cachedBuffList = list
  cachedBuffMap = new Map()
  for (const b of list) {
    cachedBuffMap.set(b.name.toLowerCase(), b)
    if (b.id !== undefined) {
      cachedBuffMap.set(String(b.id), b)
    }
  }

  return cachedBuffList
}

export function getBuffMap(): Map<string, BuffDefinition> {
  if (!cachedBuffMap) {
    getAllBuffs()
  }
  return cachedBuffMap!
}

export function getBuffByName(name: string): BuffDefinition | undefined {
  if (!name) return undefined
  const map = getBuffMap()
  return map.get(name.toLowerCase())
}

export function getBuffsByType(type: BuffType): BuffDefinition[] {
  return getAllBuffs().filter((b) => b.type === type)
}

export function getBuffsByCategory(category: BuffCategory): BuffDefinition[] {
  return getAllBuffs().filter((b) =>
    b.effects.some((eff) => eff.category === category)
  )
}

// ----------------------------------------------------------------------------
// Consultas por Dominios de Juego
// ----------------------------------------------------------------------------

/** Buffs relevantes para cocina y experiencia de alimentos */
export function getCookingBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    // 1. Skills del árbol de Cooking o Fishy Feast / Speedy Aging
    if (
      b.type === "skill" &&
      (b.category === "Cooking" || b.name === "Fishy Feast" || b.name === "Speedy Aging")
    ) {
      return true
    }
    // 2. Buffs con categoría explícita "cooking"
    return b.effects.some((eff) => eff.category === "cooking")
  })
}

/** Buffs relevantes para Cueva Subterránea (Hongos, Lodo, Palas, Escarabajos) */
export function getCaveBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    // 1. Skills del árbol de Cave
    if (b.type === "skill" && b.category === "Cave") {
      return true
    }
    // 2. Buffs con categoría explícita "cave"
    return b.effects.some((eff) => eff.category === "cave")
  })
}

/** Buffs relevantes para pesca (rendimiento de peces, costo de caña, consumibles de pesca) */
export function getFishingBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    // 1. Exclusiones explícitas (Pertenecen a cocina, tesoros o entregas)
    if (
      b.name === "Skill Shrimpy" ||
      b.name === "Luminous Anglerfish" ||
      b.name === "Fishy Feast" ||
      b.name === "Fishy Fortune" ||
      b.name === "Crab Hat"
    ) {
      return false
    }
    // 2. Skills de pesca
    if (b.type === "skill" && b.category === "Fishing") return true
    // 3. Consumible Fisher's Hourglass
    if (b.name === "Fisher's Hourglass") return true
    // 4. Buffs con categoría explícita "fishing"
    return b.effects.some((eff) => eff.category === "fishing")
  })
}

/** Buffs relevantes para cultivos agrícolas (parcelas e invernadero) */
export function getCropBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    if (b.type === "skill" && (b.category === "Crops" || b.category === "Greenhouse")) {
      return true
    }
    return b.effects.some(
      (eff) =>
        eff.target === "crop" ||
        eff.target === "crop_plot" ||
        eff.target === "greenhouse" ||
        eff.target === "crop_machine"
    )
  })
}

/** Buffs relevantes para tala de madera y árboles */
export function getWoodBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    if (b.type === "skill" && b.category === "Trees") return true
    return b.effects.some((eff) => eff.target === "wood" || eff.target === "tree")
  })
}

/** Buffs relevantes para minería, rocas y cuevas subterráneas */
export function getMiningBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    if (
      b.type === "skill" &&
      (b.category === "Rocks" || b.category === "Mining" || b.category === "Cave")
    ) {
      return true
    }
    return b.effects.some(
      (eff) =>
        eff.target === "stone" ||
        eff.target === "iron" ||
        eff.target === "gold" ||
        eff.target === "crimstone" ||
        eff.target === "mineral" ||
        eff.target === "mushroom" ||
        eff.target === "Wild Mushroom"
    )
  })
}

/** Buffs relevantes para animales de granja */
export function getAnimalBuffs(): BuffDefinition[] {
  return getAllBuffs().filter((b) => {
    if (b.type === "skill" && b.category === "Animals") return true
    return b.effects.some(
      (eff) =>
        eff.target === "chicken" ||
        eff.target === "cow" ||
        eff.target === "sheep" ||
        eff.target === "pig" ||
        eff.target === "barn_animals"
    )
  })
}

// ----------------------------------------------------------------------------
// Motor de Resolución Matemática
// ----------------------------------------------------------------------------

/**
 * Resuelve el valor numérico de un efecto según el rango seleccionado.
 * Si el efecto usa `calc_by_rank`, obtiene `rank_N`.
 * Si el efecto usa un `calc` directo, devuelve ese número.
 */
export function resolveEffectValue(effect: MathEffect, rank: number = 1): number {
  if (effect.calc_by_rank) {
    const key = `rank_${rank}`
    if (effect.calc_by_rank[key] !== undefined) {
      return effect.calc_by_rank[key]
    }
    // Fallback al rank_1 si el rango pedido no existe
    return effect.calc_by_rank.rank_1 ?? 0
  }
  return effect.calc ?? 0
}

/**
 * Convierte un multiplicador de velocidad (rate speed, ej. 1.35x o 2.0x)
 * a su factor equivalente de duración de tiempo (duration = base / speed).
 * Ejemplo: 1.35x speed -> 1 / 1.35 = ~0.7407 (reduce el tiempo en ~25.9%).
 */
export function speedMultiplierToTimeFactor(speedMultiplier: number): number {
  if (speedMultiplier <= 0) return 1
  return 1 / speedMultiplier
}

/**
 * Evalúa si un ítem coincide con el objetivo ('target') definido en un efecto.
 */
export function isEffectTargetMatch(
  target: string | undefined,
  context: {
    itemName?: string
    building?: string
    ingredients?: Array<{ name: string; amount?: number }>
    tags?: string[]
  }
): boolean {
  if (!target || target === "all") return true
  const { itemName = "", building = "", ingredients = [], tags = [] } = context

  if (target.toLowerCase() === itemName.toLowerCase()) return true
  if (target.toLowerCase() === building.toLowerCase()) return true
  if (tags.some((t) => t.toLowerCase() === target.toLowerCase())) return true

  // Reglas especiales de alimentos
  if (target === "Fish") {
    const fishIngs = new Set([
      "Anchovy",
      "Blowfish",
      "Butterfish",
      "Clownfish",
      "Red Snapper",
      "Sea Bass",
      "Sea Horse",
      "Squid",
      "Tuna",
    ])
    const fishSpecificDishes = new Set([
      "Gumbo",
      "Chowder",
      "Steamed Red Snapper",
      "Surimi Rice Bowl",
    ])
    return (
      building === "Fish" ||
      itemName.includes("Fish") ||
      ingredients.some((ing) => fishIngs.has(ing.name)) ||
      fishSpecificDishes.has(itemName)
    )
  }

  if (target === "Honey Foods") {
    return ingredients.some((ing) => ing.name === "Honey")
  }

  if (target === "Aged Fish") {
    return building === "Aging Shed" || itemName.startsWith("Aged ")
  }

  if (target === "Cakes") {
    return building === "Bakery" || itemName.includes("Cake")
  }

  if (target === "Juice") {
    return building === "Smoothie Shack"
  }

  return false
}

/**
 * Calcula el factor multiplicativo combinado para una categoría dada
 * evaluando todas las selecciones activas.
 */
export function calculateCompoundedMultiplier(
  category: BuffCategory,
  activeSelections: ActiveBuffSelections,
  targetContext: {
    itemName?: string
    building?: string
    ingredients?: Array<{ name: string; amount?: number }>
    tags?: string[]
  }
): number {
  let multiplier = 1

  for (const [buffKey, selection] of Object.entries(activeSelections)) {
    if (!selection) continue
    const buff = getBuffByName(buffKey)
    if (!buff) continue

    const rank = typeof selection === "number" ? selection : 1

    for (const effect of buff.effects) {
      if (effect.category !== category) continue
      if (!isEffectTargetMatch(effect.target, targetContext)) continue

      const val = resolveEffectValue(effect, rank)

      if (effect.mathematics_operation === "multiply") {
        // En SFL, algunos multiplicadores se expresan como +X% (ej: 0.1 para +10% XP)
        // o como factor directo (ej: 0.8 para 80% del tiempo).
        // Si el valor está entre 0 y 1 en bumpkin_xp, suma al base: (1 + val)
        if (category === "bumpkin_xp" && val > 0 && val < 2) {
          multiplier *= 1 + val
        } else {
          multiplier *= val
        }
      } else if (effect.mathematics_operation === "speed_multiplier") {
        // Si la categoría buscada es tiempo, dividimos por la velocidad
        if (category === "cooking_time" || category.endsWith("_time")) {
          multiplier *= speedMultiplierToTimeFactor(val)
        } else {
          multiplier *= val
        }
      }
    }
  }

  return multiplier
}
