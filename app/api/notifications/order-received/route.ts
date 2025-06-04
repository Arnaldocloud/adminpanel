import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("📋 Procesando notificación de orden recibida...")

    const { playerName, playerPhone, orderId, amount, cartCount } = await request.json()

    if (!playerName || !playerPhone || !orderId || !amount || !cartCount) {
      console.error("❌ Faltan campos requeridos")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📊 Datos recibidos:", { playerName, playerPhone, orderId, amount, cartCount })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("🌍 Entorno:", process.env.NODE_ENV)

    let result

    if (isMockMode) {
      console.log("🔸 [MOCK] Notificación de orden recibida simulada")
      result = { success: true, messageId: "mock-id", mock: true }
    } else {
      try {
        // Usar la versión segura de Twilio
        const { notifyOrderReceivedSafe } = await import("@/lib/twilio-safe")
        result = await notifyOrderReceivedSafe(playerName, playerPhone, orderId, amount, cartCount)
        console.log("📤 Resultado de notificación:", result)
      } catch (importError) {
        console.error("💥 Error importando servicio Twilio:", importError)

        // Fallback a modo mock si hay error de importación
        console.log("🔄 Fallback a modo simulación")
        result = {
          success: true,
          messageId: "fallback-mock-id",
          mock: true,
          fallback: true,
          originalError: importError instanceof Error ? importError.message : "Unknown import error",
        }
      }
    }

    if (result.success) {
      console.log("✅ Notificación procesada exitosamente")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || isMockMode,
        fallback: result.fallback || false,
        message: "WhatsApp notification processed successfully",
      })
    } else {
      console.error("❌ Error procesando notificación:", result.error)
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en order-received notification:", error)
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
