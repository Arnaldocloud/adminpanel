// Script para verificar la configuración del bucket de almacenamiento y la accesibilidad de las imágenes
// Este script debe ejecutarse en la consola del navegador en la página de cartones de bingo

// 1. Verificar si Supabase está configurado correctamente
const checkSupabaseConfig = () => {
  if (!window.supabase) {
    console.error('Error: Supabase no está disponible en window.supabase');
    return false;
  }
  
  try {
    // Verificar que el cliente de Supabase Storage esté disponible
    if (!window.supabase.storage) {
      console.error('Error: Supabase Storage no está disponible');
      return false;
    }
    
    console.log('✅ Supabase Storage está correctamente configurado');
    return true;
  } catch (error) {
    console.error('Error al verificar la configuración de Supabase:', error);
    return false;
  }
};

// 2. Verificar si el bucket existe y es accesible
const checkBucketAccess = async (bucketName = 'bingo-cards') => {
  try {
    const { data, error } = await window.supabase.storage.getBucket(bucketName);
    
    if (error) {
      console.error(`Error al acceder al bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`✅ Bucket ${bucketName} encontrado:`, data);
    return true;
  } catch (error) {
    console.error(`Error al verificar el bucket ${bucketName}:`, error);
    return false;
  }
};

// 3. Verificar permisos de un archivo de ejemplo
const checkFileAccess = async (filename, bucketName = 'bingo-cards') => {
  try {
    // Obtener URL pública del archivo
    const { data: { publicUrl } } = window.supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);
    
    console.log(`URL pública del archivo ${filename}:`, publicUrl);
    
    // Intentar cargar la imagen
    const img = new Image();
    img.onload = () => {
      console.log(`✅ La imagen ${filename} se cargó correctamente`);
      console.log('Dimensiones de la imagen:', img.width, 'x', img.height);
    };
    img.onerror = (err) => {
      console.error(`❌ Error al cargar la imagen ${filename}:`, err);
    };
    img.src = publicUrl;
    
    return true;
  } catch (error) {
    console.error(`Error al verificar el acceso al archivo ${filename}:`, error);
    return false;
  }
};

// 4. Verificar las políticas de acceso del bucket
const checkBucketPolicies = async (bucketName = 'bingo-cards') => {
  try {
    const { data: policies, error } = await window.supabase.rpc('get_bucket_policies', {
      bucket_name: bucketName
    });
    
    if (error) {
      console.error('Error al obtener las políticas del bucket:', error);
      return false;
    }
    
    console.log(`Políticas del bucket ${bucketName}:`, policies);
    return true;
  } catch (error) {
    console.error('Error al verificar las políticas del bucket:', error);
    return false;
  }
};

// 5. Función principal para ejecutar todas las verificaciones
const runStorageChecks = async () => {
  console.log('🔍 Iniciando verificación de configuración de almacenamiento...');
  
  // 1. Verificar configuración de Supabase
  if (!checkSupabaseConfig()) {
    console.error('❌ La configuración de Supabase no es correcta');
    return;
  }
  
  // 2. Verificar acceso al bucket
  const bucketName = 'bingo-cards';
  if (!(await checkBucketAccess(bucketName))) {
    console.error(`❌ No se pudo acceder al bucket ${bucketName}`);
    return;
  }
  
  // 3. Verificar políticas del bucket (opcional, requiere RPC configurado)
  try {
    await checkBucketPolicies(bucketName);
  } catch (error) {
    console.warn('No se pudieron verificar las políticas del bucket:', error);
  }
  
  // 4. Verificar acceso a un archivo de ejemplo
  // Reemplaza 'carton-0001.jpg' con un nombre de archivo real en tu bucket
  const testFilename = 'carton-0001.jpg';
  await checkFileAccess(testFilename, bucketName);
  
  console.log('✅ Verificación de almacenamiento completada');
};

// Ejecutar verificaciones cuando se cargue la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runStorageChecks);
} else {
  runStorageChecks();
}

// Exportar funciones para uso en la consola
window.storageUtils = {
  checkSupabaseConfig,
  checkBucketAccess,
  checkFileAccess,
  checkBucketPolicies,
  runStorageChecks
};
