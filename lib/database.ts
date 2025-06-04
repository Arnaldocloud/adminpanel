import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(process.cwd(), "bingo.db")
const db = new Database(dbPath)

// Habilitar foreign keys
db.pragma("foreign_keys = ON")

// Crear tablas
const createTables = () => {
  // Tabla de juegos
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      total_numbers_called INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    )
  `)

  // Tabla de jugadores
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      cards_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
    )
  `)

  // Tabla de cartones
  db.exec(`
    CREATE TABLE IF NOT EXISTS bingo_cards (
      id TEXT PRIMARY KEY,
      player_id INTEGER NOT NULL,
      numbers TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
    )
  `)

  // Tabla de números cantados
  db.exec(`
    CREATE TABLE IF NOT EXISTS called_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      number INTEGER NOT NULL,
      called_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
    )
  `)

  // Tabla de ganadores
  db.exec(`
    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      card_id TEXT NOT NULL,
      winning_pattern TEXT DEFAULT 'full_card',
      winning_numbers TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES bingo_cards (id) ON DELETE CASCADE
    )
  `)
}

// Inicializar base de datos
createTables()

export default db
