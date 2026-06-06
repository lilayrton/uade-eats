"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, Loader2, ArrowRight } from "lucide-react"
import { useApp } from "@/context/AppContext"

function FailureContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dispatch } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    if (!orderId) {
      router.push("/")
      return
    }

    const restoreOrderToCart = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        const data = await res.json()
        
        if (data.success && data.order) {
          const order = data.order
          
          // Rebuild cart items
          const items = order.items.map((item: any) => ({
            product: item.product,
            quantity: item.quantity
          }))
          
          dispatch({
            type: "RESTORE_CART",
            payload: {
              storeId: order.storeId,
              storeName: order.store.name,
              items: items,
              notes: order.notes || ""
            }
          })
        }
      } catch (error) {
        console.error("Error restoring cart", error)
      } finally {
        setLoading(false)
      }
    }

    restoreOrderToCart()
  }, [searchParams, dispatch, router])

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#F9F5F0]">
        <Loader2 className="animate-spin text-[#F97316]" size={32} />
      </div>
    )
  }

  return (
    <div
      className="min-h-svh flex flex-col items-center"
      style={{ backgroundColor: "var(--brand-surface, #F9F5F0)" }}
    >
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-white relative">
        <header className="sticky top-0 z-40 bg-white border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={() => router.push("/cart")}
              aria-label="Volver"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F9F5F0] active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} color="#1C1917" />
            </button>
            <h1 className="text-base font-bold text-[#1C1917]">Pago no completado</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          
          <h2 className="font-black text-2xl text-[#1C1917] mb-2">
            Hubo un problema
          </h2>
          
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            No pudimos procesar tu pago en Mercado Pago o cancelaste la operación.
            <br/><br/>
            No te preocupes, <strong>guardamos tu pedido en el carrito</strong> para que puedas intentar pagarlo nuevamente.
          </p>
          
          <button
            onClick={() => router.push("/cart")}
            className="w-full bg-[#F97316] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/20"
          >
            Volver a mi carrito
            <ArrowRight size={18} />
          </button>
        </main>
      </div>
    </div>
  )
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-[#F9F5F0]">
        <Loader2 className="animate-spin text-[#F97316]" size={32} />
      </div>
    }>
      <FailureContent />
    </Suspense>
  )
}
