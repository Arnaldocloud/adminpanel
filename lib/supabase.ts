import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Verificar si ya existe una instancia en el objeto global
declare global {
  var __supabase: SupabaseClient | undefined;
}

// Verificar si las variables de entorno están disponibles
export const isSupabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Obtener las variables de entorno con valores por defecto seguros
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Crear o reutilizar la instancia de Supabase
let supabase: SupabaseClient;

if (isSupabaseConfigured()) {
  const clientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
  };

  if (process.env.NODE_ENV === 'production') {
    supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
  } else {
    if (!global.__supabase) {
      global.__supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
    }
    supabase = global.__supabase;
  }
} else {
  // Crear un cliente dummy en desarrollo para evitar errores de compilación
  supabase = createClient("https://dummy.supabase.co", "dummy-key");
}

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      error: "Supabase not configured - missing environment variables"
    };
  }

  try {
    const { data, error } = await supabase.from('_tables').select('*').limit(1);
    
    if (error) throw error;
    
    return {
      connected: true,
      data: data || []
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export { supabase };