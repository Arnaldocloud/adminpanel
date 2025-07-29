export interface Game {
  id: number
  name: string
  status: "active" | "finished"
  total_numbers_called: number
  created_at: string
  finished_at?: string
}

export interface Player {
  id: number
  game_id: number
  name: string
  phone: string
  cedula: string
  cards_count: number
  created_at: string
}

export interface BingoCard {
  id: string
  player_id: number
  numbers: number[]
  created_at: string
}

export interface CalledNumber {
  id: number
  game_id: number
  number: number
  called_at: string
}

export interface Winner {
  id: number
  game_id: number
  player_id: number
  card_id: string
  winning_pattern: string
  winning_numbers: number[]
  created_at: string
  player_name?: string
  player_phone?: string
  player_cedula?: string
}

export interface GameHistory {
  game: Game
  players_count: number
  total_cards: number
  winners_count: number
  numbers_called: number[]
}
