"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type OrderStatus = "nuevo" | "preparando" | "listo"

export interface OrderItem {
  name: string
  qty: number
}

export interface Order {
  id: string
  code: number
  status: OrderStatus
  student: string
  studentId: string
  payment: "MercadoPago" | "Efectivo"
  items: OrderItem[]
  total: number
  placedAt: number
}

interface VendorOrderCardProps {
  order: Order
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onMarkReady: (id: string) => void
  onDelivered: (id: string) => void
}

export function VendorOrderCard({
  order,
  onAccept,
  onReject,
  onMarkReady,
  onDelivered,
}: VendorOrderCardProps) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - order.placedAt) / 60000)
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - order.placedAt) / 60000))
    }, 30_000)
    return () => clearInterval(id)
  }, [order.placedAt])

  const isLate = elapsed > 8 && order.status !== "listo"

  return (
    <article
      role="article"
      className={cn(
        "relative rounded-2xl bg-card border border-border/60 overflow-hidden transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      {order.status === "nuevo" && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl animate-pulse"
          style={{ backgroundColor: "#F97316" }}
        />
      )}

      <div className="p-4 space-y-3">
        {/* Header: order code + elapsed */}
        <div className="flex items-center justify-between">
          <span className="font-black text-lg text-foreground">#{order.code}</span>
          <span
            className={cn("text-xs font-medium", !isLate && "text-muted-foreground")}
            style={isLate ? { color: "#EF4444" } : undefined}
          >
            hace {elapsed} min
          </span>
        </div>

        {/* Student info */}
        <div>
          <p className="font-semibold text-sm text-foreground">{order.student}</p>
          <p className="text-xs text-muted-foreground">{order.studentId}</p>
        </div>

        {/* Items list */}
        <ul className="space-y-0.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{item.name}</span>
              <span className="text-muted-foreground font-medium">×{item.qty}</span>
            </li>
          ))}
        </ul>

        {/* Footer: total + payment chip */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="font-bold text-foreground">
            ${order.total.toLocaleString("es-AR")}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{
              backgroundColor: order.payment === "MercadoPago" ? "#3B82F6" : "#22C55E",
            }}
          >
            {order.payment}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1 border-t border-border/40">
          {order.status === "nuevo" && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(order.id)}
                aria-label={`Aceptar pedido #${order.code}`}
              >
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onReject(order.id)}
                aria-label={`Rechazar pedido #${order.code}`}
                style={{ color: "#EF4444", borderColor: "#EF4444" }}
              >
                Rechazar
              </Button>
            </>
          )}
          {order.status === "preparando" && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onMarkReady(order.id)}
              aria-label={`Marcar listo pedido #${order.code}`}
              style={{ backgroundColor: "#22C55E", borderColor: "#22C55E" }}
            >
              Marcar listo
            </Button>
          )}
          {order.status === "listo" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-muted-foreground"
              onClick={() => onDelivered(order.id)}
              aria-label={`Marcar entregado pedido #${order.code}`}
            >
              Entregado
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
