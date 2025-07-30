# Panel Administrativo de Bingo

## Configuración del Proyecto

### Variables de Entorno Requeridas

Para que este proyecto funcione correctamente, necesitas configurar las siguientes variables de entorno en tu proyecto de Vercel:

#### Supabase (Requerido)
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
\`\`\`

#### Twilio (Opcional - para notificaciones WhatsApp)
\`\`\`
TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
\`\`\`

### Cómo configurar las variables de entorno en Vercel

1. Ve al dashboard de tu proyecto en Vercel
2. Haz clic en "Settings" en la navegación superior
3. Selecciona "Environment Variables" en el menú lateral
4. Agrega cada variable y su valor
5. Haz clic en "Save" para guardar los cambios
6. Redeploy tu aplicación para aplicar las nuevas variables

### Obtener credenciales de Supabase

1. Inicia sesión en [Supabase](https://supabase.com)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a "Settings" > "API"
4. Copia la "URL" y la "anon public" key
5. Usa estos valores para las variables de entorno

## Configuración de la Base de Datos

Después de configurar las variables de entorno, necesitas ejecutar los scripts SQL para crear las tablas necesarias:

1. Ve a tu proyecto de Supabase
2. Navega a "SQL Editor"
3. Ejecuta los scripts en la carpeta `scripts/` en este orden:
   - `01-create-tables.sql`
   - `02-enable-rls.sql`
   - `03-insert-sample-data.sql` (opcional)

## Desarrollo Local

Para ejecutar el proyecto localmente:

1. Clona este repositorio
2. Crea un archivo `.env.local` con las variables de entorno mencionadas arriba
3. Instala las dependencias: `npm install` o `yarn install`
4. Inicia el servidor de desarrollo: `npm run dev` o `yarn dev`
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Solución de Problemas

Si ves el error "No database URL found", asegúrate de haber configurado correctamente las variables de entorno de Supabase en tu proyecto de Vercel.
