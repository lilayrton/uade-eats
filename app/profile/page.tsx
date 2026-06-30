"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  User,
  CreditCard,
  Bell,
  Sun,
  HelpCircle,
  Flag,
  LogOut,
  Store,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/AppContext"

interface SettingItem {
  icon: React.ElementType
  label: string
  destructive?: boolean
  onClick?: () => void
}

interface SettingGroup {
  title: string
  items: SettingItem[]
}

const SETTINGS: SettingGroup[] = [
  {
    title: "Preferencias",
    items: [
      { icon: Bell, label: "Notificaciones" },
      { icon: Sun, label: "Tema de la app" },
    ],
  },
  {
    title: "Soporte",
    items: [
      { icon: HelpCircle, label: "Ayuda y preguntas frecuentes" },
      { icon: Flag, label: "Reportar un problema" },
    ],
  },
  {
    title: "Sesión",
    items: [{ icon: LogOut, label: "Cerrar sesión", destructive: true }],
  },
]

const NAV_MAP: Record<string, string> = {
  "Información personal": "/profile/personal-info",
  "Métodos de pago": "/profile/payment-methods",
  "Notificaciones": "/profile/notifications-settings",
  "Tema de la app": "/profile/theme",
  "Ayuda y preguntas frecuentes": "/profile/help",
  "Reportar un problema": "/profile/report",
}

export default function ProfilePage() {
  const router = useRouter()
  const { state, dispatch, cartCount } = useApp()
  const [activeNav] = useState("profile")

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error(e)
    }
    dispatch({ type: "LOGOUT" })
    router.push("/login")
  }

  // TODO: replace with API call (fetch user profile)
  const user = state.user
  const initials = user
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
    : "?"

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface)" }}>
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
            Mi perfil
          </h1>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-5">

          {/* User info card */}
          <div className="rounded-2xl bg-card border border-border/60 p-4 flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
              style={{ backgroundColor: "#F97316" }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-black text-base text-foreground leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>

            <button
              onClick={() => router.push("/profile/personal-info")}
              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
              aria-label="Editar perfil"
            >
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* Diner Owner Panel Quick Action */}
          {user?.role === "store_owner" && (
            <div className="rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] p-4 flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#F97316] uppercase tracking-wider">
                    Portal del Comedor
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Administrá los pedidos, cambiá los estados y gestioná las ventas de tu local en tiempo real.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F97316]/10 text-[#F97316] shrink-0">
                  <Store size={20} />
                </div>
              </div>
              <button
                onClick={() => router.push("/store-portal")}
                className="w-full py-2.5 rounded-xl font-bold text-white text-xs text-center hover:opacity-90 active:scale-[0.98] transition-transform duration-150 shadow-sm"
                style={{ backgroundColor: "#F97316" }}
              >
                Abrir panel administrativo
              </button>
            </div>
          )}

          {/* Settings groups */}
          {SETTINGS.map((group) => {
            const items = group.items.map((item) => {
              if (item.destructive) return { ...item, onClick: handleLogout }
              if (NAV_MAP[item.label]) return { ...item, onClick: () => router.push(NAV_MAP[item.label]) }
              return item
            })
            return { ...group, items }
          }).map((group) => (
            <section key={group.title}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                {group.title}
              </p>
              <div className="rounded-2xl bg-card border border-border/60 overflow-hidden divide-y divide-border/40">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors active:scale-[0.99] text-left",
                      item.destructive && "hover:bg-red-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        item.destructive ? "bg-red-50" : "bg-muted"
                      )}
                    >
                      <item.icon
                        size={16}
                        className={cn(item.destructive ? "text-red-500" : "text-foreground")}
                      />
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium",
                        item.destructive ? "text-red-500" : "text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    {!item.destructive && (
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}

          {/* Version footer */}
          <p className="text-center text-[11px] text-muted-foreground pb-2">
            UADE EATS · v0.1 · UADevs Grupo 5
          </p>
        </main>

        {/* ── Bottom Navigation ── */}
        <BottomNav
          active={activeNav}
          cartCount={cartCount}
          onChange={(id) => {
            if (id === "home") router.push("/")
            if (id === "cart") router.push("/cart")
            if (id === "orders") router.push("/orders")
            if (id === "wallet") router.push("/wallet")
          }}
        />
      </div>
    </div>
  )
}
