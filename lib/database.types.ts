export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      purchase_orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          player_name: string
          player_cedula: string
          player_phone: string
          player_email: string | null
          status: 'pending' | 'completed' | 'cancelled'
          total_amount: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          player_name: string
          player_cedula: string
          player_phone: string
          player_email?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          total_amount: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          player_name?: string
          player_cedula?: string
          player_phone?: string
          player_email?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          total_amount?: number
        }
      }
      card_purchases: {
        Row: {
          id: string
          order_id: string
          card_number: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          card_number: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          card_number?: number
          price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
