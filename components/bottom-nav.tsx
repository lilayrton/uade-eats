"use client"

import { Home, ClipboardList, ShoppingCart, User as UserIcon, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "cart", label: "Carrito", icon: ShoppingCart },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "profile", label: "Perfil", icon: UserIcon },
]

interface BottomNavProps {
  active: string
  onChange: (id: string) => void
  cartCount?: number
  cartBump?: boolean
}

export function BottomNav({ active, onChange, cartCount = 0, cartBump = false }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/60 flex items-stretch justify-around max-w-[480px] mx-auto safe-area-bottom">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 relative transition-colors duration-150",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            style={isActive ? { color: "#F97316" } : {}}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              {id === "cart" && cartCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center transition-transform duration-150",
                    cartBump ? "scale-125" : "scale-100"
                  )}
                  style={{ backgroundColor: "#F97316" }}
                >
                  {cartCount}
                </span>
              )}
            </div>
            <span className={cn("text-[9px] font-medium leading-none", isActive && "font-bold")}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
