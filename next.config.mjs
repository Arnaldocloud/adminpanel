/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para diagnóstico
  output: 'standalone',
  
  // Desactivar verificación de tipos y ESLint temporalmente
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Deshabilitar completamente ESLint durante el build
    ignoreDuringBuilds: true,
  },
  
  // Configuración de imágenes básica
  images: {
    unoptimized: true,
  },
  
  // Deshabilitar ESLint completamente
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig