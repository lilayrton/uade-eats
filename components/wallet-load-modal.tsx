"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WalletLoadModalProps {
  open: boolean
  onClose: () => void
}

const AMOUNTS = [500, 1000, 2000, 5000]

const CLOSE_ANIMATION_MS = 250

export function WalletLoadModal({ open, onClose }: WalletLoadModalProps) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRender, setShouldRender] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setClosing(false)
    }
  }, [open])

  if (!shouldRender) return null

  const selectedAmount = customAmount || amount

  function handleClose() {
    if (isLoading || closing) return
    setClosing(true)
    setTimeout(() => {
      setAmount("")
      setCustomAmount("")
      setClosing(false)
      setShouldRender(false)
      onClose()
    }, CLOSE_ANIMATION_MS)
  }

  async function handleLoad() {
    const parsed = Number(selectedAmount)
    if (!parsed || parsed <= 0) {
      toast.error("Seleccioná un monto válido")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/wallet/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed })
      })
      const data = await res.json()

      if (!data.success || !data.initPoint) {
        toast.error("No se pudo iniciar el pago", { description: data.error })
        setIsLoading(false)
        return
      }

      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"

      if (isLocalhost) {
        try {
          window.open(data.initPoint, "_blank")
        } catch (err) {
          console.error("Popup blocked:", err)
        }
        toast.success("Abriendo Mercado Pago en nueva pestaña...")
        router.push(`/wallet/confirm?txId=${data.transactionId}`)
      } else {
        toast.success("Redirigiendo a Mercado Pago...")
        window.location.href = data.initPoint
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión", { description: "Revisá tu internet e intentá de nuevo." })
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ transitionDuration: `${CLOSE_ANIMATION_MS}ms` }}
        onClick={handleClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div
          className={`relative w-full max-w-[480px] bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-xl pointer-events-auto ${
            closing ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom-4"
          }`}
          style={{ animationDuration: `${CLOSE_ANIMATION_MS}ms` }}
        >

          <div className="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1C1917]">Cargar wallet</h2>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center" disabled={isLoading}>
              <X size={15} color="#6B7280" />
            </button>
          </div>

          <div
            className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #009FE3 0%, #00B1EA 100%)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-lg">
              MP
            </div>
            <div>
              <p className="font-bold text-white text-sm">Mercado Pago</p>
              <p className="text-white/80 text-xs">Pago digital seguro</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-[#1C1917] mb-3">¿Cuánto querés cargar?</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => { setAmount(String(a)); setCustomAmount("") }}
                disabled={isLoading}
                className="py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={
                  amount === String(a) && !customAmount
                    ? { borderColor: "#009FE3", backgroundColor: "#EFF9FF", color: "#009FE3" }
                    : { borderColor: "#F3F4F6", backgroundColor: "white", color: "#1C1917" }
                }
              >
                ${a.toLocaleString("es-AR")}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Otro monto..."
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount("") }}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F3F4F6] text-sm bg-[#F9F5F0] focus:outline-none focus:border-[#009FE3] mb-5 transition-colors disabled:opacity-50"
          />

          <button
            onClick={handleLoad}
            disabled={isLoading || !selectedAmount}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#009FE3" }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando...
              </>
            ) : selectedAmount ? (
              `Cargar $${Number(selectedAmount).toLocaleString("es-AR")}`
            ) : (
              "Seleccioná un monto"
            )}
          </button>
        </div>
      </div>
    </>
  )
}
