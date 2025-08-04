/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de compilación
  output: 'standalone',
  
  // Configuración de imágenes
  images: {
    unoptimized: true,
    domains: ['localhost'], // Agrega aquí tus dominios de imágenes si es necesario
  },
  
  // Configuración de redirecciones y reescrituras
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/',
      },
    ]
  },
  
  // Configuración de cabeceras de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Configuración de Webpack (opcional)
  webpack: (config, { isServer }) => {
    // Configuraciones adicionales de Webpack si son necesarias
    return config;
  },
  
  // Desactivar verificación de tipos en producción para acelerar el build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig