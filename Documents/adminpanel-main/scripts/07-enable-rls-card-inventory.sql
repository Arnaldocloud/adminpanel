-- Habilitar Row Level Security (RLS) en la tabla card_inventory
ALTER TABLE card_inventory ENABLE ROW LEVEL SECURITY;

-- Política para permitir la lectura de cartones (todos pueden ver los cartones)
CREATE POLICY "Permitir lectura de cartones" 
ON card_inventory 
FOR SELECT 
USING (true);

-- Política para permitir la actualización de cartones (solo para operaciones del backend)
-- NOTA: En producción, esto debería ser más restrictivo
CREATE POLICY "Permitir actualización de cartones" 
ON card_inventory
FOR UPDATE 
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Política para permitir la inserción de cartones (solo admin)
-- NOTA: Ajustar según sea necesario para tu caso de uso
CREATE POLICY "Permitir inserción de cartones" 
ON card_inventory
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Política para permitir la eliminación de cartones (solo admin)
-- NOTA: Ajustar según sea necesario para tu caso de uso
CREATE POLICY "Permitir eliminación de cartones" 
ON card_inventory
FOR DELETE 
TO service_role
USING (true);

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'card_inventory';
