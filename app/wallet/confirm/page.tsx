"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Wallet, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

function WalletConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const txId = searchParams.get("txId")
  const isMock = searchParams.get("mock") === "true"

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [amount, setAmount] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!txId) {
      const timeout = setTimeout(() => {
        setError(true)
        setLoading(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }

    const confirmLoad = async () => {
      try {
        const res = await fetch("/api/wallet/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: txId })
        })
        const data = await res.json()
        if (data.success) {
          toast.success(`¡$${data.amount.toLocaleString("es-AR")} acreditados en tu wallet!`)
          setAmount(data.amount)
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

    confirmLoad()
  }, [txId])

  useEffect(() => {
    if (loading || error || countdown === 0) return
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [loading, error, countdown])

  useEffect(() => {
    if (countdown === 0) router.replace("/wallet")
  }, [countdown, router])

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F9F5F0]">
        <div className="bg-white p-8 rounded-3xl border border-[#F3F4F6] shadow-sm max-w-[420px] w-full text-center space-y-6 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-[#EFF9FF] flex items-center justify-center mx-auto">
            <Loader2 className="animate-spin text-[#009FE3]" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#1C1917]">Verificando tu pago</h1>
            <p className="text-xs text-muted-foreground">
              Confirmando la acreditación con Mercado Pago...
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
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-400">
            <Wallet size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-red-600">No pudimos confirmar el pago</h1>
            <p className="text-xs text-muted-foreground">
              Si el importe fue debitado de Mercado Pago, contactanos con el comprobante para acreditarlo manualmente.
            </p>
          </div>
          <button
            onClick={() => router.replace("/wallet")}
            className="w-full py-3.5 text-white font-bold rounded-2xl text-xs transition-colors"
            style={{ backgroundColor: "#009FE3" }}
          >
            Volver a mi wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F9F5F0]">
      <div className="bg-white p-8 rounded-3xl border border-[#F3F4F6] shadow-[0_8px_30px_rgb(0,0,0,0.02)] max-w-[420px] w-full text-center space-y-6 animate-in zoom-in-95 duration-300">

        <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto text-green-500 animate-bounce">
          <CheckCircle2 size={44} className="stroke-[2.5px]" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Carga exitosa
          </span>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight pt-1">
            ¡Saldo acreditado!
          </h1>
          <p className="text-xs text-muted-foreground px-2">
            El pago fue procesado {isMock ? "vía simulación local" : "vía Mercado Pago"}. El saldo ya está disponible en tu wallet.
          </p>
        </div>

        <div className="bg-[#F9F5F0]/60 border border-[#F3F4F6] rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-[#1C1917]">
            <Wallet size={14} style={{ color: "#009FE3" }} />
            <span className="font-bold">Monto acreditado:</span>
            <span className="font-bold ml-auto" style={{ color: "#009FE3" }}>
              +${amount?.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#1C1917] pt-1.5 border-t border-[#EAEAEA]">
            <ShieldCheck size={14} className="text-green-600" />
            <span className="font-bold text-green-700">Estado:</span>
            <span className="text-green-600 font-bold ml-auto">Acreditado</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold" style={{ color: "#009FE3" }}>
            <Loader2 className="animate-spin" size={14} />
            <span>Redirigiendo a tu wallet en {countdown} segundos...</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function WalletConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-[#F9F5F0]">
          <Loader2 className="animate-spin text-[#009FE3]" size={32} />
        </div>
      }
    >
      <WalletConfirmContent />
    </Suspense>
  )
}
