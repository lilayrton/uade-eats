"use client"

import { useState } from "react"
import { X, Users, Copy, Check } from "lucide-react"

interface SplitBillModalProps {
  open: boolean
  total: number
  onClose: () => void
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function SplitBillModal({ open, total, onClose }: SplitBillModalProps) {
  const [people, setPeople] = useState(2)
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const perPerson = (total / people).toFixed(2)

  function handleGenerate() {
    setCode(generateCode())
  }

  function handleCopy() {
    if (!code) return
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setCode(null)
    setPeople(2)
    setCopied(false)
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF0E6" }}>
              <Users size={18} color="#F97316" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1917]">Dividir cuenta</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center"
          >
            <X size={15} color="#6B7280" />
          </button>
        </div>

        {!code ? (
          <>
            {/* Total display */}
            <div className="bg-[#F9F5F0] rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Total del pedido</p>
              <p className="text-2xl font-black" style={{ color: "#F97316" }}>
                ${total.toLocaleString("es-AR")}
              </p>
            </div>

            {/* People selector */}
            <p className="text-sm font-semibold text-[#1C1917] mb-3">¿Entre cuántas personas?</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setPeople((p) => Math.max(2, p - 1))}
                className="w-11 h-11 rounded-full border-2 border-[#F3F4F6] flex items-center justify-center text-xl font-bold text-[#1C1917] active:scale-95 transition-transform"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-4xl font-black text-[#1C1917]">{people}</span>
                <p className="text-xs text-[#9CA3AF] mt-0.5">personas</p>
              </div>
              <button
                onClick={() => setPeople((p) => Math.min(10, p + 1))}
                className="w-11 h-11 rounded-full border-2 border-[#F3F4F6] flex items-center justify-center text-xl font-bold text-[#1C1917] active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            {/* Per person preview */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F0FDF4] rounded-2xl mb-6">
              <span className="text-sm text-[#16A34A]">Tu parte</span>
              <span className="text-lg font-bold text-[#16A34A]">${Number(perPerson).toLocaleString("es-AR")}</span>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#F97316" }}
            >
              Generar código
            </button>
          </>
        ) : (
          <>
            {/* Code display */}
            <div className="text-center mb-6">
              <p className="text-sm text-[#6B7280] mb-4">
                Compartí este código con las otras personas para que paguen su parte desde su Wallet
              </p>
              <button
                onClick={handleCopy}
                className="inline-flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2 border-dashed transition-all active:scale-95"
                style={{ borderColor: "#F97316", backgroundColor: "#FFF7ED" }}
              >
                <span className="text-4xl font-black tracking-[0.15em]" style={{ color: "#F97316" }}>
                  {code}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#F97316" }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "¡Copiado!" : "Toca para copiar"}
                </span>
              </button>
            </div>

            {/* Split summary */}
            <div className="bg-[#F9F5F0] rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Total</span>
                <span className="font-semibold text-[#1C1917]">${total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Personas</span>
                <span className="font-semibold text-[#1C1917]">{people}</span>
              </div>
              <div className="h-px bg-[#E5E7EB]" />
              <div className="flex justify-between">
                <span className="font-bold text-[#1C1917]">Por persona</span>
                <span className="font-bold text-lg" style={{ color: "#F97316" }}>
                  ${Number(perPerson).toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#1C1917" }}
            >
              Listo
            </button>
          </>
        )}
      </div>
      </div>
    </>
  )
}
