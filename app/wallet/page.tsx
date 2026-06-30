"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Plus, Search, ArrowUpRight, ArrowDownLeft, ArrowUpRight as ArrowOut, Users, Loader2 } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { WalletLoadModal } from "@/components/wallet-load-modal"
import { useApp } from "@/context/AppContext"

// ── Wallet transaction types ──────────────────────────────────────────────────

type TransactionType = "ingreso" | "pago_dividido" | "retiro"

interface WalletTransaction {
  id: string
  type: TransactionType
  label: string
  amount: number
  date: string
  subtitle?: string
}

interface ApiTransaction {
  id: string
  type: string
  amount: number
  status: string
  description: string | null
  createdAt: string
}

function mapApiTransaction(tx: ApiTransaction): WalletTransaction {
  const date = new Date(tx.createdAt)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  let dateStr: string
  if (isToday) dateStr = `Hoy, ${timeStr}`
  else if (isYesterday) dateStr = `Ayer, ${timeStr}`
  else dateStr = date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) + `, ${timeStr}`

  if (tx.type === "load") {
    return { id: tx.id, type: "ingreso", label: tx.description || "Carga de saldo", amount: tx.amount, date: dateStr }
  }
  if (tx.type === "split_received") {
    return { id: tx.id, type: "pago_dividido", label: tx.description || "Parte recibida", amount: Math.abs(tx.amount), date: dateStr }
  }
  if (tx.type === "split_payment") {
    return { id: tx.id, type: "pago_dividido", label: tx.description || "Tu parte", amount: -Math.abs(tx.amount), date: dateStr }
  }
  return { id: tx.id, type: "retiro", label: tx.description || "Pago", amount: -Math.abs(tx.amount), date: dateStr }
}

const TRANSACTION_META: Record<TransactionType, {
  iconBg: string
  iconColor: string
  Icon: React.ElementType
  amountColor: (amount: number) => string
}> = {
  ingreso: {
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
    Icon: ArrowDownLeft,
    amountColor: () => "#16A34A",
  },
  pago_dividido: {
    iconBg: "#FFF0E6",
    iconColor: "#F97316",
    Icon: Users,
    amountColor: () => "#1C1917",
  },
  retiro: {
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
    Icon: ArrowOut,
    amountColor: () => "#DC2626",
  },
}

// ── Transaction row component ─────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const meta = TRANSACTION_META[tx.type]
  const { Icon, iconBg, iconColor, amountColor } = meta
  const sign = tx.amount > 0 ? "+" : "-"
  const formattedAmount = `${sign}$${Math.abs(tx.amount).toLocaleString("es-AR")}`
  const dateLabel = tx.subtitle ? `${tx.date} · ${tx.subtitle}` : tx.date

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{tx.label}</p>
        <p className="text-xs text-muted-foreground truncate">{dateLabel}</p>
      </div>
      <span className="text-sm font-bold shrink-0" style={{ color: amountColor(tx.amount) }}>
        {formattedAmount}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface SplitLookup {
  code: string
  storeName: string
  total: number
  amountPerPerson: number
  peopleCount: number
  paidCount: number
  slotsLeft: number
  isCreator: boolean
  alreadyPaid: boolean
}

