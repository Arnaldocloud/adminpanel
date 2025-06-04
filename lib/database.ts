import { sql } from "@vercel/postgres"

// Función para inicializar las tablas
export async function initializeTables() {
  try {
    // Crear tablas si no existen
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        total_numbers_called INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        cards_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS bingo_cards (
        id TEXT PRIMARY KEY,
        player_id INTEGER NOT NULL,
        numbers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS called_numbers (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        number INTEGER NOT NULL,
        called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS winners (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        card_id TEXT NOT NULL,
        winning_pattern TEXT DEFAULT 'full_card',
        winning_numbers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES bingo_cards (id) ON DELETE CASCADE
      )
    `

    console.log("✅ Tablas inicializadas correctamente")
  } catch (error) {
    console.error("❌ Error inicializando tablas:", error)
    throw error
  }
}

// Funciones de utilidad para la base de datos
export { sql }
