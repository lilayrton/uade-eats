"use client"

import { useState } from "react"
import { X, CreditCard, Lock } from "lucide-react"

interface WalletLoadModalProps {
  open: boolean
  onClose: () => void
}

const AMOUNTS = [500, 1000, 2000, 5000]

export function WalletLoadModal({ open, onClose }: WalletLoadModalProps) {
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")

  if (!open) return null

  const selectedAmount = customAmount || amount

  function handleClose() {
    setAmount("")
    setCustomAmount("")
    onClose()
  }

  return (
    <>
      {/* Backdrop — full viewport */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet — constrained to app width */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-xl animate-in slide-in-from-bottom-4 duration-250 pointer-events-auto">

        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1C1917]">Cargar wallet</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
            <X size={15} color="#6B7280" />
          </button>
        </div>

        {/* MP branding */}
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

        {/* Amount selection */}
        <p className="text-sm font-semibold text-[#1C1917] mb-3">¿Cuánto querés cargar?</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setAmount(String(a)); setCustomAmount("") }}
              className="py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95"
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
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F3F4F6] text-sm bg-[#F9F5F0] focus:outline-none focus:border-[#009FE3] mb-5 transition-colors"
        />

        <button
          disabled
          className="w-full py-4 rounded-2xl font-bold text-white text-base opacity-40 cursor-not-allowed"
          style={{ backgroundColor: "#009FE3" }}
        >
          {selectedAmount ? `Cargar $${Number(selectedAmount).toLocaleString("es-AR")}` : "Seleccioná un monto"}
        </button>
      </div>
      </div>
    </>
  )
}
