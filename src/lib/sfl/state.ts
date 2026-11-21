/**
 * 0xLeñador — SFL Global User State Manager
 *
 * Centraliza la persistencia y sincronización de habilidades activas (skills),
 * coleccionables, wearables, santuarios, consumibles y preferencias del jugador
 * entre todas las calculadoras (Cocina, Pesca, Animales, etc.).
 *
 * - Clave única en localStorage: 'sfl_user_game_state_v1'
 * - Evento nativo emitido: 'sfl:stateUpdated' (CustomEvent)
 * - Sincronización cross-tab nativa vía listener de 'storage'.
 */

export interface SflUserPreferences {
  flowerPriceUsd?: number
  coinsPerFlower?: number
  rodCost?: number
  customFishFlakeCost?: number | null
  customFishStickCost?: number | null
  customCrabStickCost?: number | null
  customFishOilCost?: number | null
}

export interface SflUserGameState {
  /** Habilidades activas y sus rangos: { [skillName: string]: number } */
  skills: Record<string, number>
  /** IDs de buffs activos (collectibles, wearables, shrines, consumables, others): { [buffIdOrName: string]: boolean } */
  buffs: Record<string, boolean>
  /** Preferencias numéricas globales del jugador */
  preferences: SflUserPreferences
  /** Timestamp de última actualización */
  updatedAt: number
}

const STORAGE_KEY = "sfl_user_game_state_v1"
const LEGACY_COOKING_KEY = "sfl_cooking_state"

const DEFAULT_STATE: SflUserGameState = {
  skills: {},
  buffs: {},
  preferences: {},
  updatedAt: 0,
}

let inMemoryState: SflUserGameState | null = null
let isInitialized = false

/** Comprueba si el entorno es el navegador */
function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

/**
 * Migra datos legados desde 'sfl_cooking_state' si 'sfl_user_game_state_v1' aún no existe.
 */
function tryMigrateLegacyState(): SflUserGameState | null {
  if (!isClient()) return null
  try {
    const rawLegacy = localStorage.getItem(LEGACY_COOKING_KEY)
    if (!rawLegacy) return null
    const legacy = JSON.parse(rawLegacy)
    if (!legacy || typeof legacy !== "object") return null

    const migrated: SflUserGameState = {
      skills: {},
      buffs: {},
      preferences: {},
      updatedAt: Date.now(),
    }

    if (Array.isArray(legacy.activeBuffs)) {
      for (const id of legacy.activeBuffs) {
        if (id) migrated.buffs[String(id)] = true
      }
    }

    if (legacy.activeSkills && typeof legacy.activeSkills === "object") {
      migrated.skills = { ...legacy.activeSkills }
    }

    if (legacy.customCoins) migrated.preferences.coinsPerFlower = Number(legacy.customCoins)
    if (legacy.customRod) migrated.preferences.rodCost = Number(legacy.customRod)
    if (legacy.customFishFlake)
      migrated.preferences.customFishFlakeCost = Number(legacy.customFishFlake)
    if (legacy.customFishStick)
      migrated.preferences.customFishStickCost = Number(legacy.customFishStick)
    if (legacy.customCrabStick)
      migrated.preferences.customCrabStickCost = Number(legacy.customCrabStick)
    if (legacy.customFishOil)
      migrated.preferences.customFishOilCost = Number(legacy.customFishOil)

    return migrated
  } catch {
    return null
  }
}

/** Carga el estado desde localStorage o devuelve el default */
function loadStateFromStorage(): SflUserGameState {
  if (!isClient()) return { ...DEFAULT_STATE }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        skills: parsed.skills || {},
        buffs: parsed.buffs || {},
        preferences: parsed.preferences || {},
        updatedAt: parsed.updatedAt || Date.now(),
      }
    }

    // Si no existe, intentar migración de estado anterior
    const migrated = tryMigrateLegacyState()
    if (migrated) {
      saveStateToStorage(migrated)
      return migrated
    }
  } catch (err) {
    console.warn("[SflUserState] Error al leer localStorage:", err)
  }

  return { ...DEFAULT_STATE }
}

/** Guarda el estado en localStorage y emite el evento global */
function saveStateToStorage(state: SflUserGameState): void {
  if (!isClient()) return
  state.updatedAt = Date.now()
  inMemoryState = state

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.warn("[SflUserState] Error al guardar en localStorage:", err)
  }

  // Notificar a todos los componentes en la misma pestaña
  window.dispatchEvent(new CustomEvent("sfl:stateUpdated", { detail: state }))
}

/** Inicializa listeners para sincronización entre pestañas */
function initSync(): void {
  if (!isClient() || isInitialized) return
  isInitialized = true

  // Listener para sincronización en tiempo real entre pestañas distintas
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        inMemoryState = JSON.parse(e.newValue)
        window.dispatchEvent(new CustomEvent("sfl:stateUpdated", { detail: inMemoryState }))
      } catch {}
    }
  })
}

// ----------------------------------------------------------------------------
// API Pública del Administrador de Estado
// ----------------------------------------------------------------------------

// Mapeo bidireccional entre IDs numéricos y nombres canónicos de buffs
const BUFF_ID_ALIASES: Record<string, string[]> = {
  "Fisher's Hourglass": ["9015"],
  "9015": ["Fisher's Hourglass"],
  "Sunflower Rod": ["9021"],
  "9021": ["Sunflower Rod"],
  "Trident": ["9022"],
  "9022": ["Trident"],
  "Full Moon": ["9023"],
  "9023": ["Full Moon"],
  "Deep Sea Helm": ["9024"],
  "9024": ["Deep Sea Helm"],
  "Fish Frenzy": ["9020"],
  "9020": ["Fish Frenzy"],
  "Summer Guardian": ["2262"],
  "2262": ["Summer Guardian"],
  "Navigation Table": ["2992"],
  "2992": ["Navigation Table"],
  "Ancient Rod": ["224"],
  "224": ["Ancient Rod"],
  "Shrimp Onesie": ["562"],
  "562": ["Shrimp Onesie"],
  "Otty the Otter": ["3050"],
  "3050": ["Otty the Otter"],
}

function getAllKeysForBuff(key: string): string[] {
  const strKey = String(key)
  const aliases = BUFF_ID_ALIASES[strKey] || []
  return [strKey, ...aliases]
}

export const SflUserState = {
  /** Devuelve una copia del estado completo del usuario */
  getState(): SflUserGameState {
    initSync()
    if (!inMemoryState) {
      inMemoryState = loadStateFromStorage()
    }
    return JSON.parse(JSON.stringify(inMemoryState))
  },

  /** Obtiene el diccionario de skills activas { [skillName]: rank } */
  getSkills(): Record<string, number> {
    return this.getState().skills
  },

  /** Obtiene el rango de una skill (0 si está inactiva) */
  getSkillRank(skillName: string): number {
    return this.getState().skills[skillName] || 0
  },

  /** Establece el rango de una skill. Si rank <= 0, se elimina */
  setSkillRank(skillName: string, rank: number): void {
    const state = this.getState()
    const keys = getAllKeysForBuff(skillName)

    if (rank > 0) {
      keys.forEach((k) => {
        state.skills[k] = rank
      })

      // Si se activa la habilidad Frenzied Fish, activar automáticamente el evento Fish Frenzy
      if (keys.includes("Frenzied Fish")) {
        getAllKeysForBuff("Fish Frenzy").forEach((k) => {
          state.buffs[k] = true
          state.skills[k] = 1
        })
      }
      // Si se activa Summer Guardian, activar automáticamente Full Moon
      if (keys.includes("Summer Guardian") || keys.includes("2262")) {
        getAllKeysForBuff("Full Moon").forEach((k) => {
          state.buffs[k] = true
          state.skills[k] = 1
        })
      }
    } else {
      keys.forEach((k) => {
        delete state.skills[k]
        delete state.buffs[k]
      })
      if (keys.includes("Fish Frenzy") || keys.includes("9020")) {
        getAllKeysForBuff("Fish Frenzy").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
      if (keys.includes("Full Moon") || keys.includes("9023")) {
        getAllKeysForBuff("Full Moon").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
        getAllKeysForBuff("Summer Guardian").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
      if (keys.includes("Summer Guardian") || keys.includes("2262")) {
        getAllKeysForBuff("Summer Guardian").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
    }
    saveStateToStorage(state)
  },

  /** Alterna una habilidad (si está activa la apaga, si no, activa rango 1) */
  toggleSkill(skillName: string): number {
    const current = this.getSkillRank(skillName) || (this.isBuffActive(skillName) ? 1 : 0)
    const nextRank = current > 0 ? 0 : 1
    this.setSkillRank(skillName, nextRank)
    return nextRank
  },

  /** Devuelve un array con los IDs o nombres de todos los buffs activos */
  getActiveBuffIds(): string[] {
    const buffs = this.getState().buffs
    return Object.keys(buffs).filter((id) => buffs[id])
  },

  /** Comprueba si un buff específico está activo */
  isBuffActive(buffIdOrName: string): boolean {
    const keys = getAllKeysForBuff(buffIdOrName)
    const state = this.getState()
    return keys.some((k) => Boolean(state.buffs[k] || (state.skills[k] && state.skills[k] > 0)))
  },

  /** Activa o desactiva un buff específico */
  setBuffActive(buffIdOrName: string, active: boolean): void {
    const state = this.getState()
    const keys = getAllKeysForBuff(buffIdOrName)

    if (active) {
      keys.forEach((k) => {
        state.buffs[k] = true
      })

      // Si se activa Frenzied Fish, activar automáticamente el evento Fish Frenzy
      if (keys.includes("Frenzied Fish")) {
        getAllKeysForBuff("Fish Frenzy").forEach((k) => {
          state.buffs[k] = true
          state.skills[k] = 1
        })
      }
      // Si se activa Summer Guardian, activar automáticamente Full Moon
      if (keys.includes("Summer Guardian") || keys.includes("2262")) {
        getAllKeysForBuff("Full Moon").forEach((k) => {
          state.buffs[k] = true
          state.skills[k] = 1
        })
      }
    } else {
      keys.forEach((k) => {
        delete state.buffs[k]
        delete state.skills[k]
      })

      if (keys.includes("Fish Frenzy") || keys.includes("9020")) {
        getAllKeysForBuff("Fish Frenzy").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
      if (keys.includes("Full Moon") || keys.includes("9023")) {
        getAllKeysForBuff("Full Moon").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
        getAllKeysForBuff("Summer Guardian").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
      if (keys.includes("Summer Guardian") || keys.includes("2262")) {
        getAllKeysForBuff("Summer Guardian").forEach((k) => {
          delete state.buffs[k]
          delete state.skills[k]
        })
      }
    }
    saveStateToStorage(state)
  },

  /** Alterna un buff entre activo e inactivo y devuelve el nuevo estado */
  toggleBuff(buffIdOrName: string): boolean {
    const current = this.isBuffActive(buffIdOrName)
    const next = !current
    this.setBuffActive(buffIdOrName, next)
    return next
  },

  /** Obtiene las preferencias globales del usuario */
  getPreferences(): SflUserPreferences {
    return this.getState().preferences
  },

  /** Actualiza una o más preferencias del usuario */
  setPreferences(updates: Partial<SflUserPreferences>): void {
    const state = this.getState()
    state.preferences = {
      ...state.preferences,
      ...updates,
    }
    saveStateToStorage(state)
  },

  /**
   * Se suscribe a cualquier cambio de estado (en la misma pestaña o desde otras pestañas).
   * Devuelve una función para desuscribirse.
   */
  subscribe(callback: (state: SflUserGameState) => void): () => void {
    initSync()
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<SflUserGameState>
      if (customEvent.detail) {
        callback(customEvent.detail)
      }
    }

    if (isClient()) {
      window.addEventListener("sfl:stateUpdated", handler)
    }

    return () => {
      if (isClient()) {
        window.removeEventListener("sfl:stateUpdated", handler)
      }
    }
  },

  /** Reinicia el estado del jugador a los valores predeterminados */
  resetState(): void {
    const emptyState: SflUserGameState = {
      skills: {},
      buffs: {},
      preferences: {},
      updatedAt: Date.now(),
    }
    saveStateToStorage(emptyState)
  },
}

// Inyección en window para scripts vanilla en templates de Astro
if (typeof window !== "undefined") {
  ;(window as any).SflUserState = SflUserState
}
