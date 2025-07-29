# Configuración de Supabase para el Panel de Bingo

## 🚀 Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la clave anónima

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
\`\`\`

### 3. Ejecutar Scripts de Base de Datos

En el panel de Supabase, ve a SQL Editor y ejecuta los siguientes scripts en orden:

1. `scripts/01-create-tables.sql` - Crea las tablas principales
2. `scripts/02-enable-rls.sql` - Configura las políticas de seguridad
3. `scripts/03-insert-sample-data.sql` - Inserta datos de ejemplo (opcional)

## 📊 Estructura de la Base de Datos

### Tablas Principales

- **games** - Juegos de bingo
- **players** - Jugadores registrados
- **bingo_cards** - Cartones de bingo
- **called_numbers** - Números cantados
- **winners** - Ganadores del juego
- **purchase_orders** - Órdenes de compra

### Relaciones

\`\`\`
games (1) -> (N) players
players (1) -> (N) bingo_cards
games (1) -> (N) called_numbers
games (1) -> (N) winners
\`\`\`

## 🔧 Funciones Disponibles

### Servicios de Base de Datos

- `gameService` - Gestión de juegos
- `playerService` - Gestión de jugadores
- `cardService` - Gestión de cartones
- `calledNumberService` - Números cantados
- `winnerService` - Gestión de ganadores
- `orderService` - Órdenes de compra
- `statsService` - Estadísticas del dashboard

### Hooks Personalizados

- `useSupabaseGame` - Hook para gestión completa de juegos
- `useSupabaseOrders` - Hook para gestión de órdenes

## 🛡️ Seguridad

### Row Level Security (RLS)

Las tablas tienen RLS habilitado con políticas que permiten acceso público por ahora. En producción, deberías:

1. Implementar autenticación de usuarios
2. Crear políticas más restrictivas
3. Usar roles específicos para admin/usuario

### Políticas Recomendadas para Producción

\`\`\`sql
-- Ejemplo: Solo admins pueden modificar juegos
CREATE POLICY "Admin only games" ON games 
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Ejemplo: Usuarios solo ven sus propias órdenes
CREATE POLICY "Users see own orders" ON purchase_orders 
FOR SELECT USING (auth.uid()::text = player_cedula);
\`\`\`

## 🧪 Pruebas

### Probar Conexión

Visita `/api/supabase/test` para verificar que la conexión funciona correctamente.

### Componente de Estado

Usa el componente `<SupabaseStatus />` para mostrar el estado de conexión en tu interfaz.

## 📈 Monitoreo

### Dashboard de Supabase

- Monitorea el uso de la base de datos
- Revisa logs de errores
- Configura alertas de rendimiento

### Métricas Importantes

- Número de conexiones activas
- Tiempo de respuesta de consultas
- Uso de almacenamiento
- Transferencia de datos

## 🔄 Migración desde localStorage

Si tienes datos en localStorage, puedes migrarlos:

1. Exporta los datos existentes
2. Transforma el formato si es necesario
3. Usa las funciones de servicio para insertar en Supabase
4. Verifica la integridad de los datos

## 🚨 Solución de Problemas

### Errores Comunes

1. **"Invalid API key"** - Verifica las variables de entorno
2. **"Table doesn't exist"** - Ejecuta los scripts SQL
3. **"RLS policy violation"** - Revisa las políticas de seguridad
4. **"Connection timeout"** - Verifica la conectividad de red

### Logs y Debugging

\`\`\`typescript
// Habilitar logs detallados
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
})
\`\`\`

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Políticas RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Optimización de Consultas](https://supabase.com/docs/guides/database/query-optimization)
