# Guía para solucionar problemas de visualización de imágenes

Esta guía te ayudará a diagnosticar y solucionar problemas relacionados con la visualización de imágenes de cartones en la aplicación de bingo.

## 1. Verificar configuración del bucket de almacenamiento

### 1.1. Configurar permisos del bucket

1. Abre la consola de Supabase y ve a la sección "SQL Editor".
2. Copia y pega el contenido del archivo `scripts/08-configure-storage-bucket.sql`.
3. Ejecuta el script para configurar los permisos del bucket `bingo-cards`.

### 1.2. Verificar configuración del bucket

1. En la consola de Supabase, ve a "Storage" > "Buckets".
2. Verifica que exista un bucket llamado `bingo-cards`.
3. Asegúrate de que la opción "Public" esté habilitada.
4. Verifica que las políticas de acceso estén configuradas correctamente.

## 2. Verificar imágenes en el bucket

1. En la consola de Supabase, ve a "Storage" > "bingo-cards".
2. Verifica que existan imágenes de cartones en el bucket.
3. Haz clic en una imagen para ver su URL pública.
4. Abre la URL en una pestaña nueva del navegador para verificar que la imagen sea accesible.

## 3. Verificar configuración desde el navegador

1. Abre la aplicación en el navegador y ve a la página de cartones de bingo.
2. Abre las herramientas de desarrollo del navegador (F12).
3. Ve a la pestaña "Console".
4. Copia y pega el contenido del archivo `scripts/check-storage-config.js` en la consola y presiona Enter.
5. Revisa los mensajes en la consola para identificar cualquier problema con la configuración del almacenamiento o la accesibilidad de las imágenes.

## 4. Solución de problemas comunes

### 4.1. Las imágenes no se muestran

- Verifica que las URLs de las imágenes en la base de datos sean correctas.
- Asegúrate de que las imágenes estén en el bucket `bingo-cards`.
- Verifica que las políticas de acceso permitan la lectura pública de las imágenes.

### 4.2. Error 403 Forbidden al acceder a las imágenes

- Verifica que el bucket tenga permisos de lectura pública.
- Asegúrate de que las políticas de acceso estén configuradas correctamente.
- Verifica que la URL de Supabase en la configuración de la aplicación sea correcta.

### 4.3. Las imágenes se cargan lentamente

- Considera habilitar el almacenamiento en caché para las imágenes.
- Verifica el tamaño de las imágenes y optimízalas si es necesario.

## 5. Recursos útiles

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Guía de políticas de seguridad de Supabase](https://supabase.com/docs/guides/auth#policies)
- [Solución de problemas de CORS en Supabase](https://supabase.com/docs/guides/storage/solving-cors-issues)
