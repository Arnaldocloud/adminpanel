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

-- Trigger para actualizar updated_at
CREATE TRIGGER update_card_inventory_updated_at 
  BEFORE UPDATE ON card_inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
