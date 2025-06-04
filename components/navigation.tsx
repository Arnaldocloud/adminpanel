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
        <Link href="/user">
          <Button
            variant={pathname === "/user" ? "default" : "outline"}
            size="sm"
            className={`${
              pathname === "/user"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "border-blue-300 text-blue-600 hover:bg-blue-50"
            } font-medium rounded-lg transition-all duration-200`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Panel Usuario
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant={pathname === "/" ? "default" : "outline"}
            size="sm"
            className={`${
              pathname === "/"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "border-purple-300 text-purple-600 hover:bg-purple-50"
            } font-medium rounded-lg transition-all duration-200`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Panel Admin
          </Button>
        </Link>
      </div>
    </Card>
  )
}
