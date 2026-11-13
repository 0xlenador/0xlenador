// ============================================================
// src/lib/sfl/market.ts
// Motor centralizado de precios P2P para Sunflower Land.
//
// Responsabilidad única: obtener, cachear y exponer los datos
// del mercado P2P (sfl_data.json) y los cálculos derivados
// (tasa Betty, precio de FLOWER).
//
// IMPORTANTE: Este archivo NO modifica ningún endpoint, cron,
// Worker de Cloudflare ni la estructura de sfl_data.json.
// Solo CONSUME los datos que ya existen en /api/sfl_data.json.
// ============================================================

// ---------------------------------------------------------------------------
// Datos estáticos del juego (importados directamente)
// ---------------------------------------------------------------------------
import bettyPrices from "../../content/data/sfl/betty_prices.json"
import sflIds from "../../content/data/sfl/resources.json"

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface MarketItem {
  key: string
  currentPrice: number
  trades7d?: number
  [k: string]: unknown
}

export interface MarketData {
  flowerPrice?: string | number
  items: Record<string, MarketItem>
  [k: string]: unknown
}

export interface SflMarketState {
  /** Datos crudos de /api/sfl_data.json (último fetch exitoso) */
  raw: MarketData | null
  /** Precio de 1 FLOWER en USD */
  flowerPrice: number
  /** Mejor tasa de conversión: cuántos Coins equivalen a 1 FLOWER */
  bettyRatio: number
}

// ---------------------------------------------------------------------------
// Estado interno (singleton en el navegador)
// ---------------------------------------------------------------------------

const state: SflMarketState = {
  raw: null,
  flowerPrice: 0.144,
  bettyRatio: 320,
}

let _fetchPromise: Promise<MarketData | null> | null = null

// ---------------------------------------------------------------------------
// Callbacks de actualización: las vistas se suscriben para
// reaccionar cuando los datos de mercado se actualizan.
// ---------------------------------------------------------------------------

type UpdateCallback = (state: SflMarketState) => void
const _listeners: UpdateCallback[] = []

// ---------------------------------------------------------------------------
// API Pública
// ---------------------------------------------------------------------------

/**
 * Descarga /api/sfl_data.json, actualiza el estado interno
 * y notifica a todos los listeners.
 * Si ya hay un fetch en curso, devuelve la misma promesa (dedup).
 */
export async function fetchMarketData(forceRefresh = false): Promise<MarketData | null> {
  if (_fetchPromise && !forceRefresh) return _fetchPromise

  _fetchPromise = _doFetch(forceRefresh)
  const result = await _fetchPromise
  _fetchPromise = null
  return result
}

/**
 * Devuelve el precio P2P en FLOWER de un recurso por su nombre.
 * Ej: getItemPrice("Wood") → 0.0025
 */
export function getItemPrice(name: string): number {
  if (!state.raw?.items) return 0
  const itemId = Object.keys(sflIds).find((k) => (sflIds as Record<string, string>)[k] === name)
  if (!itemId) return 0
  const item = state.raw.items[`collectibles-${itemId}`]
  return item?.currentPrice ? parseFloat(String(item.currentPrice)) : 0
}

/**
 * Devuelve el precio actual de 1 FLOWER en USD.
 */
export function getFlowerPrice(): number {
  return state.flowerPrice
}

/**
 * Devuelve la mejor tasa Betty (Coins por 1 FLOWER).
 */
export function getBettyRatio(): number {
  return state.bettyRatio
}

/**
 * Convierte una cantidad de Coins a FLOWER usando la tasa Betty activa.
 */
export function coinsToFlower(coins: number): number {
  return state.bettyRatio > 0 ? coins / state.bettyRatio : 0
}

/**
 * Convierte FLOWER a USD usando el precio actual.
 */
export function flowerToUsd(flower: number): number {
  return flower * state.flowerPrice
}

/**
 * Devuelve los datos crudos del último fetch (o null si aún no se cargó).
 */
export function getRawData(): MarketData | null {
  return state.raw
}

/**
 * Devuelve una copia del estado actual completo.
 */
export function getState(): Readonly<SflMarketState> {
  return { ...state }
}

/**
 * Suscribe un callback que se ejecutará cada vez que los datos
 * de mercado se actualicen (después de cada fetch exitoso).
 * Devuelve una función para desuscribirse.
 */
export function onUpdate(callback: UpdateCallback): () => void {
  _listeners.push(callback)
  return () => {
    const idx = _listeners.indexOf(callback)
    if (idx >= 0) _listeners.splice(idx, 1)
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function _doFetch(forceRefresh: boolean): Promise<MarketData | null> {
  try {
    const cacheBuster = forceRefresh ? Date.now() : Math.floor(Date.now() / (5 * 60 * 1000))
    const res = await fetch(`/api/sfl_data.json?v=${cacheBuster}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data: MarketData = await res.json()
    if (!data.items) throw new Error("sfl_data.json no contiene items")

    state.raw = data

    if (data.flowerPrice) {
      state.flowerPrice = parseFloat(String(data.flowerPrice))
    }

    state.bettyRatio = _calculateBettyRatio(data)

    _notify()

    return data
  } catch (err) {
    console.error("[SflMarket] Error al obtener datos de mercado:", err)
    return null
  }
}

function _calculateBettyRatio(data: MarketData): number {
  if (!data.items) return state.bettyRatio

  const ids = sflIds as Record<string, string>
  const prices = bettyPrices as Record<string, { sellPrice: number }>
  let bestRatio = 0

  Object.keys(prices).forEach((name) => {
    const itemConfig = prices[name]
    const itemId = Object.keys(ids).find((key) => ids[key] === name)
    if (!itemId) return

    const marketItem = data.items[`collectibles-${itemId}`]
    const bettyPriceCoins = itemConfig.sellPrice
    const p2pPriceFlower = marketItem ? marketItem.currentPrice : 0

    if (p2pPriceFlower > 0) {
      const ratio = bettyPriceCoins / p2pPriceFlower
      if (ratio > bestRatio) {
        bestRatio = ratio
      }
    }
  })

  return bestRatio > 0 ? bestRatio : state.bettyRatio
}

function _notify(): void {
  const snapshot = { ...state }

  if (typeof window !== "undefined") {
    ;(window as any).__sflMarketState = snapshot
    ;(window as any).__bestCoinsPerFlower = snapshot.bettyRatio
    try {
      window.dispatchEvent(new CustomEvent("sfl:marketUpdated", { detail: snapshot }))
    } catch (e) {}
  }

  _listeners.forEach((cb) => {
    try {
      cb(snapshot)
    } catch (err) {
      console.error("[SflMarket] Error en listener:", err)
    }
  })
}
