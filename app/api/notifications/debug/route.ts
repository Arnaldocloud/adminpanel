import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Iniciando diagnóstico de configuración...")

    // Verificar variables de entorno
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
        accountSidLength: accountSid ? accountSid.length : 0,
        accountSidPrefix: accountSid ? accountSid.substring(0, 6) + "..." : "not set",
        authTokenConfigured: !!authToken,
        authTokenLength: authToken ? authToken.length : 0,
        whatsappNumber: whatsappNumber || "not set",
        isMockMode: !accountSid || !authToken,
      },
      headers: {
        userAgent: request.headers.get("user-agent"),
        host: request.headers.get("host"),
        origin: request.headers.get("origin"),
      },
    }

    console.log("📊 Diagnóstico completo:", diagnostics)

    // Intentar inicializar Twilio si las credenciales están disponibles
    let twilioTest = null
    if (accountSid && authToken) {
      try {
        console.log("🔧 Intentando importar Twilio...")

        // Importación más segura de Twilio
        let twilioModule
        try {
          twilioModule = await import("twilio")
          console.log("✅ Módulo Twilio importado exitosamente")
        } catch (importError: any) {
          console.error("❌ Error importando módulo Twilio:", importError)
          twilioTest = {
            success: false,
            error: `Import error: ${importError.message}`,
            code: "IMPORT_ERROR",
            step: "module_import",
          }
          return NextResponse.json({
            ...diagnostics,
            twilioTest,
            message: "Diagnostic complete with import error",
          })
        }

        // Verificar que el módulo se importó correctamente
        if (!twilioModule || !twilioModule.default) {
          twilioTest = {
            success: false,
            error: "Twilio module not properly imported",
            code: "MODULE_INVALID",
            step: "module_validation",
          }
          return NextResponse.json({
            ...diagnostics,
            twilioTest,
            message: "Diagnostic complete with module validation error",
          })
        }

        console.log("🔧 Inicializando cliente Twilio...")

        // Inicializar cliente de forma más segura
        let client
        try {
          const Twilio = twilioModule.default
          client = new Twilio(accountSid, authToken)
          console.log("✅ Cliente Twilio inicializado")
        } catch (clientError: any) {
          console.error("❌ Error inicializando cliente:", clientError)
          twilioTest = {
            success: false,
            error: `Client initialization error: ${clientError.message}`,
            code: clientError.code || "CLIENT_INIT_ERROR",
            step: "client_initialization",
          }
          return NextResponse.json({
            ...diagnostics,
            twilioTest,
            message: "Diagnostic complete with client initialization error",
          })
        }

        console.log("🔍 Probando conexión con API de Twilio...")

        // Probar conexión con timeout
        const testPromise = client.api.accounts(accountSid).fetch()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 10000),
        )

        const account = await Promise.race([testPromise, timeoutPromise])

        twilioTest = {
          success: true,
          accountStatus: account.status,
          accountType: account.type,
          dateCreated: account.dateCreated,
          step: "connection_test",
        }

        console.log("✅ Twilio connection test successful:", twilioTest)
      } catch (twilioError: any) {
        console.error("❌ Error en prueba de Twilio:", twilioError)

        twilioTest = {
          success: false,
          error: twilioError.message || "Unknown Twilio error",
          code: twilioError.code || "UNKNOWN_ERROR",
          status: twilioError.status,
          moreInfo: twilioError.moreInfo,
          step: "connection_test",
        }

        // Agregar información adicional para debugging
        if (twilioError.stack) {
          twilioTest.stack = twilioError.stack.split("\n").slice(0, 5).join("\n")
        }
      }
    } else {
      twilioTest = {
        success: false,
        error: "Missing Twilio credentials",
        code: "MISSING_CREDENTIALS",
        step: "credential_check",
        details: {
          accountSid: !!accountSid,
          authToken: !!authToken,
        },
      }
    }

    return NextResponse.json({
      ...diagnostics,
      twilioTest,
      message: "Diagnostic complete",
    })
  } catch (error: any) {
    console.error("💥 Error crítico en diagnóstico:", error)
    console.error("Stack trace:", error.stack)

    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        environment: process.env.NODE_ENV,
        step: "diagnostic_execution",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Iniciando prueba completa de notificación...")

    const { phone, testType = "basic" } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // Verificar configuración
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

    // Paso 1: Verificar variables de entorno
    testResult.steps.push({
      step: 1,
      name: "Environment Variables Check",
      accountSid: !!accountSid,
      authToken: !!authToken,
      whatsappNumber: !!whatsappNumber,
      success: !!accountSid && !!authToken,
    })

    if (!accountSid || !authToken) {
      testResult.steps.push({
        step: 2,
        name: "Mock Mode Fallback",
        message: "Using mock mode due to missing credentials",
        success: true,
        mock: true,
      })

      return NextResponse.json({
        ...testResult,
        success: true,
        mock: true,
        message: "Test completed in mock mode",
      })
    }

    // Paso 2: Importar y inicializar cliente Twilio
    let client
    try {
      console.log("📦 Importando módulo Twilio...")
      const twilioModule = await import("twilio")

      if (!twilioModule || !twilioModule.default) {
        throw new Error("Twilio module not properly imported")
      }

      console.log("🔧 Inicializando cliente...")
      const Twilio = twilioModule.default
      client = new Twilio(accountSid, authToken)

      testResult.steps.push({
        step: 2,
        name: "Twilio Client Initialization",
        success: true,
      })
    } catch (error: any) {
      console.error("❌ Error en inicialización:", error)
      testResult.steps.push({
        step: 2,
        name: "Twilio Client Initialization",
        success: false,
        error: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: "Failed to initialize Twilio client",
      })
    }

    // Paso 3: Formatear número
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
      original: phone,
      formatted: formattedNumber,
      success: true,
    })

    // Paso 4: Probar conexión con API
    try {
      console.log("🔍 Probando conexión con API...")
      const account = await client.api.accounts(accountSid).fetch()

      testResult.steps.push({
        step: 4,
        name: "API Connection Test",
        success: true,
        accountStatus: account.status,
        accountType: account.type,
      })
    } catch (apiError: any) {
      console.error("❌ Error en conexión API:", apiError)
      testResult.steps.push({
        step: 4,
        name: "API Connection Test",
        success: false,
        error: apiError.message,
        code: apiError.code,
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: "API connection failed",
      })
    }

    // Paso 5: Enviar mensaje de prueba
    try {
      const message = `🧪 PRUEBA DE PRODUCCIÓN - ${new Date().toLocaleString()}

🎯 Este es un mensaje de prueba desde el entorno de PRODUCCIÓN.

📊 Detalles:
• Entorno: ${process.env.NODE_ENV}
• Región: ${process.env.VERCEL_REGION || "unknown"}
• Timestamp: ${new Date().toISOString()}

Si recibes este mensaje, ¡las notificaciones están funcionando correctamente! 🎉`

      console.log("📤 Enviando mensaje de prueba...")
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
        status: result.status,
        to: `whatsapp:${formattedNumber}`,
        from: whatsappNumber,
      })

      console.log("✅ Mensaje de prueba enviado exitosamente:", result.sid)

      return NextResponse.json({
        ...testResult,
        success: true,
        messageId: result.sid,
        message: "Test message sent successfully",
      })
    } catch (twilioError: any) {
      console.error("❌ Error enviando mensaje:", twilioError)
      testResult.steps.push({
        step: 5,
        name: "WhatsApp Message Send",
        success: false,
        error: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
        moreInfo: twilioError.moreInfo,
      })

      return NextResponse.json({
        ...testResult,
        success: false,
        error: twilioError.message,
        code: twilioError.code,
      })
    }
  } catch (error: any) {
    console.error("💥 Error en prueba completa:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
