"use client"

import { useState, useEffect } from "react"
import { gameService, playerService, cardService, calledNumberService, winnerService } from "@/lib/database-functions"
import type { Game, Player, BingoCard, CalledNumber, Winner } from "@/lib/supabase"

export function useSupabaseGame(gameId?: string) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [cards, setCards] = useState<BingoCard[]>([])
  const [calledNumbers, setCalledNumbers] = useState<CalledNumber[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Crear nuevo juego
  const createGame = async (name: string) => {
    try {
      setLoading(true)
      const game = await gameService.create(name)
      setCurrentGame(game)
      return game
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating game")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cargar juego por ID
  const loadGame = async (id: string) => {
    try {
      setLoading(true)
      const [game, gamePlayers, gameCalledNumbers, gameWinners] = await Promise.all([
        gameService.getById(id),
        playerService.getByGameId(id),
        calledNumberService.getByGameId(id),
        winnerService.getByGameId(id),
      ])

      setCurrentGame(game)
      setPlayers(gamePlayers)
      setCalledNumbers(gameCalledNumbers)
      setWinners(gameWinners)

      // Cargar cartones de todos los jugadores
      const allCards: BingoCard[] = []
      for (const player of gamePlayers) {
        const playerCards = await cardService.getByPlayerId(player.id)
        allCards.push(...playerCards)
      }
      setCards(allCards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading game")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Agregar jugador
  const addPlayer = async (playerData: {
    name: string
    phone: string
    cedula: string
    cardsCount: number
    cardNumbers?: number[][]
  }) => {
    if (!currentGame) throw new Error("No active game")

    try {
      setLoading(true)

      // Crear jugador
      const player = await playerService.create({
        game_id: currentGame.id,
        name: playerData.name,
        phone: playerData.phone,
        cedula: playerData.cedula,
        cards_count: playerData.cardsCount,
      })

      // Crear cartones
      const cardsToCreate = []
      for (let i = 0; i < playerData.cardsCount; i++) {
        const numbers = playerData.cardNumbers?.[i] || generateRandomCard()
        cardsToCreate.push({
          player_id: player.id,
          numbers,
        })
      }

      const createdCards = await cardService.createMany(cardsToCreate)

      setPlayers((prev) => [...prev, player])
      setCards((prev) => [...prev, ...createdCards])

      return { player, cards: createdCards }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding player")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cantar número
  const callNumber = async (number: number) => {
    if (!currentGame) throw new Error("No active game")

    try {
      setLoading(true)

      const calledNumber = await calledNumberService.create(currentGame.id, number)
      setCalledNumbers((prev) => [...prev, calledNumber])

      // Actualizar contador en el juego
      const newCount = calledNumbers.length + 1
      await gameService.updateNumbersCount(currentGame.id, newCount)
      setCurrentGame((prev) => (prev ? { ...prev, total_numbers_called: newCount } : null))

      return calledNumber
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error calling number")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Verificar ganadores
  const checkWinners = async () => {
    if (!currentGame) return []

    const calledNumbersList = calledNumbers.map((cn) => cn.number)
    const newWinners: Winner[] = []

    for (const card of cards) {
      const matchedNumbers = card.numbers.filter((num) => calledNumbersList.includes(num))

      if (matchedNumbers.length === card.numbers.length) {
        const player = players.find((p) => p.id === card.player_id)
        if (player) {
          try {
            const winner = await winnerService.create({
              game_id: currentGame.id,
              player_id: player.id,
              card_id: card.id,
              winning_pattern: "full_card",
              winning_numbers: matchedNumbers,
            })
            newWinners.push(winner)
          } catch (err) {
            console.error("Error creating winner:", err)
          }
        }
      }
    }

    if (newWinners.length > 0) {
      setWinners((prev) => [...prev, ...newWinners])
    }

    return newWinners
  }

  // Reiniciar juego
  const resetGame = async () => {
    if (!currentGame) throw new Error("No active game")

    try {
      setLoading(true)

      // Eliminar números cantados
      await calledNumberService.deleteByGameId(currentGame.id)

      // Actualizar contador
      await gameService.updateNumbersCount(currentGame.id, 0)

      setCalledNumbers([])
      setWinners([])
      setCurrentGame((prev) => (prev ? { ...prev, total_numbers_called: 0 } : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error resetting game")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Finalizar juego
  const finishGame = async () => {
    if (!currentGame) throw new Error("No active game")

    try {
      setLoading(true)
      const finishedGame = await gameService.finish(currentGame.id)
      setCurrentGame(finishedGame)
      return finishedGame
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error finishing game")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Generar cartón aleatorio
  const generateRandomCard = (): number[] => {
    const numbers: number[] = []
    while (numbers.length < 24) {
      const num = Math.floor(Math.random() * 75) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    return numbers.sort((a, b) => a - b)
  }

  // Cargar juego inicial si se proporciona ID
  useEffect(() => {
    if (gameId) {
      loadGame(gameId)
    }
  }, [gameId])

  return {
    // Estado
    currentGame,
    players,
    cards,
    calledNumbers,
    winners,
    loading,
    error,

    // Acciones
    createGame,
    loadGame,
    addPlayer,
    callNumber,
    checkWinners,
    resetGame,
    finishGame,
    generateRandomCard,

    // Utilidades
    clearError: () => setError(null),
  }
}
