"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Store,
  CreditCard,
  Lock,
  Loader2,
  Wallet,
  Banknote,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/AppContext"
import Image from "next/image"

type PaymentId = "mercadopago" | "efectivo" | "tarjeta" | "wallet"

interface PaymentMethod {
  id: PaymentId
  label: string
  sublabel: string
  disabled?: boolean
  comingSoon?: boolean
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "mercadopago", label: "MercadoPago",         sublabel: "Pago digital" },
  { id: "efectivo",    label: "Efectivo al retirar",  sublabel: "Pagás cuando retirás" },
  { id: "tarjeta",     label: "Tarjeta de crédito",   sublabel: "",              disabled: true, comingSoon: true },
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
  const { state, dispatch } = useApp()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>("mercadopago")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  const cart = state.cart
  const storeName = cart.storeName ?? "UADE Eats"

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch(`/api/wallet?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBalance(data.balance)
        } else {
          toast.error("No se pudo cargar la billetera", { description: data.error || "No autorizado" })
          setBalance(0)
        }
      })
      .catch((e) => {
        console.error(e)
        toast.error("Error de conexión al cargar la billetera")
        setBalance(0)
      })
  }, [])

  useEffect(() => {
    if (mounted && cart.items.length === 0 && !isSuccess) {
      router.replace("/cart")
    }
  }, [mounted, cart.items.length, router, isSuccess])

  const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0)
  const discount = appliedCoupon === "UADE2026" ? subtotal * 0.20 : 0
  const discountedSubtotal = subtotal - discount
  
  // Service fee logic
  const serviceFeePercentage = selectedPayment === "wallet" ? 0.03 : 0.05
  const serviceFee = discountedSubtotal * serviceFeePercentage
  
  const total = discountedSubtotal + serviceFee

  const orderItems = cart.items.map((ci) => ({
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
    if (balance !== null && balance >= discountedSubtotal * 1.03) {
      setSelectedPayment("wallet")
    }
    setStep(2)
  }, [balance, discountedSubtotal])

  const handlePay = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: cart.storeId,
          items: cart.items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
          paymentMethod: selectedPayment,
          couponCode: appliedCoupon,
          notes: cart.notes
        })
      })

      const data = await res.json()
      if (data.success) {
        if (selectedPayment !== "mercadopago") {
          setIsSuccess(true)
          dispatch({ type: "CLEAR_CART" })
        }
        
        if (selectedPayment === "mercadopago" && data.initPoint) {
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          if (isLocalhost) {
            // Open real Mercado Pago in a new tab for sandbox simulation safely
            try {
              window.open(data.initPoint, "_blank")
            } catch (err) {
              console.error("Popup blocked by browser:", err)
            }
            // Instantly transition main tab to local success flow to trigger SSE & clean experience
            router.push(`/checkout/success?orderId=${data.order.id}`)
            toast.success("¡Pedido creado! Abriendo Mercado Pago en nueva pestaña...")
          } else {
            // Standard production redirection flow
            toast.success("Redirigiendo a Mercado Pago...")
            window.location.href = data.initPoint
            // Si el usuario vuelve con la flecha de atrás, rehabilitamos el botón
            // Comentado: para que se mantenga el estado de loading.
            // setTimeout(() => setIsProcessing(false), 2000)
          }
        } else if (selectedPayment !== "mercadopago") {
          router.push("/orders")
          toast.success("¡Pedido confirmado!", {
            description: `Tu pedido fue recibido por ${storeName}`,
            duration: 4000,
          })
        }
      } else {
        toast.error("Error al confirmar el pedido", { description: data.error })
        setIsProcessing(false)
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión", { description: "Revisá tu internet e intentá de nuevo." })
      setIsProcessing(false)
    }
  }, [isProcessing, router, storeName, cart, selectedPayment, dispatch, appliedCoupon])

  if (!mounted) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#F9F5F0]">
        <Loader2 className="animate-spin" style={{ color: "#F97316" }} size={32} />
      </div>
    )
  }

  if (cart.items.length === 0) return null

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
          className="flex-1 pb-24 animate-in fade-in slide-in-from-right-4 duration-200"
        >
          {step === 1 ? (
            <Step1Content
              storeName={storeName}
              items={orderItems}
              subtotal={subtotal}
              discount={discount}
              serviceFee={serviceFee}
              serviceFeePercentage={serviceFeePercentage}
              total={total}
              couponInput={couponInput}
              setCouponInput={setCouponInput}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
            />
          ) : (
            <Step2Content
              selectedPayment={selectedPayment}
              onSelect={setSelectedPayment}
              total={total}
              balance={balance}
              discountedSubtotal={discountedSubtotal}
            />
          )}
        </main>

        {/* ── Sticky footer CTA ── */}
        <div 
          className="sticky bottom-0 w-full z-50 bg-white border-t border-[#F3F4F6] px-4 pt-4 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
        >
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
                  Pagar ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Step 1: Order Summary ─────────────────────────────────────────────────────

function Step1Content({
  storeName,
  items,
  subtotal,
  discount,
  serviceFee,
  serviceFeePercentage,
  total,
  couponInput,
  setCouponInput,
  appliedCoupon,
  setAppliedCoupon,
}: {
  storeName: string
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>
  subtotal: number
  discount: number
  serviceFee: number
  serviceFeePercentage: number
  total: number
  couponInput: string
  setCouponInput: (val: string) => void
  appliedCoupon: string | null
  setAppliedCoupon: (val: string | null) => void
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

      {/* Coupon input */}
      <div className="mx-4 bg-white rounded-2xl border border-[#F3F4F6] p-2 flex gap-2 shadow-sm">
        <input 
          type="text" 
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          placeholder="Cupón de descuento" 
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#F9F5F0] text-sm uppercase font-bold tracking-wider placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all"
          disabled={!!appliedCoupon}
        />
        {appliedCoupon ? (
          <button 
            onClick={() => { setAppliedCoupon(null); setCouponInput("") }}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Quitar
          </button>
        ) : (
          <button 
            onClick={() => {
              if (couponInput === "UADE2026") {
                setAppliedCoupon("UADE2026")
                toast.success("¡Cupón del 20% aplicado!")
              } else if (couponInput) {
                toast.error("Cupón inválido")
              }
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-[#1C1917] hover:bg-black text-white transition-colors"
          >
            Aplicar
          </button>
        )}
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
          <span className="text-[#6B7280]">Costo de servicio ({serviceFeePercentage * 100}%)</span>
          <span className="text-[#1C1917] font-medium">
            ${serviceFee.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#16A34A] font-medium">Descuento ({appliedCoupon})</span>
            <span className="text-[#16A34A] font-bold">
              -${discount.toLocaleString("es-AR")}
            </span>
          </div>
        )}
        <div className="h-px bg-[#F3F4F6]" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#1C1917]">Total</span>
          <span className="text-lg font-bold" style={{ color: "#F97316" }}>
            ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
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
  total,
  balance,
  discountedSubtotal,
}: {
  selectedPayment: PaymentId
  onSelect: (id: PaymentId) => void
  total: number
  balance: number | null
  discountedSubtotal: number
}) {
  const walletState =
    balance === null      ? "loading"
    : balance < total     ? "insufficient"
    : "available"

  const shortage = walletState === "insufficient" ? Math.ceil(total - balance!) : 0
  // Savings vs MercadoPago (2% diff): only meaningful when wallet is available
  const savings  = walletState === "available"    ? Math.round(discountedSubtotal * 0.02) : 0

  const walletSublabel =
    walletState === "loading"      ? "Cargando saldo..."
    : walletState === "insufficient" ? `Saldo: $${balance!.toLocaleString("es-AR")} · Te faltan $${shortage.toLocaleString("es-AR")}`
    : `Saldo disponible: $${balance!.toLocaleString("es-AR")}`

  const walletDisabled = walletState !== "available"

  const walletOpacity =
    walletState === "loading"      ? "opacity-40"
    : walletState === "insufficient" ? "opacity-60"
    : ""

  const methods = [
    {
      id: "wallet" as PaymentId,
      label: "Mi Wallet",
      sublabel: walletSublabel,
      disabled: walletDisabled,
      comingSoon: false,
    },
    ...PAYMENT_METHODS
  ]

  return (
    <div className="pt-2">
      <p className="mx-4 mt-4 mb-3 font-bold text-[#1C1917] text-base">
        Método de pago
      </p>

      <div className="mx-4 space-y-3">
        {methods.map((method) => {
          const isSelected = selectedPayment === method.id
          const isWallet = method.id === "wallet"

          const disabledClass = method.disabled
            ? `${isWallet ? walletOpacity : "opacity-50"} cursor-not-allowed`
            : "active:scale-[0.98]"

          return (
            <button
              key={method.id}
              onClick={() => !method.disabled && onSelect(method.id)}
              disabled={method.disabled}
              aria-pressed={isSelected}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
                disabledClass,
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

                  {/* Wallet: badge según estado */}
                  {isWallet && walletState === "available" && (
                    <>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
                      >
                        Menor comisión (3%)
                      </span>
                      {savings > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
                        >
                          Ahorrás ${savings.toLocaleString("es-AR")}
                        </span>
                      )}
                    </>
                  )}
                  {isWallet && walletState === "insufficient" && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
                    >
                      Saldo insuficiente
                    </span>
                  )}

                  {/* Tarjeta y otros: solo si comingSoon */}
                  {method.comingSoon && (
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
  if (id === "wallet") {
    return (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#FFF0E6" }}
      >
        <Wallet size={22} color="#F97316" />
      </div>
    )
  }

  if (id === "mercadopago") {
    return (
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src="/mp-logo.jpg"
          width={44}
          height={44}
          alt="MercadoPago"
          className="w-full h-full object-contain"
        />
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
