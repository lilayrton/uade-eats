"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const TOGGLES = [
  {
    id: "ready",
    label: "Pedido listo para retirar",
    description: "Te avisamos cuando tu pedido esté listo",
  },
  {
    id: "promos",
    label: "Ofertas y promociones",
    description: "Descuentos y novedades de los locales",
  },
  {
    id: "reminders",
    label: "Recordatorios",
    description: "Te recordamos pedidos pendientes o carritos abandonados",
  },
  {
    id: "news",
    label: "Novedades de UADE EATS",
    description: "Actualizaciones y nuevas funciones",
  },
]

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.id, true]))
  )

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-svh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0"
          aria-label="Volver"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notificaciones</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/40">
          {TOGGLES.map((toggle) => (
            <div key={toggle.id} className="flex items-center justify-between px-4 py-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-semibold text-foreground">{toggle.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
              </div>
              <Switch
                checked={enabled[toggle.id]}
                onCheckedChange={(val) =>
                  setEnabled((prev) => ({ ...prev, [toggle.id]: val }))
                }
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-muted/50 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Las notificaciones push requieren permiso del sistema operativo. Podés gestionarlas desde la configuración de tu dispositivo.
          </p>
        </div>
      </div>
    </div>
  )
}
