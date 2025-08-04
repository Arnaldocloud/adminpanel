<<<<<<< HEAD
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Panel Administrativo de Bingo",
  description: "Sistema completo de gestión de bingo con compra de cartones y verificación de pagos",
  generator: 'v0.dev'
=======
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
>>>>>>> d2d74a7243ae1683ee43b70f57dfe8bcf1e3d73e
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
<<<<<<< HEAD
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
=======
      <body className={inter.className}>{children}</body>
>>>>>>> d2d74a7243ae1683ee43b70f57dfe8bcf1e3d73e
    </html>
  )
}
