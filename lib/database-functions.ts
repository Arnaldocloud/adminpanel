import { supabase, isSupabaseConfigured } from "./supabase"
import type { Game, Player, BingoCard, CalledNumber, Winner, PurchaseOrder } from "./supabase"

// Función helper para verificar configuración antes de operaciones
function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please set environment variables.")
  }
}

// Funciones para Games
export const gameService = {
  async getAll() {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data as Game[]
  },

  async getById(id: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("games").select("*").eq("id", id).single()

    if (error) throw error
    return data as Game
  },

  async create(name: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("games").insert({ name, status: "active" }).select().single()

    if (error) throw error
    return data as Game
  },

  async finish(id: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("games")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data as Game
  },

  async updateNumbersCount(gameId: string, count: number) {
    ensureSupabaseConfigured()
    const { error } = await supabase.from("games").update({ total_numbers_called: count }).eq("id", gameId)

    if (error) throw error
  },
}

// Funciones para Players
export const playerService = {
  async getByGameId(gameId: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Player[]
  },

  async create(player: Omit<Player, "id" | "created_at">) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("players").insert(player).select().single()

    if (error) throw error
    return data as Player
  },

  async getByCedula(cedula: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("cedula", cedula)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Player[]
  },
}

// Funciones para BingoCards
export const cardService = {
  async getByPlayerId(playerId: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("bingo_cards").select("*").eq("player_id", playerId)

    if (error) throw error
    return data as BingoCard[]
  },

  async create(card: Omit<BingoCard, "id" | "created_at">) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("bingo_cards").insert(card).select().single()

    if (error) throw error
    return data as BingoCard
  },

  async createMany(cards: Omit<BingoCard, "id" | "created_at">[]) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("bingo_cards").insert(cards).select()

    if (error) throw error
    return data as BingoCard[]
  },
}

// Funciones para CalledNumbers
export const calledNumberService = {
  async getByGameId(gameId: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("called_numbers")
      .select("*")
      .eq("game_id", gameId)
      .order("called_at", { ascending: true })

    if (error) throw error
    return data as CalledNumber[]
  },

  async create(gameId: string, number: number) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("called_numbers").insert({ game_id: gameId, number }).select().single()

    if (error) throw error
    return data as CalledNumber
  },

  async deleteByGameId(gameId: string) {
    ensureSupabaseConfigured()
    const { error } = await supabase.from("called_numbers").delete().eq("game_id", gameId)

    if (error) throw error
  },
}

// Funciones para Winners
export const winnerService = {
  async getByGameId(gameId: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("winners")
      .select(`
        *,
        player:players(*),
        card:bingo_cards(*)
      `)
      .eq("game_id", gameId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data as Winner[]
  },

  async create(winner: Omit<Winner, "id" | "created_at">) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("winners").insert(winner).select().single()

    if (error) throw error
    return data as Winner
  },
}

// Funciones para PurchaseOrders
export const orderService = {
  async getAll() {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data as PurchaseOrder[]
  },

  async getByCedula(cedula: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("player_cedula", cedula)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as PurchaseOrder[]
  },

  async create(order: Omit<PurchaseOrder, "id" | "created_at" | "updated_at">) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("purchase_orders").insert(order).select().single()

    if (error) throw error
    return data as PurchaseOrder
  },

  async updateStatus(id: string, status: PurchaseOrder["status"]) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("purchase_orders").update({ status }).eq("id", id).select().single()

    if (error) throw error
    return data as PurchaseOrder
  },

  async getById(id: string) {
    ensureSupabaseConfigured()
    const { data, error } = await supabase.from("purchase_orders").select("*").eq("id", id).single()

    if (error) throw error
    return data as PurchaseOrder
  },
}

// Función para obtener estadísticas del dashboard
export const statsService = {
  async getDashboardStats() {
    try {
      if (!isSupabaseConfigured()) {
        return {
          activeGames: 0,
          totalPlayers: 0,
          totalCards: 0,
          pendingOrders: 0,
          totalRevenue: 0,
        }
      }

      // Obtener juegos activos
      const { data: activeGames } = await supabase.from("games").select("id").eq("status", "active")

      // Obtener total de jugadores
      const { count: totalPlayers } = await supabase.from("players").select("*", { count: "exact", head: true })

      // Obtener total de cartones
      const { count: totalCards } = await supabase.from("bingo_cards").select("*", { count: "exact", head: true })

      // Obtener órdenes pendientes
      const { count: pendingOrders } = await supabase
        .from("purchase_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      // Obtener ingresos totales
      const { data: verifiedOrders } = await supabase
        .from("purchase_orders")
        .select("total_amount")
        .eq("status", "verified")

      const totalRevenue = verifiedOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

      return {
        activeGames: activeGames?.length || 0,
        totalPlayers: totalPlayers || 0,
        totalCards: totalCards || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
      }
    } catch (error) {
      console.error("Error getting dashboard stats:", error)
      return {
        activeGames: 0,
        totalPlayers: 0,
        totalCards: 0,
        pendingOrders: 0,
        totalRevenue: 0,
      }
    }
  },
}
