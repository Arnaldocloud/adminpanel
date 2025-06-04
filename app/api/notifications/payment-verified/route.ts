import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("✅ Procesando notificación de pago verificado...")

    const { playerName, playerPhone, orderId, cartCount } = await request.json()

    if (!playerName || !playerPhone || !orderId || !cartCount) {
      console.error("❌ Faltan campos requeridos")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📊 Datos recibidos:", { playerName, playerPhone, orderId, cartCount })

    let result

    try {
      const { notifyPaymentVerified } = await import("@/lib/twilio")
      result = await notifyPaymentVerified(playerName, playerPhone, orderId, cartCount)
      console.log("📤 Resultado de notificación:", result)
    } catch (importError: any) {
      console.error("💥 Error usando servicio Twilio:", importError)

      // Fallback a simulación
      result = {
        success: true,
        messageId: "mock-id",
        mock: true,
        fallback: true,
        error: importError.message,
      }
    }

    if (result.success) {
      console.log("✅ Notificación procesada exitosamente")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || false,
        fallback: result.fallback || false,
        message: "Payment verified notification processed successfully",
      })
    } else {
      console.error("❌ Error procesando notificación:", result.error)
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en payment-verified notification:", error)
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
