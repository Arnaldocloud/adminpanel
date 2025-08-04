"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingCart, Settings } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <Card className="fixed top-4 right-4 z-50 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <div className="flex gap-2 p-3">
       
      </div>
    </Card>
  )
}
