import { createClient } from "@supabase/supabase-js"

// Verificar si las variables de entorno están disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Verificar si tenemos credenciales reales
const hasValidCredentials =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"

// Crear cliente de Supabase con manejo de errores
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Desactivar persistencia para evitar errores en SSR
  },
})

// Función para verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return hasValidCredentials
}

// Función para verificar la conexión
export async function checkSupabaseConnection() {
  try {
    if (!hasValidCredentials) {
      return {
        connected: false,
        error: "Missing Supabase environment variables",
        message: "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      }
    }

    const { data, error } = await supabase.from("games").select("count").limit(1)

    if (error) {
      return {
        connected: false,
        error: error.message,
        message: "Failed to connect to Supabase",
      }
    }

    return {
      connected: true,
      message: "Successfully connected to Supabase",
    }
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
      message: "Failed to connect to Supabase",
    }
  }
}

// Tipos de datos para TypeScript
export interface Game {
  id: string
  name: string
  status: "active" | "finished"
  total_numbers_called: number
  created_at: string
  finished_at?: string
  created_by?: string
}

export interface Player {
  id: string
  game_id: string
  name: string
  phone: string
  cedula: string
  cards_count: number
  created_at: string
}

export interface BingoCard {
  id: string
  player_id: string
  numbers: number[]
  created_at: string
}

export interface CalledNumber {
  id: string
  game_id: string
  number: number
  called_at: string
}

export interface Winner {
  id: string
  game_id: string
  player_id: string
  card_id: string
  winning_pattern: string
  winning_numbers: number[]
  created_at: string
  player?: Player
  card?: BingoCard
}

export interface PurchaseOrder {
  id: string
  player_name: string
  player_phone: string
  player_cedula: string
  cart_items: CartItem[]
  total_amount: number
  status: "pending" | "paid" | "verified" | "rejected"
  payment_method: string
  transaction_id?: string
  reference_number?: string
  sender_phone?: string
  sender_name?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  numbers: number[]
  price: number
}
