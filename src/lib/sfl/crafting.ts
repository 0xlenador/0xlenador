// ============================================================
// src/lib/sfl/crafting.ts
// Catálogo Universal y Declarativo de Fabricación (Crafting) de Sunflower Land.
//
// Responsabilidad única: Extraer, normalizar e indexar todas las
// recetas de fabricación del juego desde los archivos JSON oficiales
// (Cocina, Aging Shed, Herrería/Herramientas, Consumibles de Animales, Fish Market)
// y exponer la configuración de la Temporada Activa (Season Ticket/Moneda).
//
// Cero código hardcodeado: Si se agrega una receta en cualquier JSON,
// queda automáticamente disponible para todo el motor de cálculos.
// ============================================================

import recipesDataRaw from "../../content/data/sfl/recipes.json"
import agingShedDataRaw from "../../content/data/sfl/aging_shed.json"
import blacksmithToolsDataRaw from "../../content/data/sfl/blacksmith_tools.json"
import consumablesDataRaw from "../../content/data/sfl/animals/consumables.json"
import fishMarketDataRaw from "../../content/data/sfl/fishing/fish_market.json"
import { OIL_DRILL_RECIPE, DEFAULT_OIL_MULTIPLIER } from "./constants"

// ============================================================================
// 1. TEMPORADA ACTIVA DE SUNFLOWER LAND
// Actualiza este bloque cada vez que comience una nueva temporada en el juego.
// ============================================================================

export interface SeasonConfig {
  id: string
  name: string
  ticketName: string
  ticketImage: string
  startDate: string
  endDate: string
  durationLabel: string
}

export const CURRENT_SEASON: SeasonConfig = {
  id: "cave_dwellers",
  name: "Cave Dwellers",
  ticketName: "Beetle Wing",
  ticketImage: "/img/sunflowerland/others/beetle_wing.webp",
  startDate: "2026-11-02",
  endDate: "2027-02-02",
  durationLabel: "2 de noviembre de 2026 – 2 de febrero de 2027",
}

export function getCurrentSeason(): SeasonConfig {
  return CURRENT_SEASON
}

export function isSeasonalTicket(name: string): boolean {
  if (!name) return false
  const norm = name.toLowerCase().trim()
  return (
    norm === CURRENT_SEASON.ticketName.toLowerCase().trim() ||
    norm === "seasonal ticket" ||
    norm === "season ticket"
  )
}

// ---------------------------------------------------------------------------
// Tipos e Interfaces
// ---------------------------------------------------------------------------

export interface RecipeIngredient {
  name: string
  amount: number
}

export type RecipeCategory =
  | "cooking"
  | "aging_shed"
  | "blacksmith"
  | "animals"
  | "oil"
  | "fish_market"
  | "general"

export interface UnifiedRecipe {
  /** Identificador único normalizado (ej: "pizza_margherita", "aged_white_shark") */
  id: string
  /** Nombre canónico oficial (ej: "Pizza Margherita", "Aged White Shark") */
  name: string
  /** Categoría del subsistema del juego */
  category: RecipeCategory
  /** Edificio donde se procesa (ej: "Fire Pit", "Aging Shed", "Blacksmith", "Deli") */
  building?: string
  /** Unidades producidas por lote (default: 1; ej: 6 para tratos de animales, 16.67 para Oil) */
  yield: number
  /** Monedas (Coins) requeridas para la fabricación */
  coins?: number
  /** Lista de ingredientes requeridos */
  ingredients: RecipeIngredient[]
  /** Tiempo de procesamiento en segundos (si aplica) */
  timeSeconds?: number
  /** Experiencia (XP) otorgada (si aplica) */
  xp?: number
  /** Experiencia base para peces curados */
  agedXp?: number
  /** Experiencia prime para peces curados */
  primeAgedXp?: number
  /** Ruta relativa del icono / imagen del ítem */
  image?: string
}

// ---------------------------------------------------------------------------
// Helpers Internos de Normalización
// ---------------------------------------------------------------------------

function _timeToSeconds(timeStr?: string): number | undefined {
  if (!timeStr) return undefined
  const parts = timeStr.split(":").map((p) => parseInt(p, 10))
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return undefined
}

function _normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, " ")
}

// ---------------------------------------------------------------------------
// Índice de Recetas (Map en memoria O(1))
// ---------------------------------------------------------------------------

const _recipesById = new Map<string, UnifiedRecipe>()
const _recipesByName = new Map<string, UnifiedRecipe>()