export default function WalletPage() {
  const router = useRouter()
  const { cartCount } = useApp()
  const [loadOpen, setLoadOpen] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [foundSplit, setFoundSplit] = useState<SplitLookup | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [paid, setPaid] = useState(false)
  const [searching, setSearching] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [walletLoading, setWalletLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBalance(data.balance)
          setTransactions(
            (data.transactions as ApiTransaction[])
              .filter((tx) => tx.status === "completed")
              .map(mapApiTransaction)
          )
        }
      })
      .catch(console.error)
      .finally(() => setWalletLoading(false))
  }, [loadOpen, refreshKey])

  async function handleSearch() {
    const key = codeInput.trim().toUpperCase()
    if (!key) return
    setSearching(true)
    setNotFound(false)
    setFoundSplit(null)
    setPaid(false)
    setPayError(null)
    try {
      const res = await fetch(`/api/split-bills/${key}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setFoundSplit({ code: key, ...data })
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  async function handlePay() {
    if (!foundSplit) return
    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch(`/api/split-bills/${foundSplit.code}/pay`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) {
        setPaid(true)
        setFoundSplit(null)
        setBalance(data.balance)
        setRefreshKey((k) => k + 1)
      } else {
        setPayError(data.error || "No se pudo procesar el pago")
      }
    } catch {
      setPayError("No se pudo procesar el pago")
    } finally {
      setPaying(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface, #F9F5F0)" }}>
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative overflow-x-hidden">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
            Mi Wallet
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-4">

          {/* ── Balance card ── */}
          <div
            className="rounded-3xl p-5 text-white overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: "white", transform: "translate(-30%, 30%)" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={16} className="opacity-80" />
                <span className="text-sm font-semibold opacity-80">Saldo disponible</span>
              </div>
              <p className="text-4xl font-black mb-1">
                {walletLoading ? (
                  <Loader2 className="animate-spin inline" size={32} />
                ) : (
                  `$${balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                )}
              </p>
              <p className="text-xs opacity-70">UADE Eats Wallet</p>
            </div>
          </div>

          {/* ── Quick action ── */}
          <button
            onClick={() => setLoadOpen(true)}
            className="w-full flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#FFF0E6" }}
            >
              <Plus size={20} color="#F97316" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm text-foreground">Cargar saldo</p>
              <p className="text-xs text-muted-foreground">Vía Mercado Pago</p>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground" />
          </button>

          {/* ── Pagar mi parte ── */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Pagar mi parte</h2>
            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingresá el código que te compartieron para pagar tu parte de un pedido dividido.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase())
                    setFoundSplit(null)
                    setNotFound(false)
                    setPaid(false)
                    setPayError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Código (ej: UA4B2X)"
                  maxLength={6}
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#F9F5F0] text-sm font-bold tracking-wider uppercase placeholder:normal-case placeholder:font-medium placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all border border-border/40"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="shrink-0 px-4 py-3 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-60"
                  style={{ backgroundColor: "#1C1917" }}
                >
                  {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  Buscar
                </button>
              </div>

              {notFound && (
                <p className="text-xs text-red-500 font-medium text-center py-2">
                  No encontramos un pedido con ese código. Verificá con quien lo generó.
                </p>
              )}

              {foundSplit && !paid && (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: "#FFF7ED" }}>
                    <p className="text-xs font-bold" style={{ color: "#F97316" }}>Pedido encontrado</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Local</span>
                      <span className="font-semibold text-foreground">{foundSplit.storeName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total del pedido</span>
                      <span className="font-semibold text-foreground">${foundSplit.total.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Personas</span>
                      <span className="font-semibold text-foreground">{foundSplit.peopleCount}</span>
                    </div>
                    <div className="h-px bg-border/40" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Tu parte</span>
                      <span className="font-black text-lg" style={{ color: "#F97316" }}>
                        ${foundSplit.amountPerPerson.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {(() => {
                      const insufficient = balance < foundSplit.amountPerPerson
                      let notice: { text: string; bg: string; color: string } | null = null
                      if (foundSplit.isCreator) {
                        notice = { text: "Sos quien generó la división, no podés pagar tu propia parte", bg: "#FEF2F2", color: "#B91C1C" }
                      } else if (foundSplit.alreadyPaid) {
                        notice = { text: "Ya pagaste tu parte de este pedido", bg: "#F0FDF4", color: "#16A34A" }
                      } else if (foundSplit.slotsLeft <= 0) {
                        notice = { text: "Esta división ya está completa", bg: "#F3F4F6", color: "#6B7280" }
                      } else if (insufficient) {
                        notice = { text: "Saldo insuficiente — cargá tu wallet primero", bg: "#FEF9C3", color: "#854D0E" }
                      }

                      const canPay = !foundSplit.isCreator && !foundSplit.alreadyPaid && foundSplit.slotsLeft > 0 && !insufficient

                      return (
                        <>
                          {notice && (
                            <div
                              className="rounded-xl px-3 py-2 text-xs text-center font-medium mt-1"
                              style={{ backgroundColor: notice.bg, color: notice.color }}
                            >
                              {notice.text}
                            </div>
                          )}
                          {payError && (
                            <p className="text-xs text-red-500 font-medium text-center mt-1">{payError}</p>
                          )}
                          <button
                            onClick={handlePay}
                            disabled={!canPay || paying}
                            className="w-full py-3 rounded-xl font-bold text-white text-sm mt-1 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#F97316" }}
                          >
                            {paying ? "Procesando…" : "Confirmar pago"}
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {paid && (
                <div className="rounded-2xl bg-[#F0FDF4] border border-green-100 p-4 text-center">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="font-bold text-[#16A34A] text-sm">¡Pago confirmado!</p>
                  <p className="text-xs text-[#16A34A]/80 mt-1">Tu parte fue debitada correctamente</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Movimientos ── */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Movimientos</h2>
            <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/40 overflow-hidden">
              {walletLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={20} />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Todavía no tenés movimientos.
                </p>
              ) : (
                transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              )}
            </div>
          </section>

        </main>

        {/* ── Bottom Navigation ── */}
        <BottomNav
          active="wallet"
          cartCount={cartCount}
          onChange={(id) => {
            if (id === "home") router.push("/")
            if (id === "orders") router.push("/orders")
            if (id === "cart") router.push("/cart")
            if (id === "profile") router.push("/profile")
          }}
        />

        <WalletLoadModal open={loadOpen} onClose={() => setLoadOpen(false)} />
      </div>
    </div>
  )
}
