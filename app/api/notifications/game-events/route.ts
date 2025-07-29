import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { type, players, number, totalCalled, winner } = await request.json()

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    const isMockMode = !accountSid || !authToken

    let result = []

    if (isMockMode) {
      result = [{ status: "fulfilled", value: { success: true, mock: true } }]
    } else {
      try {
        const twilio = require("twilio")
        const client = twilio(accountSid, authToken)

        const formatPhone = (phone) => {
          let cleaned = phone.replace(/[\s\-()]/g, "")
          if (cleaned.startsWith("0")) cleaned = "+58" + cleaned.substring(1)
          if (!cleaned.startsWith("+")) cleaned = "+58" + cleaned
          return cleaned
        }

        const sendMessage = async (to, body) => {
          return client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:${formatPhone(to)}`,
            body,
          })
        }

        switch (type) {
          case "game-started":
            if (!players || !Array.isArray(players)) {
              return NextResponse.json({ error: "Players array required" }, { status: 400 })
            }

            result = await Promise.allSettled(
              players.map((player) => {
                const message = `🚀 *¡${player.name}, el juego ha comenzado!*

🎯 Ya estamos cantando números. Revisa tus cartones y marca los números que coincidan.

📱 Mantente atento a las actualizaciones del juego.

¡Que tengas suerte! 🍀`

                return sendMessage(player.phone, message)
              }),
            )
            break

          case "number-called":
            if (!players || !number || totalCalled === undefined) {
              return NextResponse.json({ error: "Players, number, and totalCalled required" }, { status: 400 })
            }

            if (totalCalled % 3 !== 0 && totalCalled !== 1) {
              result = [{ status: "fulfilled", value: { success: true, skipped: true } }]
              break
            }

            const numberMessage = `📢 *NÚMERO CANTADO: ${number}*

🎯 Números cantados hasta ahora: ${totalCalled}/75

¡Revisa tus cartones! 🎮`

            result = await Promise.allSettled(players.map((player) => sendMessage(player.phone, numberMessage)))
            break

          case "bingo-winner":
            if (!winner || !winner.name || !winner.phone || !winner.cardId) {
              return NextResponse.json({ error: "Winner details required" }, { status: 400 })
            }

            const winnerMessage = `🏆 *¡¡¡FELICITACIONES ${winner.name.toUpperCase()}!!!*

🎉 ¡HAS GANADO EL BINGO! 🎉

🎯 *Detalles del premio:*
• Cartón ganador: ${winner.cardId}
• ¡Eres el ganador oficial!

🎊 Contacta a los organizadores para reclamar tu premio.

¡INCREÍBLE! 🌟`

            const winnerResult = await sendMessage(winner.phone, winnerMessage)
            result = [{ status: "fulfilled", value: winnerResult }]
            break

          case "game-reset":
            if (!players || !Array.isArray(players)) {
              return NextResponse.json({ error: "Players array required" }, { status: 400 })
            }

            const resetMessage = `🔄 *NUEVO JUEGO INICIANDO*

🎯 Se ha reiniciado el juego de bingo. 

📋 Prepárate para la próxima ronda.

¡Buena suerte a todos! 🍀`

            result = await Promise.allSettled(players.map((player) => sendMessage(player.phone, resetMessage)))
            break

          default:
            return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to send game notifications",
            details: error.message,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      result,
      mock: isMockMode,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
