import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'codificatufuturo - Sitio Web Personal',
  description: 'Bienvenido a mi mundo creativo. Explora mis artículos, videos y más.',
  icons: {
    icon: [
      {
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-pic%20(2)-OJK56VB8klQDx0sQZoH5j3TAghhf11.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-pic%20(2)-OJK56VB8klQDx0sQZoH5j3TAghhf11.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: {
      url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-pic%20(2)-OJK56VB8klQDx0sQZoH5j3TAghhf11.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
