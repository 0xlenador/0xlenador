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

// Grupos de buffs mutuamente excluyentes (activar uno desactiva automáticamente a los demás del grupo)
const MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS: string[][] = [
  // Estaciones de Pesca (solo 1 estación activa a la vez)
  ["Pink Dolphin", "2254"], // Primavera
  ["Jellyfish", "2203"],    // Verano
  ["Poseidon", "2318"],     // Otoño
  ["Super Star", "1549"],   // Invierno
]

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
    if (rank > 0) {
      const currentSubgroupIdx = MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS.findIndex((subgroup) =>
        subgroup.includes(skillName)
      )
      if (currentSubgroupIdx !== -1) {
        MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS.forEach((subgroup, idx) => {
          if (idx !== currentSubgroupIdx) {
            subgroup.forEach((member) => {
              delete state.buffs[member]
              delete state.skills[member]
            })
          }
        })
      }
      state.skills[skillName] = rank

      // Si se activa la habilidad Frenzied Fish, activar automáticamente el evento Fish Frenzy
      if (skillName === "Frenzied Fish") {
        state.buffs["Fish Frenzy"] = true
        state.buffs["9020"] = true
        state.skills["Fish Frenzy"] = 1
      }
      // Si se activa Summer Guardian, activar automáticamente Full Moon
      if (skillName === "Summer Guardian" || skillName === "2262") {
        state.buffs["Summer Guardian"] = true
        state.buffs["2262"] = true
        state.buffs["Full Moon"] = true
        state.buffs["9023"] = true
        state.skills["Full Moon"] = 1
      }
    } else {
      delete state.skills[skillName]
      delete state.buffs[skillName]
      if (skillName === "Fish Frenzy" || skillName === "9020") {
        delete state.buffs["Fish Frenzy"]
        delete state.buffs["9020"]
        delete state.skills["Fish Frenzy"]
      }
      if (skillName === "Full Moon" || skillName === "9023") {
        delete state.buffs["Full Moon"]
        delete state.buffs["9023"]
        delete state.skills["Full Moon"]
        delete state.buffs["Summer Guardian"]
        delete state.buffs["2262"]
        delete state.skills["Summer Guardian"]
      }
      if (skillName === "Summer Guardian" || skillName === "2262") {
        delete state.buffs["Summer Guardian"]
        delete state.buffs["2262"]
        delete state.skills["Summer Guardian"]
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
    const id = String(buffIdOrName)
    const state = this.getState()
    return Boolean(state.buffs[id] || (state.skills[id] && state.skills[id] > 0))
  },

  /** Activa o desactiva un buff específico */
  setBuffActive(buffIdOrName: string, active: boolean): void {
    const state = this.getState()
    const id = String(buffIdOrName)
    if (active) {
      // Si pertenece a un subgrupo mutuamente exclusivo, apagar los miembros de los otros subgrupos
      const currentSubgroupIdx = MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS.findIndex((subgroup) =>
        subgroup.includes(id)
      )
      if (currentSubgroupIdx !== -1) {
        MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS.forEach((subgroup, idx) => {
          if (idx !== currentSubgroupIdx) {
            subgroup.forEach((member) => {
              delete state.buffs[member]
              delete state.skills[member]
            })
          }
        })
      }
      state.buffs[id] = true
      // Si se activa Frenzied Fish, activar automáticamente el evento Fish Frenzy
      if (id === "Frenzied Fish") {
        state.buffs["Fish Frenzy"] = true
        state.buffs["9020"] = true
        state.skills["Fish Frenzy"] = 1
      }
      // Si se activa Summer Guardian, activar automáticamente Full Moon
      if (id === "Summer Guardian" || id === "2262") {
        state.buffs["Summer Guardian"] = true
        state.buffs["2262"] = true
        state.buffs["Full Moon"] = true
        state.buffs["9023"] = true
        state.skills["Full Moon"] = 1
      }
      if (id === "Full Moon" || id === "9023") {
        state.buffs["Full Moon"] = true
        state.buffs["9023"] = true
        state.skills["Full Moon"] = 1
      }
      if (id === "Navigation Table" || id === "2992") {
        state.buffs["Navigation Table"] = true
        state.buffs["2992"] = true
      }
      if (id === "Deep Sea Helm" || id === "9024") {
        state.buffs["Deep Sea Helm"] = true
        state.buffs["9024"] = true
        state.skills["Deep Sea Helm"] = 1
      }
    } else {
      delete state.buffs[id]
      delete state.skills[id]
      if (id === "Fish Frenzy" || id === "9020") {
        delete state.buffs["Fish Frenzy"]
        delete state.buffs["9020"]
        delete state.skills["Fish Frenzy"]
      }
      if (id === "Full Moon" || id === "9023") {
        delete state.buffs["Full Moon"]
        delete state.buffs["9023"]
        delete state.skills["Full Moon"]
        delete state.buffs["Summer Guardian"]
        delete state.buffs["2262"]
        delete state.skills["Summer Guardian"]
      }
      if (id === "Summer Guardian" || id === "2262") {
        delete state.buffs["Summer Guardian"]
        delete state.buffs["2262"]
        delete state.skills["Summer Guardian"]
      }
      if (id === "Navigation Table" || id === "2992") {
        delete state.buffs["Navigation Table"]
        delete state.buffs["2992"]
      }
      if (id === "Deep Sea Helm" || id === "9024") {
        delete state.buffs["Deep Sea Helm"]
        delete state.buffs["9024"]
        delete state.skills["Deep Sea Helm"]
      }
      const currentSubgroupIdx = MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS.findIndex((subgroup) =>
        subgroup.includes(id)
      )
      if (currentSubgroupIdx !== -1) {
        MUTUALLY_EXCLUSIVE_BUFF_SUBGROUPS[currentSubgroupIdx].forEach((member) => {
          delete state.buffs[member]
          delete state.skills[member]
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
