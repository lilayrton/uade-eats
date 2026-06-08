"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronRight, MapPin, CheckCircle2, Loader2, Store, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/AppContext"

const STEPS = ["Recibido", "En preparación", "Listo"]

function stepIndex(status: string): number {
  if (status === "pending") return 0
  if (status === "preparing") return 1
  if (status === "ready") return 2
  return 0
}

function formatTime(ts: string | number): string {
  return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(ts: string | number): string {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function OrdersPage() {
  const router = useRouter()
  const { cartCount } = useApp()
  const [activeNav] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen to SSE events for real-time Event-Driven updates
  useEffect(() => {
    fetchOrders()

    const eventSource = new EventSource("/api/sse")

    eventSource.onmessage = (event) => {
      try {
        const { type } = JSON.parse(event.data)
        if (type === "order_updated" || type === "new_order") {
          fetchOrders()
        }
      } catch (err) {
        console.error("SSE parse error:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err)
    }

    // Polling fallback every 5 seconds para Vercel serverless
    const interval = setInterval(() => {
      fetchOrders()
    }, 5000)

    return () => {
      eventSource.close()
      clearInterval(interval)
    }
  }, [fetchOrders])

  const activeOrders = orders.filter((o) =>
    o.status === "pending" || o.status === "preparing" || o.status === "ready" || o.status === "pending_payment"
  )
  const pastOrders = orders.filter((o) => o.status === "completed" || o.status === "cancelled")

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface)" }}>
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
              Mis pedidos
            </h1>
            <button
              className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={18} className="text-foreground" />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">

          {/* Active orders */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Pedidos activos</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl bg-card border border-border/60">
                <span className="text-4xl mb-3">🛵</span>
                <p className="font-semibold text-foreground text-sm">Sin pedidos activos</p>
                <p className="text-xs text-muted-foreground mt-1">Tus pedidos en curso aparecerán acá</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => {
                  const isPendingPayment = order.status === "pending_payment"
                  const step = stepIndex(order.status)
                  const isReady = order.status === "ready"
                  const storeCategory = order.store.category ?? ""
                  const itemsLabel = order.items
                    .map((i: any) => `${i.product.name} × ${i.quantity}`)
                    .join(", ")

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-card border border-border/60 overflow-hidden"
                    >
                      {/* Status bar */}
                      <div
                        className="px-4 py-2.5 flex items-center gap-2"
                        style={{ backgroundColor: isPendingPayment ? "#FEF2F2" : isReady ? "#F0FDF4" : "#FFF7ED" }}
                      >
                        {isPendingPayment ? (
                          <Loader2 size={15} style={{ color: "#EF4444" }} className="animate-spin" />
                        ) : isReady ? (
                          <CheckCircle2 size={15} style={{ color: "#16A34A" }} />
                        ) : (
                          <Loader2
                            size={15}
                            style={{ color: "#F97316" }}
                            className="animate-spin"
                          />
                        )}
                        <span
                          className="text-xs font-bold"
                          style={{ color: isPendingPayment ? "#EF4444" : isReady ? "#16A34A" : "#F97316" }}
                        >
                          {isPendingPayment ? "Pendiente de pago digital" : isReady ? "¡Listo para retirar!" : order.status === "pending" ? "Recibido" : "En preparación"}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Store + items */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground">{order.store.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{itemsLabel}</p>
                          </div>
                          <span
                            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#FFF0E6", color: "#F97316" }}
                          >
                            {storeCategory}
                          </span>
                        </div>

                        {isPendingPayment ? (
                          <div className="pt-1.5 pb-0.5 space-y-2">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              El pago digital no se pudo confirmar todavía. Podés intentar verificar el estado de tu pago, o cancelar este pedido e intentar nuevamente.
                            </p>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  toast.loading("Verificando estado del pago...")
                                  router.push(`/checkout/success?orderId=${order.id}`)
                                }}
                                className="w-full bg-[#F97316] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                              >
                                <RefreshCw size={14} />
                                Verificar estado del pago
                              </button>
                              <button
                                onClick={() => {
                                  setCancelOrderId(order.id)
                                }}
                                className="w-full border border-red-200 bg-red-50 text-red-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                              >
                                Cancelar pedido
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Step tracker */
                          <div className="flex items-center gap-0">
                          {STEPS.map((label, i) => {
                            const done = i <= step
                            const isLast = i === STEPS.length - 1
                            return (
                              <div key={label} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300",
                                      done ? "text-white" : "bg-muted text-muted-foreground"
                                    )}
                                    style={done ? { backgroundColor: i === step && !isReady ? "#F97316" : i < step || isReady ? "#16A34A" : "#F97316" } : {}}
                                  >
                                    {done ? (
                                      i < step || isReady ? (
                                        <CheckCircle2 size={14} />
                                      ) : (
                                        <span className="w-2 h-2 rounded-full bg-white" />
                                      )
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                    )}
                                  </div>
                                  <span
                                    className={cn("text-[9px] font-medium text-center leading-tight", done ? "text-foreground" : "text-muted-foreground")}
                                  >
                                    {label}
                                  </span>
                                </div>
                                {!isLast && (
                                  <div
                                    className="h-0.5 flex-1 -mt-4 mx-1 rounded-full transition-colors duration-300"
                                    style={{ backgroundColor: i < step ? "#16A34A" : "var(--border)" }}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        )}

                        {/* Footer: pickup code + price */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Pedido de las {formatTime(order.createdAt)}
                            </span>
                          </div>
                          {isReady ? (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl"
                              style={{ backgroundColor: "#F0FDF4" }}
                            >
                              <span className="text-xs text-muted-foreground">Código</span>
                              <span className="text-lg font-black" style={{ color: "#16A34A" }}>
                                #{order.pickupCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              ${order.total.toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Order history */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Historial</h2>
            {loading ? null : pastOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3">📋</span>
                <p className="font-semibold text-foreground text-sm">Sin pedidos anteriores</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastOrders.map((order) => {
                  const itemsLabel = order.items
                    .map((i: any) => `${i.product.name} × ${i.quantity}`)
                    .join(", ")
                  return (
                    <button
                      key={order.id}
                      className="w-full text-left rounded-2xl bg-card border border-border/60 px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors active:scale-[0.99]"
                    >
                      {/* Store icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: "#FFF0E6" }}
                      >
                        <Store size={20} color="#F97316" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm text-foreground truncate">{order.store.name}</p>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            {order.status === "completed" ? "Completado" : "Cancelado"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{itemsLabel}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                          <span className="text-xs font-semibold text-foreground">
                            ${order.total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </main>

        {/* ── Bottom Navigation ── */}
        <BottomNav
          active={activeNav}
          cartCount={cartCount}
          onChange={(id) => {
            if (id === "home") router.push("/")
            if (id === "cart") router.push("/cart")
            if (id === "profile") router.push("/profile")
          }}
        />

        {/* ── Cancel Order Modal ── */}
        {cancelOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="font-black text-xl text-[#1C1917] mb-2">¿Cancelar pedido?</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Esta acción no se puede deshacer. ¿Estás seguro de que querés cancelar tu pedido pendiente?
              </p>
              
              <div className="w-full flex flex-col gap-3">
                <button
                  disabled={isCancelling}
                  onClick={async () => {
                    setIsCancelling(true)
                    try {
                      const res = await fetch(`/api/orders/${cancelOrderId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "cancelled" })
                      })
                      if (res.ok) {
                        toast.success("Pedido cancelado exitosamente")
                        setCancelOrderId(null)
                        fetchOrders()
                      } else {
                        const err = await res.json()
                        toast.error("Error al cancelar", { description: err.error || "Intenta de nuevo" })
                      }
                    } catch (e) {
                      toast.error("Error de red", { description: "Revisá tu conexión" })
                    } finally {
                      setIsCancelling(false)
                    }
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling ? <Loader2 size={18} className="animate-spin" /> : "Sí, cancelar pedido"}
                </button>
                <button
                  disabled={isCancelling}
                  onClick={() => setCancelOrderId(null)}
                  className="w-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1C1917] font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50"
                >
                  No, mantener pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
