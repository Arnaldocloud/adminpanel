// lib/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient as createServerSupabaseClientHelper } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';
import NextAuth, { DefaultSession, Session } from 'next-auth';

// Re-export the function with the correct type
export const createServerSupabaseClient = (context: { req: NextApiRequest; res: NextApiResponse }) => {
  return createServerSupabaseClientHelper<Database>(context);
};

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    } & DefaultSession['user'];
  }
}

export const authOptions = {
  providers: [
    // Configura aquí tus proveedores de autenticación
    // Ejemplo con Google:
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async session({ session, user }: { session: Session; user: any }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // Otras opciones de configuración de NextAuth
};

export default NextAuth(authOptions);

// Función para obtener la sesión del servidor
export async function getServerSession(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  return {
    user: {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || null,
      email: session.user.email || null, // Aseguramos que sea null si es undefined
      image: session.user.user_metadata?.avatar_url || null,
    },
    expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : new Date().toISOString(),
  } as Session;
}

// Mantener compatibilidad con el código existente
export const authConfig = authOptions;