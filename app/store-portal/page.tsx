"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  XCircle,
  Play,
  Check,
  PackageCheck,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/context/AppContext"

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled"

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: {
    name: string
    imageUrl: string
  }
}

interface Order {
  id: string
  userId: string
  storeId: string
  total: number
  status: OrderStatus
  paymentMethod: string
  pickupCode: number
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
  items: OrderItem[]
}

export default function StorePortalPage() {
  const router = useRouter()
  const { state } = useApp()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "preparing" | "ready">("all")

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true)
    try {
      const res = await fetch("/api/store-portal/orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error("Error al cargar pedidos", { description: data.error })
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión", { description: "Revisá tu red" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Check role client-side
  useEffect(() => {
    // If user is loaded and is not store owner, redirect
    if (state.user && state.user.role !== "store_owner") {
      router.replace("/")
      toast.error("Acceso denegado", { description: "Esta sección es solo para Comedores" })
    }
  }, [state.user, router])

  // Poll orders every 5 seconds for a dynamic, real-time feel
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => {
      fetchOrders(false)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch("/api/store-portal/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status })
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o))
        
        let msg = ""
        if (status === "preparing") msg = "¡Pedido puesto en preparación!"
        if (status === "ready") msg = "¡Pedido listo para retirar! Se notificó al estudiante."
        if (status === "completed") msg = "¡Pedido entregado con éxito!"
        if (status === "cancelled") msg = "Pedido cancelado."

        toast.success(msg, { duration: 3000 })
      } else {
        toast.error("Error al actualizar estado", { description: data.error })
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión al actualizar")
    }
  }

  // Filter orders
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "preparing" || o.status === "ready")
  const historicalOrders = orders.filter(o => o.status === "completed" || o.status === "cancelled")

  const filteredActiveOrders = activeOrders.filter(o => {
    if (selectedFilter === "all") return true
    return o.status === selectedFilter
  })

  // Calculate statistics (today's Completed orders total revenue & counts)
  const revenueToday = historicalOrders
    .filter(o => o.status === "completed" && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0)

  const pendingCount = activeOrders.filter(o => o.status === "pending").length
  const preparingCount = activeOrders.filter(o => o.status === "preparing").length
  const readyCount = activeOrders.filter(o => o.status === "ready").length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#F9F5F0]">
        <ChefHat className="animate-bounce" style={{ color: "#F97316" }} size={48} />
        <p className="mt-4 font-bold text-[#1C1917]">Cargando portal administrativo...</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface, #F9F5F0)" }}>
      <div className="w-full max-w-[1000px] min-h-svh flex flex-col bg-white shadow-lg relative border-x border-[#E5E7EB]">
        
        {/* ── Desktop/Tablet Header ── */}
        <header className="bg-white border-b border-[#F3F4F6] sticky top-0 z-40 px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/profile")}
                aria-label="Salir al perfil"
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F9F5F0] hover:bg-[#F3E8FF] text-[#1C1917] transition-colors active:scale-95"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-black text-[#1C1917]">Portal de Administración</h1>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">UADE EATS COMEDORES</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                Monitoreo en tiempo real
              </span>
              <button
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F3F4F6] text-muted-foreground hover:text-[#1C1917] active:scale-95 transition-transform"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* ── KPIs Bar ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {/* KPI 1 */}
            <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F97316]/10 text-[#F97316] shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider">Pendientes</p>
                <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{pendingCount}</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#16A34A]/10 text-[#16A34A] shrink-0">
                <ChefHat size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">Preparando</p>
                <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{preparingCount}</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2563EB]/10 text-[#2563EB] shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Listos</p>
                <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{readyCount}</p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600 shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Ventas Hoy</p>
                <p className="text-lg font-black text-[#1C1917] leading-none mt-1">
                  ${revenueToday.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Tab Switcher ── */}
          <div className="flex bg-[#F3F4F6] p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "active"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
              }`}
            >
              <ChefHat size={16} />
              Pedidos Activos
              <span className="bg-[#F97316] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {activeOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "completed"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
              }`}
            >
              <PackageCheck size={16} />
              Historial / Completados
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {historicalOrders.length}
              </span>
            </button>
          </div>
        </header>

        {/* ── Content Body ── */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Active Orders Section */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {/* Active Filter subbar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedFilter === "all"
                      ? "bg-[#1C1917] text-white border-[#1C1917]"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  Todos ({activeOrders.length})
                </button>
                <button
                  onClick={() => setSelectedFilter("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    selectedFilter === "pending"
                      ? "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5] font-black"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  Pendientes ({pendingCount})
                </button>
                <button
                  onClick={() => setSelectedFilter("preparing")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    selectedFilter === "preparing"
                      ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7] font-black"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  En preparación ({preparingCount})
                </button>
                <button
                  onClick={() => setSelectedFilter("ready")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    selectedFilter === "ready"
                      ? "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE] font-black"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  Listos para retirar ({readyCount})
                </button>
              </div>

              {filteredActiveOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#F9F5F0] rounded-3xl border border-dashed border-[#E5E7EB]">
                  <ShoppingBag size={48} className="text-muted-foreground/40 animate-pulse" />
                  <p className="mt-4 font-bold text-muted-foreground text-sm">No hay pedidos activos en este estado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActiveOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-3xl border border-[#F3F4F6] bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* State top accent strip */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{
                          backgroundColor:
                            order.status === "pending"
                              ? "#F97316"
                              : order.status === "preparing"
                              ? "#16A34A"
                              : "#2563EB"
                        }}
                      />

                      <div className="space-y-4">
                        {/* Order Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Pedido #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <h3 className="font-black text-[#1C1917] text-base mt-0.5 leading-none">
                              {order.user.name}
                            </h3>
                          </div>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full border"
                            style={{
                              backgroundColor:
                                order.status === "pending"
                                  ? "#FFF7ED"
                                  : order.status === "preparing"
                                  ? "#F0FDF4"
                                  : "#EFF6FF",
                              color:
                                order.status === "pending"
                                  ? "#F97316"
                                  : order.status === "preparing"
                                  ? "#16A34A"
                                  : "#2563EB",
                              borderColor:
                                order.status === "pending"
                                  ? "#FFEDD5"
                                  : order.status === "preparing"
                                  ? "#DCFCE7"
                                  : "#DBEAFE"
                            }}
                          >
                            {order.status === "pending" && "Pendiente"}
                            {order.status === "preparing" && "En preparación"}
                            {order.status === "ready" && "Listo para Retirar"}
                          </span>
                        </div>

                        {/* Order Items list */}
                        <div className="bg-[#F9F5F0]/65 p-3 rounded-2xl space-y-2 border border-black/5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-[#1C1917] font-semibold">
                                <span className="text-[#F97316] font-black mr-1">{item.quantity}x</span>{" "}
                                {item.product.name}
                              </span>
                              <span className="text-muted-foreground font-medium">
                                ${ (item.quantity * item.unitPrice).toLocaleString("es-AR") }
                              </span>
                            </div>
                          ))}
                          <div className="h-px bg-black/5 my-1" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">Total cobrado</span>
                            <span className="font-black text-[#F97316]">
                              ${order.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>

                        {/* Extra metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={12} />
                            Ingreso: {formatDate(order.createdAt)}
                          </span>
                          <span className="font-semibold uppercase tracking-wider text-[10px] bg-card border border-border px-2 py-0.5 rounded-lg">
                            {order.paymentMethod === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="mt-5 pt-4 border-t border-[#F3F4F6] flex items-center gap-2">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              className="flex-1 py-3 bg-[#16A34A] hover:bg-green-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Play size={14} className="fill-white" />
                              Preparar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "cancelled")}
                              className="px-3 py-3 border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 font-bold rounded-2xl text-xs transition-colors shrink-0"
                              title="Cancelar pedido"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}

                        {order.status === "preparing" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ready")}
                              className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Check size={14} strokeWidth={3} />
                              Marcar Listo
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "cancelled")}
                              className="px-3 py-3 border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 font-bold rounded-2xl text-xs transition-colors shrink-0"
                              title="Cancelar pedido"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}

                        {order.status === "ready" && (
                          <div className="w-full flex flex-col gap-3">
                            {/* Giant Pickup Code Box */}
                            <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-3 rounded-2xl text-center">
                              <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider block">Código de Retiro</span>
                              <span className="text-3xl font-black text-[#2563EB] tracking-widest">{order.pickupCode}</span>
                            </div>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                            >
                              <PackageCheck size={14} />
                              Completar / Entregar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historical / Completed Section */}
          {activeTab === "completed" && (
            <div className="space-y-4">
              {historicalOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#F9F5F0] rounded-3xl border border-dashed border-[#E5E7EB]">
                  <CheckCircle2 size={48} className="text-muted-foreground/40" />
                  <p className="mt-4 font-bold text-muted-foreground text-sm">No hay pedidos en el historial todavía</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historicalOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#F3F4F6] bg-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            order.status === "completed"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {order.status === "completed" ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <XCircle size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#1C1917] text-sm">{order.user.name}</h3>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ")}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                            Hora: {formatDate(order.createdAt)} | Total: ${order.total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {order.paymentMethod === "efectivo" ? "Efectivo" : "Tarjeta"}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            order.status === "completed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {order.status === "completed" ? "Entregado" : "Cancelado"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
        
        {/* Footer info */}
        <footer className="py-6 border-t border-[#F3F4F6] text-center bg-[#F9F5F0]">
          <p className="text-xs text-muted-foreground">UADE EATS COMEDORES · Panel de Control Oficial · v1.0</p>
        </footer>

      </div>
    </div>
  )
}
