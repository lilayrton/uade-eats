"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Banknote, CreditCard, Check, Lock, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const METHODS = [
  {
    id: "mp",
    name: "MercadoPago",
    subtitle: "Cuenta vinculada",
    active: true,
    disabled: false,
  },
  {
    id: "cash",
    name: "Efectivo al retirar",
    subtitle: "Siempre disponible",
    active: true,
    disabled: false,
  },
  {
    id: "card",
    name: "Tarjeta de crédito",
    subtitle: "Próximamente",
    active: false,
    disabled: true,
  },
]

function MPLogo() {
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: "#F97316" }}>
      MP
    </div>
  )
}

export default function PaymentMethodsPage() {
  const router = useRouter()

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
        <h1 className="text-lg font-bold text-foreground">Métodos de pago</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {METHODS.map((method) => (
          <div
            key={method.id}
            className={cn(
              "rounded-2xl bg-card border border-border px-4 py-4 flex items-center gap-4",
              method.disabled && "opacity-60"
            )}
          >
            {/* Icon */}
            <div className="shrink-0">
              {method.id === "mp" ? (
                <MPLogo />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                  {method.id === "cash" ? (
                    <Banknote size={20} className="text-foreground" />
                  ) : (
                    <CreditCard size={20} className="text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">{method.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                {method.disabled && (
                  <span className="text-[10px] font-semibold border border-[#F97316] text-[#F97316] rounded-full px-2 py-0.5">
                    Próximamente
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="shrink-0">
              {method.disabled ? (
                <Lock size={16} className="text-muted-foreground" />
              ) : (
                <Check size={18} style={{ color: "#22C55E" }} />
              )}
            </div>
          </div>
        ))}

        {/* Add method */}
        <button
          onClick={() => toast.info("Función disponible próximamente")}
          className="w-full rounded-2xl border-2 border-dashed border-border py-4 flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <Plus size={16} />
          Agregar método de pago
        </button>
      </div>
    </div>
  )
}
