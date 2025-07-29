import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
