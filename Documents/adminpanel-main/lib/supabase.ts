// Importaciones
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Verificar si ya existe una instancia en el objeto global
declare global {
  var __supabase: SupabaseClient | undefined;
}

// Verificar si las variables de entorno están disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Crear o reutilizar la instancia de Supabase
let supabase: SupabaseClient;

if (process.env.NODE_ENV === 'production') {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
  });
} else {
  if (!global.__supabase) {
    global.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
    });
  }
  supabase = global.__supabase;
}

export { supabase };

// Resto del código existente...