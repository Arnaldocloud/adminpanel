# 🚀 Configuración de Supabase - Paso a Paso

## ✅ Paso 1: Credenciales Configuradas

Ya tienes las credenciales configuradas en tu archivo `.env`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://fbrjuzizepyxmtqroejn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## 📋 Paso 2: Ejecutar Scripts SQL

Ahora necesitas ejecutar los scripts SQL en tu base de datos de Supabase:

### 2.1 Acceder al Editor SQL
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto: `fbrjuzizepyxmtqroejn`
4. Ve a la sección **SQL Editor** en el menú lateral

### 2.2 Ejecutar Scripts en Orden

**Script 1: Crear Tablas**
\`\`\`sql
-- Copia y pega el contenido de scripts/01-create-tables.sql
-- Luego haz clic en "Run"
\`\`\`

**Script 2: Habilitar RLS**
\`\`\`sql
-- Copia y pega el contenido de scripts/02-enable-rls.sql
-- Luego haz clic en "Run"
\`\`\`

**Script 3: Datos de Ejemplo**
\`\`\`sql
-- Copia y pega el contenido de scripts/03-insert-sample-data.sql
-- Luego haz clic en "Run"
\`\`\`

## 🔧 Paso 3: Configurar Storage (Para Imágenes de Cartones)

### 3.1 Crear Bucket
1. Ve a **Storage** en el menú lateral
2. Haz clic en **New bucket**
3. Nombre: `bingo-cards`
4. Marca como **Public bucket**
5. Haz clic en **Create bucket**

### 3.2 Configurar Políticas de Storage
En el SQL Editor, ejecuta:

\`\`\`sql
-- Política para permitir subir imágenes
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo-cards');

-- Política para permitir ver imágenes
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo-cards');

-- Política para permitir eliminar imágenes
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'bingo-cards');
\`\`\`

## ✅ Paso 4: Verificar Configuración

Una vez completados los pasos anteriores:

1. **Reinicia tu aplicación** (si está corriendo localmente)
2. **Ve al panel administrativo**
3. **Verifica el estado de Supabase** - debería mostrar "✅ Conectado"
4. **Prueba las funciones** del panel

## 🎯 Funciones Disponibles Después de la Configuración

- ✅ **Gestión de Juegos** - Crear, iniciar, terminar juegos
- ✅ **Control de Jugadores** - Ver jugadores registrados
- ✅ **Cartones de Bingo** - Gestionar cartones
- ✅ **Números Cantados** - Registrar números del juego
- ✅ **Ganadores** - Registrar y ver ganadores
- ✅ **Órdenes de Compra** - Gestionar pagos y verificaciones

## 🚨 Solución de Problemas

### Error: "relation does not exist"
- **Causa**: Las tablas no se crearon correctamente
- **Solución**: Ejecuta nuevamente el script `01-create-tables.sql`

### Error: "RLS policy violation"
- **Causa**: Las políticas RLS no están configuradas
- **Solución**: Ejecuta nuevamente el script `02-enable-rls.sql`

### Error: "Storage bucket not found"
- **Causa**: El bucket para imágenes no existe
- **Solución**: Crea el bucket `bingo-cards` en Storage

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que todos los scripts se ejecutaron sin errores
2. Revisa que las variables de entorno estén correctas
3. Reinicia la aplicación después de los cambios
