import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    const diagnostics = {
      environment: process.env.NODE_ENV || "unknown",
      timestamp: new Date().toISOString(),
      vercel: {
        region: process.env.VERCEL_REGION || "unknown",
        url: process.env.VERCEL_URL || "unknown",
      },
      twilio: {
        accountSidConfigured: !!accountSid,
        authTokenConfigured: !!authToken,
        whatsappNumber: whatsappNumber || "not set",
        isMockMode: !accountSid || !authToken,
      },
    }

    let twilioTest = null
    if (accountSid && authToken) {
      try {
        const twilioModule = await import("twilio")
        const Twilio = twilioModule.default
        const client = new Twilio(accountSid, authToken)

        const account = await client.api.accounts(accountSid).fetch()

        twilioTest = {
          success: true,
          accountStatus: account.status,
          accountType: account.type,
        }
      } catch (twilioError: any) {
        twilioTest = {
          success: false,
          error: twilioError.message || "Unknown Twilio error",
          code: twilioError.code || "UNKNOWN_ERROR",
        }
      }
    } else {
      twilioTest = {
        success: false,
        error: "Missing Twilio credentials",
        code: "MISSING_CREDENTIALS",
      }
    }

    return NextResponse.json({
      ...diagnostics,
      twilioTest,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, testType = "basic" } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    const testResult = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      phone: phone,
      testType: testType,
      steps: [] as any[],
    }

    testResult.steps.push({
      step: 1,
      name: "Environment Variables Check",
      success: !!accountSid && !!authToken,
    })

    if (!accountSid || !authToken) {
      testResult.steps.push({
        step: 2,
        name: "Mock Mode Fallback",
        success: true,
        mock: true,
      })

      return NextResponse.json({
        ...testResult,
        success: true,
        mock: true,
      })
    }

    let client
    try {
      const twilioModule = await import("twilio")
      const Twilio = twilioModule.default
      client = new Twilio(accountSid, authToken)

      testResult.steps.push({
        step: 2,
        name: "Twilio Client Initialization",
        success: true,
      })
    } catch (error: any) {
      testResult.steps.push({
        step: 2,
        name: "Twilio Client Initialization",
        success: false,
        error: error.message,
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: "Failed to initialize Twilio client",
      })
    }

    const formatPhoneNumber = (phone: string): string => {
      let cleaned = phone.replace(/[\s\-()]/g, "")
      if (cleaned.startsWith("0")) {
        cleaned = "+58" + cleaned.substring(1)
      }
      if (!cleaned.startsWith("+")) {
        cleaned = "+58" + cleaned
      }
      return cleaned
    }

    const formattedNumber = formatPhoneNumber(phone)
    testResult.steps.push({
      step: 3,
      name: "Phone Number Formatting",
      success: true,
    })

    try {
      const account = await client.api.accounts(accountSid).fetch()

      testResult.steps.push({
        step: 4,
        name: "API Connection Test",
        success: true,
        accountStatus: account.status,
      })
    } catch (apiError: any) {
      testResult.steps.push({
        step: 4,
        name: "API Connection Test",
        success: false,
        error: apiError.message,
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: "API connection failed",
      })
    }

    try {
      const message = `🧪 PRUEBA DE PRODUCCIÓN - ${new Date().toLocaleString()}

🎯 Este es un mensaje de prueba desde el entorno de PRODUCCIÓN.

Si recibes este mensaje, ¡las notificaciones están funcionando correctamente! 🎉`

      const result = await client.messages.create({
        from: whatsappNumber,
        to: `whatsapp:${formattedNumber}`,
        body: message,
      })

      testResult.steps.push({
        step: 5,
        name: "WhatsApp Message Send",
        success: true,
        messageId: result.sid,
      })

      return NextResponse.json({
        ...testResult,
        success: true,
        messageId: result.sid,
      })
    } catch (twilioError: any) {
      testResult.steps.push({
        step: 5,
        name: "WhatsApp Message Send",
        success: false,
        error: twilioError.message,
        code: twilioError.code,
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: twilioError.message,
        code: twilioError.code,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
