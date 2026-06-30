"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MapPin, CheckCircle2, Loader2, Store, Users } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/AppContext"
import { SplitBillModal } from "@/components/split-bill-modal"
import { NotificationsBell } from "@/components/notifications-bell"

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
  const [splitOrder, setSplitOrder] = useState<{
    total: number
    orderId: string
    existingSplit?: {
      code: string
      peopleCount: number
      amountPerPerson: number
      paidCount: number
    }
  } | null>(null)

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

    return () => {
      eventSource.close()
    }
  }, [fetchOrders])

  const activeOrders = orders.filter((o) =>
    o.status === "pending" || o.status === "preparing" || o.status === "ready"
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
            <NotificationsBell />
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
                        style={{ backgroundColor: isReady ? "#F0FDF4" : "#FFF7ED" }}
                      >
                        {isReady ? (
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
                          style={{ color: isReady ? "#16A34A" : "#F97316" }}
                        >
                          {isReady ? "¡Listo para retirar!" : order.status === "pending" ? "Recibido" : "En preparación"}
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

                        {/* Step tracker */}
                        <div className="flex items-center gap-0">
                          {STEPS.map((label, i) => {
                            const done = i <= step
                            const isLast = i === STEPS.length - 1
                            return (
                              <div key={label} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                  <div
                                    className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                                      done ? "bg-[#F97316] border-[#F97316] text-white" : "bg-transparent border-muted text-muted-foreground"
                                    )}
                                  >
                                    {done ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                                  </div>
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold text-center",
                                      done ? "text-foreground" : "text-muted-foreground"
                                    )}
                                  >
                                    {label}
                                  </span>
                                </div>
                                {!isLast && (
                                  <div className="flex-1 h-[2px] -mt-4 bg-muted/60 relative">
                                    <div
                                      className="absolute top-0 left-0 bottom-0 bg-[#F97316] transition-all"
                                      style={{ width: i < step ? "100%" : "0%" }}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

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

                        {/* Split bill */}
                        {(() => {
                          const split = order.splitBill
                          const paidCount = split?._count?.payments ?? 0
                          const allPaid = split && paidCount >= split.peopleCount - 1
                          return (
                            <button
                              onClick={() => setSplitOrder({
                                total: order.total,
                                orderId: order.id,
                                existingSplit: split ? {
                                  code: split.code,
                                  peopleCount: split.peopleCount,
                                  amountPerPerson: split.amountPerPerson,
                                  paidCount,
                                } : undefined,
                              })}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] mt-1 border"
                              style={
                                allPaid
                                  ? { borderColor: "#16A34A", color: "#16A34A", backgroundColor: "#F0FDF4" }
                                  : split
                                  ? { borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED" }
                                  : { borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED", borderStyle: "dashed" }
                              }
                            >
                              <Users size={13} />
                              {allPaid
                                ? "Cuenta dividida ✓"
                                : split
                                ? `Split activo · ${paidCount}/${split.peopleCount - 1} pagaron`
                                : "Dividir cuenta"}
                            </button>
                          )
                        })()}
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
                    <div
                      key={order.id}
                      className="rounded-2xl bg-card border border-border/60 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
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
                            <span className={cn(
                              "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              order.status === "completed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                            )}>
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

                      </div>

                      {order.status === "completed" && (() => {
                        const split = order.splitBill
                        const paidCount = split?._count?.payments ?? 0
                        const allPaid = split && paidCount >= split.peopleCount - 1
                        return (
                          <button
                            onClick={() => setSplitOrder({
                              total: order.total,
                              orderId: order.id,
                              existingSplit: split ? {
                                code: split.code,
                                peopleCount: split.peopleCount,
                                amountPerPerson: split.amountPerPerson,
                                paidCount,
                              } : undefined,
                            })}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] mt-3 border"
                            style={
                              allPaid
                                ? { borderColor: "#16A34A", color: "#16A34A", backgroundColor: "#F0FDF4" }
                                : split
                                ? { borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED" }
                                : { borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED", borderStyle: "dashed" }
                            }
                          >
                            <Users size={13} />
                            {allPaid
                              ? "Cuenta dividida ✓"
                              : split
                              ? `Split activo · ${paidCount}/${split.peopleCount - 1} pagaron`
                              : "Dividir cuenta"}
                          </button>
                        )
                      })()}
                    </div>
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
            if (id === "wallet") router.push("/wallet")
            if (id === "profile") router.push("/profile")
          }}
        />

        <SplitBillModal
          open={!!splitOrder}
          total={splitOrder?.total ?? 0}
          orderId={splitOrder?.orderId ?? ""}
          existingSplit={splitOrder?.existingSplit}
          onClose={() => setSplitOrder(null)}
        />
      </div>
    </div>
  )
}
