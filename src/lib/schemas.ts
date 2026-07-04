// ============================================================
// src/lib/schemas.ts
// Schemas Zod centralizados para los datos de directory.json y faucets.json
// Proporciona validación en build-time y tipado TypeScript automático.
// ============================================================

import { z } from "astro:content"

// ---------------------------------------------------------------------------
// Schema para directory.json
// Campos: id, name, url, tag, sponsored, logo, alt_logo
// ---------------------------------------------------------------------------
export const directoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  tag: z.string(),
  sponsored: z.boolean().default(false),
  logo: z.string(),
  alt_logo: z.string().optional(),
  // Campos extendidos usados en ToolingGrid (objetos inline en watchlist JSONs)
  image: z.string().optional(),
  subtitle: z.string().optional(),
  partner: z.boolean().optional(),
})

export const directorySchema = z.array(directoryItemSchema)
export type DirectoryItem = z.infer<typeof directoryItemSchema>

// ---------------------------------------------------------------------------
// Schema para faucets.json
// Campos: name, url, img, type, tags
// (No tienen campo id — el name actúa como identificador único)
// ---------------------------------------------------------------------------
export const faucetItemSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  img: z.string(),
  type: z.enum(["testnet", "mainnet"]),
  tags: z.array(z.string()),
})

export const faucetsSchema = z.array(faucetItemSchema)
export type FaucetItem = z.infer<typeof faucetItemSchema>
