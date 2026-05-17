"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/context/AppContext"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/types"

const PROBLEM_TYPES = [
  "Pedido incorrecto",
  "Problema de pago",
  "Local cerrado",
  "Error en la app",
  "Otro",
]

type Urgency = "low" | "medium" | "high"

const URGENCY_OPTIONS: { id: Urgency; label: string; color: string; border: string; bg: string }[] = [
  { id: "low", label: "Baja", color: "text-slate-600", border: "border-slate-400", bg: "bg-slate-50" },
  { id: "medium", label: "Media", color: "text-[#F97316]", border: "border-[#F97316]", bg: "bg-orange-50" },
  { id: "high", label: "Alta", color: "text-red-500", border: "border-red-400", bg: "bg-red-50" },
]

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

export default function ReportPage() {
  const router = useRouter()
  const { state } = useApp()

  const [problemType, setProblemType] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderList, setShowOrderList] = useState(false)
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState<Urgency | null>(null)
  const [errors, setErrors] = useState<{ type?: string; description?: string }>({})

  const handleSubmit = () => {
    const newErrors: typeof errors = {}
    if (!problemType) newErrors.type = "Seleccioná un tipo de problema"
    if (description.trim().length < 10) newErrors.description = "La descripción debe tener al menos 10 caracteres"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    toast.success("Reporte enviado. Te contactaremos pronto.")
    setTimeout(() => router.back(), 1500)
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
        <h1 className="text-lg font-bold text-foreground">Reportar un problema</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* Problem type chips */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Tipo de problema
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PROBLEM_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setProblemType(type)
                  setErrors((e) => ({ ...e, type: undefined }))
                }}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors",
                  problemType === type
                    ? "bg-[#F97316] border-[#F97316] text-white"
                    : "bg-card border-border text-foreground hover:bg-muted/40"
                )}
              >
                {type}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-500 mt-1 px-1">{errors.type}</p>}
        </div>

        {/* Order selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            ¿A qué pedido refiere? <span className="normal-case font-normal">(opcional)</span>
          </p>
          <div className="relative">
            <button
              onClick={() => setShowOrderList((v) => !v)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-left text-muted-foreground flex items-center justify-between"
            >
              <span className={selectedOrder ? "text-foreground" : ""}>
                {selectedOrder
                  ? `${selectedOrder.storeName} · #${selectedOrder.pickupCode} · ${formatDate(selectedOrder.createdAt)}`
                  : "Seleccionar pedido (opcional)"}
              </span>
              <ChevronLeft size={16} className={cn("text-muted-foreground transition-transform", showOrderList ? "-rotate-90" : "rotate-180")} />
            </button>
            {showOrderList && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-10 overflow-hidden">
                {state.orders.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No tenés pedidos recientes</p>
                ) : (
                  state.orders.slice(0, 5).map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderList(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0"
                    >
                      <span className="font-medium text-foreground">{order.storeName}</span>
                      <span className="text-muted-foreground ml-2">· #{order.pickupCode} · {formatDate(order.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Descripción del problema
          </p>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value.slice(0, 500))
              if (e.target.value.trim().length >= 10) setErrors((er) => ({ ...er, description: undefined }))
            }}
            placeholder="Contanos qué pasó con el mayor detalle posible..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 px-1 text-right">{description.length} / 500</p>
          {errors.description && <p className="text-xs text-red-500 px-1">{errors.description}</p>}
        </div>

        {/* Urgency */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            ¿Con qué urgencia necesitás ayuda?
          </p>
          <div className="flex gap-3">
            {URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setUrgency(opt.id)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-2 text-center text-xs font-semibold transition-colors",
                  urgency === opt.id
                    ? `${opt.border} ${opt.bg} ${opt.color}`
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ backgroundColor: "#F97316" }}
        >
          Enviar reporte
        </button>
      </div>
    </div>
  )
}
