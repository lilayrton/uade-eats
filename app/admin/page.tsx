"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Building2, 
  TrendingUp, 
  Wallet, 
  ArrowLeftRight, 
  LogOut, 
  RefreshCw,
  AlertCircle,
  Banknote,
  Check,
  X
} from "lucide-react"
import { useApp } from "@/context/AppContext"
import { toast } from "sonner"

interface Store {
  id: string
  name: string
  platformDebt: number
  walletBalance: number
  isOpen: boolean
}

interface PlatformTransaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
  store?: { name: string }
}

interface PendingWithdrawal {
  id: string
  amount: number
  createdAt: string
  store: {
    name: string
    bankInfo: string | null
  }
}

interface AdminMetrics {
  totalServiceFeeGenerated: number
  totalPendingDebt: number
  liquidCash: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { state, dispatch } = useApp()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (state.user && state.user.role !== "admin") {
      router.replace("/")
      return
    }

    if (state.user?.role === "admin") {
      fetchData()
      const intervalId = setInterval(() => fetchData(true), 2000)
      return () => clearInterval(intervalId)
    }
  }, [state.user, router])

  const fetchData = async (isPolling = false) => {
    if (!isPolling) setLoading(true)
    try {
      const res = await fetch("/api/admin/metrics")
      const data = await res.json()
      if (data.success) {
        setMetrics(data.metrics)
        setStores(data.stores)
        setTransactions(data.transactions)
        setPendingWithdrawals(data.pendingWithdrawals || [])
      } else {
        if (!isPolling) toast.error(data.error || "Error al cargar métricas")
      }
    } catch (e) {
      console.error(e)
      if (!isPolling) toast.error("Error de conexión")
    } finally {
      if (!isPolling) setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    dispatch({ type: "LOGOUT" })
    router.replace("/login")
  }

  const handleProcessWithdrawal = async (txId: string, action: "approve" | "reject") => {
    const loadingToast = toast.loading(action === "approve" ? "Aprobando..." : "Rechazando...")
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, action })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(action === "approve" ? "Retiro marcado como completado" : "Retiro rechazado", { id: loadingToast })
        fetchData()
      } else {
        toast.error(data.error, { id: loadingToast })
      }
    } catch (e) {
      toast.error("Error al procesar", { id: loadingToast })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading || !metrics) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#0F172A]">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#0F172A] text-slate-200 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            UADE EATS <span className="text-[#F97316]">ADMIN</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Super Panel de Control</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-12">
        {/* KPIs */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-[#F97316]" size={20} />
            Métricas Globales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none text-white">
                <TrendingUp size={100} />
              </div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Ganancia Histórica</p>
              <h3 className="text-4xl font-black text-white">${metrics.totalServiceFeeGenerated.toLocaleString("es-AR")}</h3>
              <p className="text-xs text-slate-500 mt-2">Total generado por comisiones en la app.</p>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-900/50 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none text-blue-400">
                <Wallet size={100} />
              </div>
              <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Plata en Caja (Líquido)</p>
              <h3 className="text-4xl font-black text-blue-100">${metrics.liquidCash.toLocaleString("es-AR")}</h3>
              <p className="text-xs text-blue-300/50 mt-2">Dinero acreditado y disponible.</p>
            </div>

            <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none text-red-400">
                <AlertCircle size={100} />
              </div>
              <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Por Cobrar (Deuda)</p>
              <h3 className="text-4xl font-black text-red-100">${metrics.totalPendingDebt.toLocaleString("es-AR")}</h3>
              <p className="text-xs text-red-300/50 mt-2">Deuda pendiente de los locales (efectivo).</p>
            </div>
          </div>
        </section>

        {/* Retiros Pendientes */}
        {pendingWithdrawals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Banknote className="text-orange-500" size={20} />
              Retiros Pendientes de Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="bg-slate-800/50 border border-orange-500/30 p-5 rounded-3xl flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-white">${Math.abs(withdrawal.amount).toLocaleString("es-AR")}</h3>
                      <p className="text-sm font-bold text-slate-300 mt-1">{withdrawal.store.name}</p>
                      <p className="text-xs text-slate-400 mt-1">CVU/Alias: <span className="font-mono text-orange-400">{withdrawal.store.bankInfo || "No configurado"}</span></p>
                      <p className="text-[10px] text-slate-500 mt-2">{formatDate(withdrawal.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessWithdrawal(withdrawal.id, "reject")}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl text-xs transition-colors border border-red-500/20 flex items-center justify-center gap-1"
                    >
                      <X size={14} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleProcessWithdrawal(withdrawal.id, "approve")}
                      className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 font-bold rounded-xl text-xs transition-colors border border-green-500/20 flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Marcar Pagado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Locales */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="text-[#F97316]" size={20} />
            Estado de Locales
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Local</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Saldo Billetera</th>
                    <th className="px-6 py-4 text-right">Deuda con UADE Eats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No hay locales registrados.
                      </td>
                    </tr>
                  ) : (
                    stores.map(store => (
                      <tr key={store.id} className="hover:bg-slate-800/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{store.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${store.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                            {store.isOpen ? 'ABIERTO' : 'CERRADO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-400">
                          ${store.walletBalance.toLocaleString("es-AR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {store.platformDebt > 0 ? (
                            <span className="font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl">
                              ${store.platformDebt.toLocaleString("es-AR")}
                            </span>
                          ) : (
                            <span className="text-slate-500">$0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Últimas Transacciones */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ArrowLeftRight className="text-[#F97316]" size={20} />
            Registro de Movimientos (UADE Eats)
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden p-2 space-y-1">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Aún no hay movimientos registrados.
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-800/80 rounded-2xl transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'service_fee' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <ArrowLeftRight size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.store && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="font-semibold text-slate-300">{tx.store.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white">
                      +${tx.amount.toLocaleString("es-AR")}
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                      {tx.type === 'service_fee' ? 'Ingreso Bruto' : 'Cobro de Deuda'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
