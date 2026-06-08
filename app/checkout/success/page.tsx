"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Calendar, ShieldCheck, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/context/AppContext"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dispatch } = useApp()
  const orderId = searchParams.get("orderId")
  const isMock = searchParams.get("mock") === "true"

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    // Wait for Next.js to hydrate searchParams. If still not available after 3s, show error.
    if (!orderId) {
      const timeout = setTimeout(() => {
        if (!orderId) {
          setError(true)
          setLoading(false)
        }
      }, 3000)
      return () => clearTimeout(timeout)
    }

    const confirmOrder = async () => {
      try {
        const res = await fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId })
        })
        const data = await res.json()
        if (data.success) {
          toast.success("Pago verificado con éxito")
          dispatch({ type: "CLEAR_CART" })
          setLoading(false)
        } else {
          setError(true)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        setError(true)
        setLoading(false)
      }
    }

    confirmOrder()
  }, [orderId])

  // Countdown timer for automatic decrement
  useEffect(() => {
    if (loading || error || countdown === 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, error, countdown])

  // Automatic redirect trigger when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.replace("/orders")
    }
  }, [countdown, router])

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F9F5F0]">
        <div className="bg-white p-8 rounded-3xl border border-[#F3F4F6] shadow-sm max-w-[420px] w-full text-center space-y-6 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-[#FFF0E6] flex items-center justify-center mx-auto">
            <Loader2 className="animate-spin text-[#F97316]" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#1C1917]">Verificando tu pago</h1>
            <p className="text-xs text-muted-foreground">
              Comunicándonos de forma segura con Mercado Pago para confirmar tu acreditación...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F9F5F0]">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm max-w-[420px] w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
            <CheckCircle2 size={32} className="opacity-20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-red-600">Algo salió mal</h1>
            <p className="text-xs text-muted-foreground">
              No pudimos verificar de forma segura la aprobación de tu pago. Si el importe fue descontado, por favor contactá al comedor presentando el comprobante.
            </p>
          </div>
          <button
            onClick={() => router.replace("/orders")}
            className="w-full py-3.5 bg-[#F97316] text-white font-bold rounded-2xl text-xs hover:bg-[#EA580C] transition-colors"
          >
            Ir a mis pedidos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F9F5F0]">
      <div className="bg-white p-8 rounded-3xl border border-[#F3F4F6] shadow-[0_8px_30px_rgb(0,0,0,0.02)] max-w-[420px] w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
        
        {/* Animated Green Check Ring */}
        <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto text-green-500 animate-bounce">
          <CheckCircle2 size={44} className="stroke-[2.5px]" />
        </div>

        {/* Dynamic header labels */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Pago Aprobado
          </span>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight pt-1">
            ¡Muchas gracias por tu compra!
          </h1>
          <p className="text-xs text-muted-foreground px-2">
            El pago fue acreditado {isMock ? "vía simulación local" : "vía Mercado Pago Checkout Pro"}. Tu orden ya ingresó en preparación en la cocina.
          </p>
        </div>

        {/* Order Details Display Card */}
        <div className="bg-[#F9F5F0]/60 border border-[#F3F4F6] rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-[#1C1917]">
            <ShoppingBag size={14} className="text-[#F97316]" />
            <span className="font-bold">Orden ID:</span>
            <span className="font-mono text-muted-foreground ml-auto truncate max-w-[180px]">
              {orderId}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#1C1917]">
            <Calendar size={14} className="text-[#F97316]" />
            <span className="font-bold">Fecha:</span>
            <span className="text-muted-foreground ml-auto">
              {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#1C1917] pt-1.5 border-t border-[#EAEAEA]">
            <ShieldCheck size={14} className="text-green-600" />
            <span className="font-bold text-green-700">Estado de acreditación:</span>
            <span className="text-green-600 font-bold ml-auto">
              100% Seguro
            </span>
          </div>
        </div>

        {/* Redirect timer display */}
        <div className="pt-2">
          <div className="flex items-center justify-center gap-2 text-xs text-[#F97316] font-bold">
            <Loader2 className="animate-spin" size={14} />
            <span>Redirigiendo a Mis Pedidos en {countdown} segundos...</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-[#F9F5F0]">
          <Loader2 className="animate-spin text-[#F97316]" size={32} />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
