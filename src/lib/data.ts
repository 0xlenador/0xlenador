// ============================================================
// src/lib/data.ts
// Helpers para acceder a los datos de directory.json y faucets.json
// con validación Zod en build-time.
// ============================================================

import rawDirectory from "../content/data/directory.json"
import rawFaucets from "../content/data/faucets.json"
import { directorySchema, faucetsSchema } from "./schemas"
import type { DirectoryItem, FaucetItem } from "./schemas"

// ---------------------------------------------------------------------------
// Validación en build-time — lanza un error claro si el JSON no cumple el schema
// ---------------------------------------------------------------------------
export const directoryData: DirectoryItem[] = directorySchema.parse(rawDirectory)
export const faucetsData: FaucetItem[] = faucetsSchema.parse(rawFaucets)

// ---------------------------------------------------------------------------
// Helpers de búsqueda
// ---------------------------------------------------------------------------

/** Busca un item del directorio por su `id` */
export function getDirectoryItem(id: string): DirectoryItem | undefined {
  return directoryData.find((item) => item.id === id)
}

/** Busca un faucet por su `name` */
export function getFaucetItem(name: string): FaucetItem | undefined {
  return faucetsData.find((item) => item.name === name)
}

/** Filtra faucets por tipo */
export function getFaucetsByType(type: "testnet" | "mainnet"): FaucetItem[] {
  return faucetsData.filter((item) => item.type === type)
}

/** Devuelve los N tags más frecuentes entre todos los faucets */
export function getTopFaucetNetworks(limit = 5): { tag: string; count: number }[] {
  const freq: Record<string, number> = {}
  faucetsData.forEach((f) => {
    f.tags.forEach((tag) => {
      freq[tag] = (freq[tag] ?? 0) + 1
    })
  })
  return Object.entries(freq)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
