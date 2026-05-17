"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { VendorOrderCard, type Order } from "@/components/vendor-order-card"
import { VendorStatusToggle } from "@/components/vendor-status-toggle"

const MOCK_ORDERS: Order[] = [
  {
    id: "v1",
    code: 43,
    status: "nuevo",
    student: "M. González",
    studentId: "Leg. 2089341",
    payment: "MercadoPago",
    items: [
      { name: "Café con Leche", qty: 2 },
      { name: "Medialuna", qty: 3 },
    ],
    total: 8400,
    placedAt: Date.now() - 2 * 60 * 1000,
  },
  {
    id: "v2",
    code: 44,
    status: "nuevo",
    student: "R. Fernández",
    studentId: "Leg. 3341209",
    payment: "Efectivo",
    items: [
      { name: "Tostado Mixto", qty: 1 },
      { name: "Jugo de Naranja", qty: 1 },
    ],
    total: 3900,
    placedAt: Date.now() - 5 * 60 * 1000,
  },
  {
    id: "v3",
    code: 41,
    status: "preparando",
    student: "L. Martínez",
    studentId: "Leg. 1876540",
    payment: "MercadoPago",
    items: [
      { name: "Brownie", qty: 1 },
      { name: "Mate Cocido", qty: 2 },
    ],
    total: 4300,
    placedAt: Date.now() - 9 * 60 * 1000,
  },
  {
    id: "v4",
    code: 39,
    status: "listo",
    student: "C. Ramos",
    studentId: "Leg. 4421887",
    payment: "Efectivo",
    items: [{ name: "Medialunas (x3)", qty: 2 }],
    total: 3200,
    placedAt: Date.now() - 14 * 60 * 1000,
  },
]

export default function VendorPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [isOpen, setIsOpen] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

  const newOrders = useMemo(
    () => orders.filter((o) => o.status === "nuevo"),
    [orders]
  )
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === "preparando"),
    [orders]
  )
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "listo"),
    [orders]
  )

  function handleToggle() {
    if (isOpen) {
      const ok = window.confirm("¿Querés cerrar el local?")
      if (!ok) return
    }
    setIsOpen((prev) => !prev)
  }

  function handleAccept(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "preparando" } : o))
    )
  }

  function handleReject(id: string) {
    const order = orders.find((o) => o.id === id)
    const ok = window.confirm(`¿Rechazar pedido #${order?.code}?`)
    if (!ok) return
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  function handleMarkReady(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "listo" } : o))
    )
  }

  function handleDelivered(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setCompletedCount((prev) => prev + 1)
  }

  const stats = [
    { label: "Pendientes", count: newOrders.length, color: "#F97316" },
    { label: "En prep", count: preparingOrders.length, color: "#3B82F6" },
    { label: "Entregados", count: completedCount, color: "#22C55E" },
  ]

  const sections = [
    {
      title: "Nuevos",
      color: "#F97316",
      orders: newOrders,
      emptyText: "😴 Sin pedidos nuevos",
    },
    {
      title: "En preparación",
      color: "#3B82F6",
      orders: preparingOrders,
      emptyText: "✅ Nada en preparación",
    },
    {
      title: "Listos",
      color: "#22C55E",
      orders: readyOrders,
      emptyText: "🛎️ Sin pedidos listos",
    },
  ]

  return (
    <div
      className="min-h-svh flex flex-col items-center"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Cafetería Pepe
            </h1>
            <button
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              onClick={() => router.push("/")}
            >
              Vista cliente
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Turno: 08:00 – 14:00
            </span>
            <VendorStatusToggle isOpen={isOpen} onToggle={handleToggle} />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-6">
          {/* Closed banner */}
          {!isOpen && (
            <div
              className="rounded-xl px-4 py-3 border"
              style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}
            >
              <p
                className="text-sm font-semibold text-center"
                style={{ color: "#92400E" }}
              >
                🔒 Local cerrado — no se reciben nuevos pedidos
              </p>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex gap-2">
            {stats.map(({ label, count, color }) => (
              <div
                key={label}
                className="flex-1 rounded-xl px-2 py-2 text-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <p className="text-lg font-black" style={{ color }}>
                  {count}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Order sections */}
          {sections.map(({ title, color, orders: sectionOrders, emptyText }) => (
            <section key={title}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h2
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color }}
                >
                  {title} ({sectionOrders.length})
                </h2>
              </div>
              <div className="space-y-3">
                {sectionOrders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onMarkReady={handleMarkReady}
                    onDelivered={handleDelivered}
                  />
                ))}
                {sectionOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {emptyText}
                  </p>
                )}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
