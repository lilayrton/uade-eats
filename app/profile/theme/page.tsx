"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sun, Moon, Monitor } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark" | "system"

const OPTIONS: { id: Theme; label: string; description: string; Icon: React.ElementType }[] = [
  { id: "light", label: "Claro", description: "Fondo blanco, ideal para el día", Icon: Sun },
  { id: "dark", label: "Oscuro", description: "Fondo oscuro, ideal para la noche", Icon: Moon },
  { id: "system", label: "Sistema", description: "Sigue la configuración de tu dispositivo", Icon: Monitor },
]

export default function ThemePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Theme>("system")

  const handleSelect = (id: Theme) => {
    setSelected(id)
    toast.info("Tema actualizado. Disponible en la próxima versión.")
  }

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
        <h1 className="text-lg font-bold text-foreground">Tema de la app</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {OPTIONS.map(({ id, label, description, Icon }) => {
          const isSelected = selected === id
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-4 flex items-center gap-4 text-left transition-colors",
                isSelected ? "border-[#F97316] bg-orange-50/50" : "border-border bg-card"
              )}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-muted")}>
                <Icon size={20} className={isSelected ? "text-[#F97316]" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", isSelected ? "text-foreground" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#F97316" }}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
