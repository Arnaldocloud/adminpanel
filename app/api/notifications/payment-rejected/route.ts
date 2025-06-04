import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("❌ Procesando notificación de pago rechazado...")

    const { playerName, playerPhone, orderId, reason } = await request.json()

    if (!playerName || !playerPhone || !orderId) {
      console.error("❌ Faltan campos requeridos")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📊 Datos recibidos:", { playerName, playerPhone, orderId, reason })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("🌍 Entorno:", process.env.NODE_ENV)

    let result

    if (isMockMode) {
      console.log("🔸 [MOCK] Notificación de pago rechazado simulada")
      result = { success: true, messageId: "mock-id", mock: true }
    } else {
      try {
        const { notifyPaymentRejected } = await import("@/lib/twilio")
        result = await notifyPaymentRejected(playerName, playerPhone, orderId, reason)
        console.log("📤 Resultado de notificación:", result)
      } catch (importError) {
        console.error("💥 Error importando servicio Twilio:", importError)
        return NextResponse.json(
          {
            error: "Failed to import Twilio service",
            details: importError instanceof Error ? importError.message : "Unknown import error",
          },
          { status: 500 },
        )
      }
    }

    if (result.success) {
      console.log("✅ Notificación enviada exitosamente")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        message: "Payment rejected notification sent successfully",
      })
    } else {
      console.error("❌ Error enviando notificación:", result.error)
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en payment-rejected notification:", error)
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
