"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Store,
  Banknote,
  CreditCard,
  Lock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"
import { useApp } from "@/context/AppContext"

type PaymentId = "mercadopago" | "efectivo" | "tarjeta"

interface PaymentMethod {
  id: PaymentId
  label: string
  sublabel: string
  disabled?: boolean
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "mercadopago", label: "MercadoPago",         sublabel: "Pago digital" },
  { id: "efectivo",    label: "Efectivo al retirar",  sublabel: "Pagás cuando retirás" },
  { id: "tarjeta",     label: "Tarjeta de crédito",   sublabel: "",              disabled: true },
]

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="px-6 py-4 bg-white">
      <div className="flex items-center justify-center gap-0">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
              step >= 1
                ? "text-white"
                : "bg-white border-2 border-[#D1D5DB] text-[#6B7280]"
            )}
            style={step >= 1 ? { backgroundColor: "#F97316" } : {}}
          >
            1
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              step >= 1 ? "font-semibold" : "text-[#6B7280]"
            )}
            style={step >= 1 ? { color: "#F97316" } : {}}
          >
            Resumen
          </span>
        </div>

        {/* Connector */}
        <div
          className="w-16 h-0.5 mb-4 mx-1 transition-all duration-300"
          style={{ backgroundColor: step === 2 ? "#F97316" : "#D1D5DB" }}
        />

        {/* Step 2 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
              step === 2
                ? "text-white"
                : "bg-white border-2 border-[#D1D5DB] text-[#6B7280]"
            )}
            style={step === 2 ? { backgroundColor: "#F97316" } : {}}
          >
            2
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              step === 2 ? "font-semibold" : "text-[#6B7280]"
            )}
            style={step === 2 ? { color: "#F97316" } : {}}
          >
            Pagar
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { state } = useApp()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>("efectivo")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeNav, setActiveNav] = useState("cart")

  // TODO: replace with API call (fetch order by activeOrderId)
  const activeOrder = state.activeOrderId
    ? state.orders.find((o) => o.id === state.activeOrderId) ?? null
    : null

  // Guard: if no active order, redirect to cart
  useEffect(() => {
    if (!activeOrder) {
      router.replace("/cart")
    }
  }, [activeOrder, router])

  if (!activeOrder) return null

  const total = activeOrder.total

  const orderItems = activeOrder.items.map((ci) => ({
    id: ci.product.id,
    name: ci.product.name,
    quantity: ci.quantity,
    unitPrice: ci.product.price,
  }))

  const handleBack = useCallback(() => {
    if (step === 1) router.back()
    else setStep(1)
  }, [step, router])

  const handleContinue = useCallback(() => {
    setStep(2)
  }, [])

  const handlePay = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    setTimeout(() => {
      router.push("/orders")
      toast.success("¡Pedido confirmado!", {
        description: `Tu pedido fue recibido por ${activeOrder.storeName}`,
        duration: 4000,
      })
    }, 1500)
  }, [isProcessing, router, activeOrder.storeName])

  const stepTitle = step === 1 ? "Resumen del pedido" : "Método de pago"

  return (
    <div
      className="min-h-svh flex flex-col items-center"
      style={{ backgroundColor: "var(--brand-surface, #F9F5F0)" }}
    >
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-white relative">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={handleBack}
              aria-label="Volver"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F9F5F0] active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} color="#1C1917" />
            </button>
            <h1 className="text-base font-bold text-[#1C1917]">{stepTitle}</h1>
          </div>

          {/* Step indicator below header title */}
          <StepIndicator step={step} />
        </header>

        {/* ── Main content (keyed so React re-mounts on step change → triggers animation) ── */}
        <main
          key={step}
          className="flex-1 pb-[220px] animate-in fade-in slide-in-from-right-4 duration-200"
        >
          {step === 1 ? (
            <Step1Content
              storeName={activeOrder.storeName}
              items={orderItems}
              subtotal={total}
              total={total}
            />
          ) : (
            <Step2Content
              selectedPayment={selectedPayment}
              onSelect={setSelectedPayment}
            />
          )}
        </main>

        {/* ── Fixed footer CTA ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-white border-t border-[#F3F4F6] px-4 pt-4 pb-2">
          {step === 1 ? (
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#F97316" }}
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all",
                isProcessing ? "opacity-75 cursor-not-allowed" : "active:scale-[0.98]"
              )}
              style={{ backgroundColor: "#F97316" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock size={15} />
                  Pagar ${total.toLocaleString("es-AR")}
                </>
              )}
            </button>
          )}
          <div className="h-20" />
        </div>

        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  )
}

// ── Step 1: Order Summary ─────────────────────────────────────────────────────

function Step1Content({
  storeName,
  items,
  subtotal,
  total,
}: {
  storeName: string
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>
  subtotal: number
  total: number
}) {
  return (
    <div className="pt-2 space-y-3">
      {/* Store card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-[#F3F4F6] p-4 flex items-center gap-3 shadow-sm">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FFF0E6" }}
        >
          <Store size={20} color="#F97316" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1C1917] text-sm leading-tight">{storeName}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="mx-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2 px-1">
          Tu pedido
        </p>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] divide-y divide-[#F9F9F9] shadow-sm overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#F97316" }}
              >
                {item.quantity}
              </span>
              <span className="flex-1 text-sm text-[#1C1917]">{item.name}</span>
              <span className="text-sm font-semibold text-[#1C1917]">
                ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="mx-4 bg-white rounded-2xl border border-[#F3F4F6] p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Subtotal</span>
          <span className="text-[#1C1917] font-medium">
            ${subtotal.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Costo de servicio</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
          >
            Gratis
          </span>
        </div>
        <div className="h-px bg-[#F3F4F6]" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#1C1917]">Total</span>
          <span className="text-lg font-bold" style={{ color: "#F97316" }}>
            ${total.toLocaleString("es-AR")}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Payment Method ────────────────────────────────────────────────────

function Step2Content({
  selectedPayment,
  onSelect,
}: {
  selectedPayment: PaymentId
  onSelect: (id: PaymentId) => void
}) {
  return (
    <div className="pt-2">
      <p className="mx-4 mt-4 mb-3 font-bold text-[#1C1917] text-base">
        Método de pago
      </p>

      <div className="mx-4 space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedPayment === method.id
          return (
            <button
              key={method.id}
              onClick={() => !method.disabled && onSelect(method.id)}
              disabled={method.disabled}
              aria-pressed={isSelected}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
                method.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "active:scale-[0.98]",
                isSelected && !method.disabled
                  ? "border-[#F97316] bg-[#FFF0E6]"
                  : "border-[#F3F4F6] bg-white"
              )}
            >
              {/* Left icon / logo */}
              <PaymentMethodIcon id={method.id} />

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#1C1917]">
                    {method.label}
                  </span>
                  {method.disabled && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
                    >
                      Próximamente
                    </span>
                  )}
                </div>
                {method.sublabel && (
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{method.sublabel}</p>
                )}
              </div>

              {/* Radio indicator */}
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150",
                  isSelected && !method.disabled
                    ? "border-[#F97316] bg-[#F97316]"
                    : "border-[#D1D5DB] bg-white"
                )}
              >
                {isSelected && !method.disabled && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Trust indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        <Lock size={12} color="#9CA3AF" />
        <span className="text-xs text-[#9CA3AF]">Pago seguro y encriptado</span>
      </div>
    </div>
  )
}

// ── Payment Method Icon ───────────────────────────────────────────────────────

function PaymentMethodIcon({ id }: { id: PaymentId }) {
  if (id === "mercadopago") {
    return (
      <div
        className="w-11 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs tracking-wide"
        style={{
          background: "linear-gradient(135deg, #009FE3 0%, #00B1EA 100%)",
        }}
      >
        MP
      </div>
    )
  }

  if (id === "efectivo") {
    return (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#F0FDF4" }}
      >
        <Banknote size={22} color="#16A34A" />
      </div>
    )
  }

  // tarjeta (disabled)
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#F9F9F9]">
      <CreditCard size={22} color="#9CA3AF" />
    </div>
  )
}
