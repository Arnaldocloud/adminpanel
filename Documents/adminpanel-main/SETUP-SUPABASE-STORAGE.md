# Configuración de Supabase Storage para Cartones de Bingo

## 🗂️ Crear Bucket de Storage

### 1. Acceder a Supabase Storage
1. Ve a tu proyecto de Supabase
2. Navega a "Storage" en el menú lateral
3. Haz clic en "Create bucket"

### 2. Configurar el Bucket
\`\`\`
Nombre del bucket: bingo-cards
Público: ✅ Sí (para que las imágenes sean accesibles)
Tamaño máximo de archivo: 1MB (suficiente para 75KB por imagen)
Tipos de archivo permitidos: image/jpeg, image/jpg
\`\`\`

### 3. Configurar Políticas RLS

Ejecuta estos comandos SQL en el SQL Editor:

\`\`\`sql
-- Permitir lectura pública de las imágenes
CREATE POLICY "Public read access for bingo cards" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo-cards');

-- Permitir subida solo para usuarios autenticados (opcional)
CREATE POLICY "Authenticated users can upload bingo cards" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo-cards' AND auth.role() = 'authenticated');

-- Permitir eliminación solo para usuarios autenticados (opcional)
CREATE POLICY "Authenticated users can delete bingo cards" ON storage.objects
FOR DELETE USING (bucket_id = 'bingo-cards' AND auth.role() = 'authenticated');
\`\`\`

## 📁 Estructura de Archivos

Las imágenes se organizarán así:
\`\`\`
bingo-cards/
├── carton-0001.jpg
├── carton-0002.jpg
├── carton-0003.jpg
├── ...
└── carton-2000.jpg
\`\`\`

## 🔧 Configuración del Proyecto

### Variables de Entorno
Asegúrate de tener configuradas:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
\`\`\`

### Ejecutar Scripts SQL
Ejecuta los scripts en orden:

1. `scripts/01-create-tables.sql` - Tablas básicas
2. `scripts/02-enable-rls.sql` - Políticas de seguridad
3. `scripts/03-insert-sample-data.sql` - Datos de ejemplo
4. `scripts/04-add-card-images.sql` - Tablas para inventario de cartones

## 📤 Subir Imágenes de Cartones

### Opción 1: Interfaz de Admin
1. Ve al panel de administración
2. Selecciona la pestaña "Gestión de Cartones"
3. Usa el componente `CardUploadAdmin` para subir múltiples imágenes

### Opción 2: Subida Manual
\`\`\`javascript
// Ejemplo de código para subir una imagen
const uploadCardImage = async (file, cardNumber) => {
  const filename = `carton-${cardNumber.toString().padStart(4, '0')}.jpg`
  
  const { data, error } = await supabase.storage
    .from('bingo-cards')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: true
    })
    
  if (error) throw error
  return data
}
\`\`\`

## 🎯 Flujo de Usuario

### 1. Selección de Cartones
- Usuario completa información personal
- Accede a la galería de cartones disponibles
- Selecciona hasta 10 cartones
- Los cartones se reservan temporalmente (5 minutos)

### 2. Proceso de Compra
- Usuario revisa cartones en el carrito
- Completa información de pago
- Confirma la compra
- Sistema confirma la compra y marca cartones como vendidos

### 3. Gestión de Inventario
- Cartones disponibles se muestran en tiempo real
- Reservas expiradas se liberan automáticamente
- Admin puede ver estadísticas de inventario

## 🔍 Características del Sistema

### ✅ Funcionalidades Implementadas
- **Galería visual**: Los usuarios ven imágenes reales de los cartones
- **Reserva temporal**: Cartones reservados por 5 minutos durante la compra
- **Inventario en tiempo real**: Disponibilidad actualizada automáticamente
- **Búsqueda y filtros**: Buscar cartones por número
- **Vista grid/lista**: Diferentes formas de visualizar los cartones
- **Gestión de admin**: Subir y gestionar inventario de cartones

### 🚀 Beneficios
- **Experiencia visual**: Los usuarios ven exactamente qué cartón están comprando
- **No duplicados**: Sistema garantiza que cada cartón se vende solo una vez
- **Escalable**: Maneja hasta 2000 cartones con imágenes
- **Optimizado**: Carga lazy de imágenes y paginación
- **Responsive**: Funciona en móviles y desktop

## 📊 Monitoreo y Estadísticas

El sistema incluye métricas para:
- Total de cartones disponibles
- Cartones reservados
- Cartones vendidos
- Ingresos generados
- Cartones más populares

## 🛠️ Próximos Pasos

1. **Ejecutar scripts SQL** en Supabase
2. **Crear bucket de storage** "bingo-cards"
3. **Subir las 2000 imágenes** usando el componente admin
4. **Probar el flujo completo** de selección y compra
5. **Configurar políticas de seguridad** según necesidades

¿Te gustaría que ajuste alguna parte del sistema o necesitas ayuda con la configuración de Supabase Storage?
