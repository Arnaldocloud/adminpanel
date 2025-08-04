# 🎯 Guía Completa: Implementar Selección Visual de Cartones

## 📋 Pasos para Implementar

### **PASO 1: Configurar Supabase Storage**

#### 1.1 Crear el Bucket
1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"Create bucket"**
4. Configura:
   - **Nombre**: `bingo-cards`
   - **Público**: ✅ **SÍ** (importante para que las imágenes sean visibles)
   - **Tamaño máximo**: 1MB

#### 1.2 Configurar Políticas de Acceso
Ve a **SQL Editor** en Supabase y ejecuta:

\`\`\`sql
-- Permitir lectura pública de las imágenes
CREATE POLICY "Public read access for bingo cards" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo-cards');

-- Permitir subida para administradores
CREATE POLICY "Admin upload bingo cards" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo-cards');
\`\`\`

### **PASO 2: Ejecutar Scripts de Base de Datos**

En el **SQL Editor** de Supabase, ejecuta estos scripts **EN ORDEN**:

#### 2.1 Script de Inventario de Cartones
\`\`\`sql
-- Agregar columnas para imágenes de cartones
ALTER TABLE bingo_cards ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE bingo_cards ADD COLUMN IF NOT EXISTS image_filename TEXT;
ALTER TABLE bingo_cards ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE bingo_cards ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMP WITH TIME ZONE;

-- Tabla para gestionar el inventario de cartones
CREATE TABLE IF NOT EXISTS card_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number INTEGER UNIQUE NOT NULL, -- Número del cartón (1-2000)
  numbers JSONB NOT NULL, -- Los números del cartón
  image_url TEXT NOT NULL, -- URL de la imagen en Supabase Storage
  image_filename TEXT NOT NULL, -- Nombre del archivo
  is_available BOOLEAN DEFAULT true,
  reserved_by TEXT, -- Cédula del usuario que lo reservó
  reserved_until TIMESTAMP WITH TIME ZONE,
  sold_to TEXT, -- Cédula del usuario que lo compró
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_card_inventory_available ON card_inventory(is_available);
CREATE INDEX IF NOT EXISTS idx_card_inventory_number ON card_inventory(card_number);
CREATE INDEX IF NOT EXISTS idx_card_inventory_reserved_by ON card_inventory(reserved_by);
CREATE INDEX IF NOT EXISTS idx_card_inventory_sold_to ON card_inventory(sold_to);

-- Función para liberar reservas expiradas
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE card_inventory 
  SET 
    is_available = true,
    reserved_by = NULL,
    reserved_until = NULL
  WHERE 
    reserved_until < NOW() 
    AND sold_to IS NULL;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### **PASO 3: Preparar las Imágenes**

#### 3.1 Organizar tus 2000 imágenes
- Renombra tus archivos como: `carton-0001.jpg`, `carton-0002.jpg`, etc.
- Asegúrate de que sean JPG y aproximadamente 75KB cada una
- Ordénalas del 1 al 2000

#### 3.2 Extraer números de cada cartón
Para cada imagen, necesitas extraer los números del cartón. Tienes 3 opciones:

**Opción A: Manual** (si tienes los números en una base de datos)
**Opción B: OCR** (reconocimiento óptico de caracteres)
**Opción C: Entrada manual** (para pocos cartones)

### **PASO 4: Subir Cartones al Sistema**

#### 4.1 Usar el Componente Admin
1. Ve al panel de administración
2. Agrega una nueva pestaña "Gestión de Cartones"
3. Usa el componente `CardUploadAdmin` para subir las imágenes

#### 4.2 Script de Subida Masiva (Alternativa)
\`\`\`javascript
// Ejemplo para subir programáticamente
const uploadAllCards = async () => {
  for (let i = 1; i <= 2000; i++) {
    const cardNumber = i;
    const filename = `carton-${i.toString().padStart(4, '0')}.jpg`;
    
    // Subir imagen
    const { data, error } = await supabase.storage
      .from('bingo-cards')
      .upload(filename, imageFile, { upsert: true });
    
    if (!error) {
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('bingo-cards')
        .getPublicUrl(filename);
      
      // Agregar al inventario
      await supabase.from('card_inventory').insert({
        card_number: cardNumber,
        numbers: [/* números del cartón */],
        image_url: publicUrl,
        image_filename: filename
      });
    }
  }
};
\`\`\`

### **PASO 5: Probar el Sistema**

#### 5.1 Verificar la Galería
1. Ve a `/user` en tu aplicación
2. Completa la información personal
3. Deberías ver la galería de cartones con imágenes

#### 5.2 Probar Selección
1. Haz clic en varios cartones para seleccionarlos
2. Ve al carrito y verifica que aparezcan
3. Prueba el proceso de pago completo

## 🔧 Configuración Adicional

### Variables de Entorno Necesarias
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
\`\`\`

### Optimizaciones Recomendadas
1. **Compresión de imágenes**: Asegúrate de que sean ~75KB
2. **CDN**: Supabase Storage ya incluye CDN
3. **Lazy loading**: Ya implementado en el componente
4. **Paginación**: Ya implementada (20 cartones por página)

## 🚨 Solución de Problemas

### Error: "Bucket not found"
- Verifica que creaste el bucket "bingo-cards"
- Asegúrate de que sea público

### Error: "Policy violation"
- Ejecuta las políticas SQL mencionadas arriba
- Verifica permisos en Supabase Storage

### Imágenes no cargan
- Verifica que las URLs sean públicas
- Comprueba que el bucket sea público
- Revisa la consola del navegador para errores

### Reservas no funcionan
- Verifica que la función `release_expired_reservations` esté creada
- Comprueba que la tabla `card_inventory` exista

## 📊 Métricas del Sistema

Una vez implementado, tendrás:
- ✅ **2000 cartones** con imágenes reales
- ✅ **Selección visual** intuitiva
- ✅ **Sistema de reservas** para evitar conflictos
- ✅ **Inventario en tiempo real**
- ✅ **Búsqueda y filtros**
- ✅ **Panel de administración** completo

## 🎯 Próximos Pasos

1. **Ejecutar scripts SQL** ✅
2. **Crear bucket de storage** ✅
3. **Subir imágenes** ⏳
4. **Probar galería** ⏳
5. **Verificar compras** ⏳

¿En qué paso necesitas ayuda específica?