function _registerRecipe(recipe: UnifiedRecipe): void {
  _recipesById.set(recipe.id.toLowerCase().trim(), recipe)
  _recipesByName.set(_normalizeKey(recipe.name), recipe)
}

// 1. Ingesta: Cocina (recipes.json) — 88 recetas (Fire Pit, Kitchen, Bakery, Deli, Smoothie Shack)
if (recipesDataRaw && Array.isArray((recipesDataRaw as any).recipes)) {
  for (const r of (recipesDataRaw as any).recipes) {
    if (!r.name) continue
    const id = r.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
    _registerRecipe({
      id,
      name: r.name,
      category: "cooking",
      building: r.building,
      yield: 1,
      coins: 0,
      ingredients: (r.ingredients || []).map((i: any) => ({
        name: i.name,
        amount: Number(i.amount) || 0,
      })),
      timeSeconds: _timeToSeconds(r.time),
      xp: Number(r.xp) || 0,
      image: r.image,
    })
  }
}

// 2. Ingesta: Aging Shed (aging_shed.json) — 45 ítems (Aging de peces, Fermentación, Especias)
if (agingShedDataRaw?.building?.tabs) {
  for (const tab of agingShedDataRaw.building.tabs) {
    for (const cat of tab.categories) {
      for (const item of cat.items) {
        if (!item.name) continue
        const id = item.id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
        let ingredients: RecipeIngredient[] = []

        if (tab.id === "aging") {
          // El pez envejecido pide 1 pez crudo (quitando "Aged ") + sal
          const rawFishName = item.name.replace(/^Aged\s+/, "")
          ingredients = [
            { name: rawFishName, amount: 1 },
            { name: "Salt", amount: Number((item as any).salt) || 0 },
          ]
        } else if ((item as any).ingredients) {
          ingredients = (item as any).ingredients.map((i: any) => ({
            name: i.name,
            amount: Number(i.amount) || 0,
          }))
        }

        _registerRecipe({
          id,
          name: item.name,
          category: "aging_shed",
          building: "Aging Shed",
          yield: Number((item as any).yield) || 1,
          coins: 0,
          ingredients,
          timeSeconds: Number((item as any).timeSeconds) || undefined,
          agedXp: Number((item as any).agedXp) || undefined,
          primeAgedXp: Number((item as any).primeAgedXp) || undefined,
          image: item.image,
        })
      }
    }
  }
}

// 3. Ingesta: Herrería y Herramientas (blacksmith_tools.json) — 13 herramientas
if (blacksmithToolsDataRaw?.buildings) {
  for (const b of Object.values((blacksmithToolsDataRaw as any).buildings) as any[]) {
    for (const t of b.tabs || []) {
      for (const c of t.categories || []) {
        for (const item of c.items || []) {
          if (!item.name) continue
          const id = item.id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
          _registerRecipe({
            id,
            name: item.name,
            category: "blacksmith",
            building: b.name || "Blacksmith",
            yield: 1,
            coins: Number(item.coins) || 0,
            ingredients: (item.ingredients || []).map((i: any) => ({
              name: i.name,
              amount: Number(i.amount) || 0,
            })),
            image: item.image,
          })
        }
      }
    }
  }
}

// 4. Ingesta: Consumibles de Animales (consumables.json)
if (consumablesDataRaw && typeof consumablesDataRaw === "object") {
  for (const [key, item] of Object.entries(consumablesDataRaw as Record<string, any>)) {
    if (item && Array.isArray(item.craftingIngredients) && item.craftingIngredients.length > 0) {
      const id = item.id || key
      // Si ya fue registrado por el Aging Shed (ej: Honey Treat con yield=6), respetamos la versión con yield
      const existing = _recipesById.get(id.toLowerCase())
      if (!existing) {
        _registerRecipe({
          id,
          name: item.name || key,
          category: "animals",
          building: "Barn / Aging Shed",
          yield: 1,
          coins: 0,
          ingredients: item.craftingIngredients.map((i: any) => ({
            name: i.name,
            amount: Number(i.amount) || 0,
          })),
          image: item.image,
        })
      }
    }
  }
}

// 5. Ingesta: Petróleo (Oil) — Producido vía Oil Drill
_registerRecipe({
  id: "oil",
  name: "Oil",
  category: "oil",
  building: "Oil Drill",
  yield: DEFAULT_OIL_MULTIPLIER,
  coins: OIL_DRILL_RECIPE.coins,
  ingredients: OIL_DRILL_RECIPE.ingredients.map((i) => ({ name: i.name, amount: i.amount })),
})

