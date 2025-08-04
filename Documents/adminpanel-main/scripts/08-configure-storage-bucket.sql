-- Script para configurar el bucket de almacenamiento de imágenes de cartones
-- Este script debe ejecutarse en la consola SQL de Supabase

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('bingo-cards', 'bingo-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Configurar políticas de acceso al bucket
-- Política para permitir la lectura pública de archivos
CREATE POLICY "Permitir lectura pública de imágenes"
ON storage.objects FOR SELECT
USING (bucket_id = 'bingo-cards');

-- 3. Configurar CORS para permitir solicitudes desde el dominio de la aplicación
-- NOTA: Reemplaza 'https://tudominio.com' con tu dominio real en producción
-- Esto debe ejecutarse como una consulta SQL en la consola de Supabase
-- o a través de la API de Supabase

-- Ejemplo de cómo se vería la configuración CORS (debe ejecutarse en la consola SQL de Supabase):
/*
update storage.buckets
set allowed_origins = '{"https://tudominio.com"}'
where id = 'bingo-cards';
*/

-- 4. Verificar la configuración del bucket
SELECT * FROM storage.buckets WHERE id = 'bingo-cards';

-- 5. Verificar las políticas de acceso
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Notas adicionales:
-- 1. Asegúrate de que las imágenes se suban con el tipo de contenido correcto (image/jpeg, image/png, etc.)
-- 2. En producción, considera restringir los orígenes permitidos en la configuración CORS
-- 3. Verifica que las URLs de las imágenes en la base de datos sean accesibles directamente en el navegador
