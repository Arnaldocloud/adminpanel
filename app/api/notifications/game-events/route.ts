import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🎮 Procesando notificación de evento de juego...")

    const { type, players, number, totalCalled, winner } = await request.json()

    console.log("📊 Datos recibidos:", { type, playersCount: players?.length, number, totalCalled, winner })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("🌍 Entorno:", process.env.NODE_ENV)

    let result = []

    if (isMockMode) {
      console.log(`🔸 [MOCK] Notificación de ${type} simulada`)
      result = [{ status: "fulfilled", value: { success: true, mock: true } }]
    } else {
      try {
        // Importar Twilio directamente
        const twilio = require("twilio")
        const client = twilio(accountSid, authToken)

        // Función para formatear número
        const formatPhone = (phone) => {
          let cleaned = phone.replace(/[\s\-()]/g, "")
          if (cleaned.startsWith("0")) cleaned = "+58" + cleaned.substring(1)
          if (!cleaned.startsWith("+")) cleaned = "+58" + cleaned
          return cleaned
        }

        // Función para enviar mensaje
        const sendMessage = async (to, body) => {
          console.log(`📤 Enviando a ${to}...`)
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

            console.log(`🚀 Enviando notificación de inicio a ${players.length} jugadores`)

            result = await Promise.allSettled(
              players.map((player) => {
                const message = `
🚀 *¡${player.name}, el juego ha comenzado!*

🎯 Ya estamos cantando números. Revisa tus cartones y marca los números que coincidan.

📱 Mantente atento a las actualizaciones del juego.

¡Que tengas suerte! 🍀
              `.trim()

                return sendMessage(player.phone, message)
              }),
            )
            break

          case "number-called":
            if (!players || !number || totalCalled === undefined) {
              return NextResponse.json({ error: "Players, number, and totalCalled required" }, { status: 400 })
            }

            // Enviar cada 3 números para no saturar
            if (totalCalled % 3 !== 0 && totalCalled !== 1) {
              console.log(`⏭️ Saltando notificación para número ${number} (total: ${totalCalled})`)
              result = [{ status: "fulfilled", value: { success: true, skipped: true } }]
              break
            }

            console.log(`📢 Enviando notificación de número ${number} a ${players.length} jugadores`)

            const numberMessage = `
📢 *NÚMERO CANTADO: ${number}*

🎯 Números cantados hasta ahora: ${totalCalled}/75

¡Revisa tus cartones! 🎮
            `.trim()

            result = await Promise.allSettled(players.map((player) => sendMessage(player.phone, numberMessage)))
            break

          case "bingo-winner":
            if (!winner || !winner.name || !winner.phone || !winner.cardId) {
              return NextResponse.json({ error: "Winner details required" }, { status: 400 })
            }

            console.log(`🏆 Enviando notificación de ganador: ${winner.name}`)

            const winnerMessage = `
🏆 *¡¡¡FELICITACIONES ${winner.name.toUpperCase()}!!!*

🎉 ¡HAS GANADO EL BINGO! 🎉

🎯 *Detalles del premio:*
• Cartón ganador: ${winner.cardId}
• ¡Eres el ganador oficial!

🎊 Contacta a los organizadores para reclamar tu premio.

¡INCREÍBLE! 🌟
            `.trim()

            const winnerResult = await sendMessage(winner.phone, winnerMessage)
            result = [{ status: "fulfilled", value: winnerResult }]
            break

          case "game-reset":
            if (!players || !Array.isArray(players)) {
              return NextResponse.json({ error: "Players array required" }, { status: 400 })
            }

            console.log(`🔄 Enviando notificación de reinicio a ${players.length} jugadores`)

            const resetMessage = `
🔄 *NUEVO JUEGO INICIANDO*

🎯 Se ha reiniciado el juego de bingo. 

📋 Prepárate para la próxima ronda.

¡Buena suerte a todos! 🍀
            `.trim()

            result = await Promise.allSettled(players.map((player) => sendMessage(player.phone, resetMessage)))
            break

          default:
            return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
        }

        console.log("📤 Resultado de notificaciones:", result)
      } catch (error) {
        console.error("💥 Error en notificaciones de juego:", error)
        return NextResponse.json(
          {
            error: "Failed to send game notifications",
            details: error.message,
            code: error.code,
          },
          { status: 500 },
        )
      }
    }

    console.log("✅ Notificaciones procesadas exitosamente")
    return NextResponse.json({
      success: true,
      result,
      mock: isMockMode,
      message: `${type} notifications processed`,
      environment: process.env.NODE_ENV,
    })
  } catch (error: any) {
    console.error("💥 Error en game events notification:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