// 6. Ingesta: Fish Market (fish_market.json) — 4 cebos especializados (Fish Flake, Fish Stick, Fish Oil, Crab Stick)
if (Array.isArray(fishMarketDataRaw)) {
  const seasons = ["spring", "summer", "autumn", "winter"] as const
  for (const item of fishMarketDataRaw) {
    if (!item.name) continue
    const timeSec = (Number(item.craftTimeHours) || 1) * 3600

    // Registrar variantes estacionales (ej: "fish_flake_spring")
    for (const season of seasons) {
      const seasonal =
        (item.seasonalIngredients as Record<string, Record<string, number>>)?.[season] || {}
      const seasonalIngredients: RecipeIngredient[] = [
        ...Object.entries(item.baseIngredients || {}).map(([name, amount]) => ({
          name,
          amount: Number(amount) || 0,
        })),
        ...Object.entries(seasonal).map(([name, amount]) => ({
          name,
          amount: Number(amount) || 0,
        })),
      ]

      _registerRecipe({
        id: `${item.id}_${season}`,
        name: `${item.name} (${season.charAt(0).toUpperCase() + season.slice(1)})`,
        category: "fish_market",
        building: "Fish Market",
        yield: 1,
        coins: 0,
        ingredients: seasonalIngredients,
        timeSeconds: timeSec,
        image: item.image,
      })
    }

    // Registrar versión canónica (default a primavera como base inicial de catálogo)
    const defaultSeasonal =
      (item.seasonalIngredients as Record<string, Record<string, number>>)?.spring || {}
    _registerRecipe({
      id: item.id,
      name: item.name,
      category: "fish_market",
      building: "Fish Market",
      yield: 1,
      coins: 0,
      ingredients: [
        ...Object.entries(item.baseIngredients || {}).map(([name, amount]) => ({
          name,
          amount: Number(amount) || 0,
        })),
        ...Object.entries(defaultSeasonal).map(([name, amount]) => ({
          name,
          amount: Number(amount) || 0,
        })),
      ],
      timeSeconds: timeSec,
      image: item.image,
    })
  }
}

// 7. Ingesta: Boleto de Temporada Activo
_registerRecipe({
  id: CURRENT_SEASON.ticketName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name: CURRENT_SEASON.ticketName,
  category: "general",
  yield: 1,
  coins: 0,
  ingredients: [],
  image: CURRENT_SEASON.ticketImage,
})

// ---------------------------------------------------------------------------
// API Pública de Consulta del Catálogo de Fabricación
// ---------------------------------------------------------------------------

/**
 * Busca una receta de fabricación por su ID normalizado o por su nombre visible (case-insensitive).
 *
 * @example
 * getRecipe("pizza_margherita")
 * getRecipe("Pizza Margherita")
 * getRecipe("Aged White Shark")
 * getRecipe("oil")
 */
export function getRecipe(nameOrId: string): UnifiedRecipe | undefined {
  if (!nameOrId) return undefined
  const cleanId = nameOrId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  const byId = _recipesById.get(cleanId)
  if (byId) return byId

  const cleanName = _normalizeKey(nameOrId)
  const byName = _recipesByName.get(cleanName)
  if (byName) return byName

  // Búsqueda tolerante: si buscan "Aged White Shark" pero en recetas estaba registrado como "white shark"
  const unaged = cleanName.replace(/^aged\s+/, "")
  if (unaged !== cleanName) {
    const byUnaged = _recipesByName.get(unaged)
    if (byUnaged) return byUnaged
  }

  return undefined
}

/**
 * Retorna la lista completa de todas las recetas indexadas del juego.
 */
export function getAllRecipes(): UnifiedRecipe[] {
  return Array.from(new Set(_recipesByName.values()))
}

/**
 * Retorna las recetas filtradas por subsistema del juego.
 */
export function getRecipesByCategory(category: RecipeCategory): UnifiedRecipe[] {
  return getAllRecipes().filter((r) => r.category === category)
}

/**
 * Retorna las recetas filtradas por edificio de producción (ej: "Fire Pit", "Deli", "Aging Shed").
 */
export function getRecipesByBuilding(building: string): UnifiedRecipe[] {
  const needle = building.toLowerCase().trim()
  return getAllRecipes().filter((r) => r.building?.toLowerCase().trim() === needle)
}
