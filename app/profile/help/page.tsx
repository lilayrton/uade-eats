"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FAQS = [
  {
    q: "¿Cómo hago un pedido?",
    a: "Elegí un local desde la pantalla de inicio, seleccioná los productos que querés y confirmá tu pedido desde el carrito. Vas a recibir un código de retiro.",
  },
  {
    q: "¿Cómo retiro mi pedido?",
    a: "Cuando el local marque tu pedido como listo, vas a recibir una notificación. Acercate al mostrador y mostrá el código de retiro que aparece en la pantalla de seguimiento.",
  },
  {
    q: "¿Puedo cancelar un pedido?",
    a: "Podés cancelar tu pedido dentro de los primeros 2 minutos de haberlo confirmado. Después de ese tiempo, el local ya comenzó la preparación.",
  },
  {
    q: "¿Qué métodos de pago están disponibles?",
    a: "Actualmente aceptamos MercadoPago y efectivo al retirar. El pago con tarjeta de crédito estará disponible próximamente.",
  },
  {
    q: "¿Qué hago si mi pedido tiene un error?",
    a: "Usá la opción 'Reportar un problema' en tu perfil y describí el inconveniente. Un miembro del equipo te contactará a la brevedad.",
  },
  {
    q: "¿UADE EATS funciona fuera del campus?",
    a: "Por ahora, UADE EATS está disponible exclusivamente para los locales del campus de UADE Lima.",
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

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
        <h1 className="text-lg font-bold text-foreground">Ayuda y preguntas frecuentes</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en ayuda..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
          />
        </div>

        {/* FAQ list */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Preguntas frecuentes
          </p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/40">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-muted-foreground shrink-0 transition-transform duration-200",
                      openIndex === i && "rotate-180"
                    )}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact card */}
        <div className="rounded-2xl bg-muted/50 px-4 py-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">¿No encontraste lo que buscabas?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Escribinos a soporte@uadeeats.edu.ar</p>
          </div>
          <button
            onClick={() => toast.info("Función disponible próximamente")}
            className="px-4 py-2 rounded-xl border border-[#F97316] text-[#F97316] text-sm font-semibold hover:bg-orange-50/50 transition-colors"
          >
            Contactar soporte
          </button>
        </div>
      </div>
    </div>
  )
}
