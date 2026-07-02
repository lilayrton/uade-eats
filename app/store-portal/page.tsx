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
  AlertCircle,
  Play,
  Check,
  PackageCheck,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FolderOpen,
  Wallet,
  Banknote,
  Plus,
  User as UserIcon,
  Pencil,
  LogOut,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/context/AppContext"
import type { Order, OrderStatus } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  category?: Category
  imageUrl: string
}

interface StoreWalletTransaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
}

export default function StorePortalPage() {
  const router = useRouter()
  const { state, dispatch } = useApp()

  // Account widget state
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editedName, setEditedName] = useState(state.user?.name ?? "")
  const [nameLoading, setNameLoading] = useState(false)

  // Orders State
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "products" | "wallet">("active")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "preparing" | "ready">("all")
  const [isOpen, setIsOpen] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [storeWalletBalance, setStoreWalletBalance] = useState(0)
  const [platformDebt, setPlatformDebt] = useState(0)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [payDebtLoading, setPayDebtLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [bankInfo, setBankInfo] = useState("")
  const [isEditingBankInfo, setIsEditingBankInfo] = useState(false)
  const [bankInfoLoading, setBankInfoLoading] = useState(false)
  const [walletTransactions, setWalletTransactions] = useState<StoreWalletTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // Products State
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [customCategories, setCustomCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState("")
  const [renamingCat, setRenamingCat] = useState<Category | null>(null)
  const [renameInputVal, setRenameInputVal] = useState("")
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [showNewCatInput, setShowNewCatInput] = useState(false)
  const [newCatInputVal, setNewCatInputVal] = useState("")

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/store-portal/categories")
      const data = await res.json()
      if (data.success) {
        setCustomCategories(data.categories)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/store-portal/status?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        setIsOpen(data.isOpen)
        if (data.walletBalance !== undefined) setStoreWalletBalance(data.walletBalance)
        if (data.platformDebt !== undefined) setPlatformDebt(data.platformDebt)
        if (data.bankInfo !== undefined) setBankInfo(data.bankInfo || "")
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchStoreStatus()
  }, [fetchCategories, fetchStoreStatus])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error(e)
    }
    dispatch({ type: "LOGOUT" })
    router.push("/login")
  }

  const handleSaveName = async () => {
    const newName = editedName.trim()
    if (!newName) {
      toast.error("El nombre no puede estar vacío")
      return
    }
    if (newName === state.user?.name) {
      setShowAccountDialog(false)
      return
    }
    setNameLoading(true)
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      })
      const data = await res.json()
      if (data.success) {
        dispatch({ type: "SET_USER", payload: data.user })
        toast.success("Nombre actualizado ✓")
        setShowAccountDialog(false)
      } else {
        toast.error(data.error || "Error al guardar")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión")
    } finally {
      setNameLoading(false)
    }
  }

  // allCategories is now just the customCategories directly from DB
  const allCategories = customCategories

  // Product Form State
  const [prodName, setProdName] = useState("")
  const [prodPrice, setProdPrice] = useState("")
  const [prodCategory, setProdCategory] = useState("") // this will hold categoryId
  const [prodDescription, setProdDescription] = useState("")
  const [prodImageUrl, setProdImageUrl] = useState("")

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true)
    try {
      const res = await fetch("/api/store-portal/orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
        if (data.storeId) {
          setStoreId(data.storeId)
        }
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

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const res = await fetch(`/api/store-portal/products?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error("Error al cargar productos", { description: data.error })
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión", { description: "Revisá tu red" })
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const fetchWalletTransactions = useCallback(async () => {
    setTransactionsLoading(true)
    try {
      const res = await fetch(`/api/store-portal/wallet/transactions?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        setWalletTransactions(data.transactions)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTransactionsLoading(false)
    }
  }, [])

  const handlePayDebt = async () => {
    if (platformDebt <= 0) return
    if (storeWalletBalance < platformDebt) {
      toast.error("No tenés suficiente saldo en la billetera para pagar toda la deuda.")
      return
    }
    
    setPayDebtLoading(true)
    try {
      const res = await fetch("/api/store-portal/wallet/pay-debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: platformDebt })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchStoreStatus()
        fetchWalletTransactions()
      } else {
        toast.error(data.error || "Error al pagar deuda")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión")
    } finally {
      setPayDebtLoading(false)
    }
  }

  // Check role client-side
  useEffect(() => {
    if (state.user && state.user.role !== "store_owner") {
      router.replace("/")
      toast.error("Acceso denegado", { description: "Esta sección es solo para Comedores" })
    }
  }, [state.user, router])

  // Listen to SSE events for real-time Event-Driven updates
  useEffect(() => {
    fetchOrders()

    const eventSource = new EventSource("/api/sse")

    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data)
        if (type === "new_order" && storeId === data.storeId) {
          fetchOrders(false)
          toast.info("¡Nuevo pedido recibido! 🔔", { duration: 4000 })
        } else if (type === "order_updated") {
          if (data.order) {
            setOrders(prev => prev.map(o => o.id === data.orderId ? data.order : o))
          } else {
            fetchOrders(false)
          }
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
  }, [fetchOrders, storeId])

  // Fetch products when activeTab switches to products
  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts()
    }
    if (activeTab === "wallet") {
      fetchWalletTransactions()
    }
  }, [activeTab, fetchProducts, fetchWalletTransactions])

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const previousOrders = [...orders]
    
    // Delay artificial de 300ms para evitar saltos bruscos en la interfaz (UX)
    await new Promise(r => setTimeout(r, 300))
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))

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
        setOrders(previousOrders)
        toast.error("Error al actualizar estado", { description: data.error })
      }
    } catch (e) {
      setOrders(previousOrders)
      console.error(e)
      toast.error("Error de conexión al actualizar")
    }
  }

  // --- Product CRUD Actions ---
  const handleOpenProductModal = (product: Product | null = null) => {
    setShowNewCatInput(false)
    setNewCatInputVal("")
    if (product) {
      setEditingProduct(product)
      setProdName(product.name)
      setProdPrice(product.price.toString())
      setProdCategory(product.categoryId)
      setProdDescription(product.description)
      setProdImageUrl(product.imageUrl)
    } else {
      setEditingProduct(null)
      setProdName("")
      setProdPrice("")
      setProdCategory("")
      setProdDescription("")
      setProdImageUrl("")
    }
    setShowProductModal(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName.trim() || !prodPrice.trim() || !prodCategory.trim()) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    const payload = {
      id: editingProduct?.id,
      name: prodName,
      price: parseFloat(prodPrice),
      description: prodDescription,
      categoryId: prodCategory,
      imageUrl: prodImageUrl || "/images/placeholder.jpg"
    }

    try {
      const method = editingProduct ? "PUT" : "POST"
      const res = await fetch("/api/store-portal/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.success) {
        toast.success(editingProduct ? "Producto actualizado con éxito" : "Producto creado con éxito")
        setShowProductModal(false)
        fetchProducts()
      } else {
        toast.error("Error al guardar producto", { description: data.error })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión al guardar")
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto del menú?")) {
      return
    }

    try {
      const res = await fetch(`/api/store-portal/products?id=${productId}`, {
        method: "DELETE"
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Producto eliminado con éxito")
        setProducts(prev => prev.filter(p => p.id !== productId))
      } else {
        toast.error("Error al eliminar", { description: data.error })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión al eliminar")
    }
  }

  // Filter orders
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "preparing" || o.status === "ready")
  const historicalOrders = orders.filter(o => o.status === "completed" || o.status === "cancelled")

  const filteredActiveOrders = activeOrders.filter(o => {
    if (selectedFilter === "all") return true
    return o.status === selectedFilter
  })

  // Calculate statistics
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
        <header className="bg-white border-b border-[#F3F4F6] sticky top-0 z-40 px-3 md:px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F9F5F0] text-[#1C1917]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#1C1917]">Portal de Administración</h1>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">{state.user?.name || ""}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:flex text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                Monitoreo en tiempo real
              </span>
              {activeTab !== "products" && activeTab !== "wallet" && (
                <button
                  onClick={() => fetchOrders(true)}
                  disabled={refreshing}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F3F4F6] text-muted-foreground hover:text-[#1C1917] active:scale-95 transition-transform"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Cuenta"
                    className="flex items-center gap-1.5 h-10 pl-1.5 pr-2.5 rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1C1917] transition-colors active:scale-95"
                  >
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#F97316]/10 text-[#F97316] shrink-0">
                      <UserIcon size={14} />
                    </span>
                    <span className="hidden sm:block text-xs font-bold max-w-[100px] truncate">
                      {state.user?.name || "Cuenta"}
                    </span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-black">{state.user?.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setEditedName(state.user?.name ?? "")
                      setShowAccountDialog(true)
                    }}
                  >
                    <Pencil />
                    Editar nombre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Estado del local</span>
              <span className="text-xs text-muted-foreground">
                {isOpen ? "Abierto (recibiendo pedidos)" : "Cerrado"}
              </span>
            </div>
            <button
              onClick={async () => {
                setStatusLoading(true)
                const newStatus = !isOpen
                setIsOpen(newStatus)
                try {
                  const res = await fetch("/api/store-portal/status", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isOpen: newStatus })
                  })
                  const data = await res.json()
                  if (!data.success) {
                    setIsOpen(!newStatus)
                    toast.error("Error al actualizar estado")
                  } else {
                    toast.success(newStatus ? "Local abierto" : "Local cerrado")
                  }
                } catch (e) {
                  setIsOpen(!newStatus)
                  toast.error("Error de conexión")
                } finally {
                  setStatusLoading(false)
                }
              }}
              disabled={statusLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOpen ? "bg-[#F97316]" : "bg-muted-foreground/30"
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOpen ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
          {/* ── KPIs Bar (Hidden on Products and Wallet View) ── */}
          {activeTab !== "products" && activeTab !== "wallet" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F97316]/10 text-[#F97316] shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider">Pendientes</p>
                  <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{pendingCount}</p>
                </div>
              </div>

              <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#16A34A]/10 text-[#16A34A] shrink-0">
                  <ChefHat size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">Preparando</p>
                  <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{preparingCount}</p>
                </div>
              </div>

              <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2563EB]/10 text-[#2563EB] shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Listos</p>
                  <p className="text-xl font-black text-[#1C1917] leading-none mt-1">{readyCount}</p>
                </div>
              </div>

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
          )}

          {/* ── Main Tab Switcher ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-0 bg-[#F3F4F6] p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("active")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === "active"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
                }`}
            >
              <ChefHat size={14} />
              <span className="hidden sm:inline">Pedidos </span>Activos
              <span className="bg-[#F97316] text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                {activeOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === "completed"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
                }`}
            >
              <PackageCheck size={14} />
              Historial
              <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                {historicalOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === "products"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
                }`}
            >
              <FolderOpen size={14} />
              <span className="hidden sm:inline">Gestionar </span>Menú
              <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                {products.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === "wallet"
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-muted-foreground hover:text-[#1C1917]"
                }`}
            >
              <Wallet size={14} />
              Mi Billetera
            </button>
          </div>
        </header>

        {/* ── Content Body ── */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto space-y-6">

          {/* Active Orders Section */}
          {activeTab === "active" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedFilter === "all"
                      ? "bg-[#1C1917] text-white border-[#1C1917]"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                >
                  Todos ({activeOrders.length})
                </button>
                <button
                  onClick={() => setSelectedFilter("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${selectedFilter === "pending"
                      ? "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5] font-black"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                >
                  Pendientes ({pendingCount})
                </button>
                <button
                  onClick={() => setSelectedFilter("preparing")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${selectedFilter === "preparing"
                      ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7] font-black"
                      : "bg-[#F3F4F6] text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                >
                  En preparación ({preparingCount})
                </button>
                <button
                  onClick={() => setSelectedFilter("ready")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${selectedFilter === "ready"
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
                  <p className="mt-4 font-bold text-muted-foreground text-sm">No hay pedidos activos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActiveOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-3xl border border-[#F3F4F6] bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
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

                        <div className="bg-[#F9F5F0]/65 p-3 rounded-2xl space-y-2 border border-black/5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-[#1C1917] font-semibold">
                                <span className="text-[#F97316] font-black mr-1">{item.quantity}x</span>{" "}
                                {item.product.name}
                              </span>
                              <span className="text-muted-foreground font-medium">
                                ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
                              </span>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-2 bg-[#FFF7ED] border border-[#FFEDD5] p-2 rounded-xl text-xs text-[#C2410C]">
                              <span className="font-bold flex items-center gap-1 mb-0.5">
                                📝 Nota del cliente:
                              </span>
                              <span className="leading-tight block font-medium">{order.notes}</span>
                            </div>
                          )}
                          <div className="h-px bg-black/5 my-1" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">Total cobrado</span>
                            <span className="font-black text-[#F97316]">
                              ${order.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={12} />
                            Ingreso: {formatDate(order.createdAt)}
                          </span>
                          <span className="font-semibold uppercase tracking-wider text-[10px] bg-card border border-border px-2 py-0.5 rounded-lg">
                            {order.paymentMethod === "efectivo" ? "💵 Efectivo" : order.paymentMethod === "wallet" ? "💰 Wallet" : "💳 Tarjeta"}
                          </span>
                        </div>
                      </div>

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

          {/* Historical Orders Section */}
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
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${order.status === "completed"
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
                          {order.notes && (
                            <div className="mt-1.5 bg-[#FFF7ED] border border-[#FFEDD5] p-1.5 rounded-lg text-[10px] text-[#C2410C]">
                              <span className="font-bold flex items-center gap-1">
                                📝 Nota: {order.notes}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                            Hora: {formatDate(order.createdAt)} | Total: ${order.total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {order.paymentMethod === "efectivo" ? "Efectivo" : order.paymentMethod === "wallet" ? "Wallet" : "Tarjeta"}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === "completed"
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

          {/* Wallet Management Section */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              {/* Bank Info Card */}
              <div className="bg-card border border-border p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                    <Banknote className="text-blue-500" />
                    Datos Bancarios para Retiros
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurá tu CVU, CBU o Alias adonde enviaremos tu plata.
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex items-center gap-2">
                  <input 
                    type="text"
                    disabled={!isEditingBankInfo}
                    value={bankInfo}
                    onChange={(e) => setBankInfo(e.target.value)}
                    placeholder="Ej: milanesa.papas.mp"
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground disabled:opacity-70 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  {isEditingBankInfo ? (
                    <button
                      onClick={async () => {
                        setBankInfoLoading(true)
                        try {
                          const res = await fetch("/api/store-portal/wallet/bank-info", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ bankInfo })
                          })
                          const data = await res.json()
                          if (data.success) {
                            toast.success("Datos bancarios guardados correctamente")
                            setIsEditingBankInfo(false)
                          } else {
                            toast.error(data.error || "Error al guardar")
                          }
                        } catch (e) {
                          toast.error("Error de conexión")
                        } finally {
                          setBankInfoLoading(false)
                        }
                      }}
                      disabled={bankInfoLoading}
                      className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
                    >
                      {bankInfoLoading ? <RefreshCw className="animate-spin" size={20} /> : "Guardar"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingBankInfo(true)}
                      className="px-6 py-3 bg-[#F3F4F6] hover:bg-gray-200 text-[#1C1917] font-bold rounded-2xl transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {/* Debt and Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Balance Hero Card */}
                <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] p-8 rounded-3xl shadow-xl flex flex-col justify-between gap-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Wallet size={120} />
                  </div>
                  <div className="z-10">
                    <p className="text-orange-100 font-bold tracking-wider uppercase text-sm mb-2">Saldo Disponible</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-2">${storeWalletBalance.toLocaleString("es-AR")}</h2>
                    <p className="text-white/80 font-medium text-sm">
                      Dinero a favor por pedidos con Wallet.
                    </p>
                  </div>
                  <div className="z-10 mt-4">
                    <button
                      onClick={() => {
                        if (storeWalletBalance <= 0) {
                          toast.error("No tenés fondos suficientes para retirar.")
                          return
                        }
                        setShowWithdrawModal(true)
                      }}
                      disabled={withdrawLoading || storeWalletBalance <= 0}
                      className="w-full px-8 py-4 bg-white hover:bg-orange-50 text-[#EA580C] font-black rounded-2xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {withdrawLoading ? <RefreshCw className="animate-spin" size={20} /> : <Banknote size={20} />}
                      Retirar Dinero
                    </button>
                  </div>
                </div>

                {/* Platform Debt Card */}
                <div className={`p-8 rounded-3xl shadow-xl flex flex-col justify-between gap-6 text-white relative overflow-hidden ${platformDebt > 0 ? "bg-gradient-to-br from-rose-600 to-red-700" : "bg-gradient-to-br from-slate-600 to-slate-800"}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    {platformDebt > 0 ? <AlertCircle size={120} /> : <CheckCircle2 size={120} />}
                  </div>
                  <div className="z-10">
                    <p className={`font-bold tracking-wider uppercase text-sm mb-2 ${platformDebt > 0 ? "text-rose-200" : "text-slate-300"}`}>Deuda con la plataforma</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-2">${platformDebt.toLocaleString("es-AR")}</h2>
                    <p className={`font-medium text-sm ${platformDebt > 0 ? "text-rose-100" : "text-slate-400"}`}>
                      {platformDebt > 0 ? "Comisiones por cobros en efectivo (5%)." : "Sin deuda pendiente. ¡Estás al día con la plataforma!"}
                    </p>
                  </div>
                  <div className="z-10 mt-4">
                    <button
                      onClick={handlePayDebt}
                      disabled={payDebtLoading || platformDebt <= 0 || storeWalletBalance < platformDebt}
                      className={`w-full px-8 py-4 bg-white hover:bg-gray-50 font-black rounded-2xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${platformDebt > 0 ? "text-red-700 hover:bg-rose-50" : "text-slate-700"}`}
                    >
                      {payDebtLoading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      Pagar Deuda con Saldo Wallet
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet Historical Orders */}
              <div>
                <h3 className="text-base font-black text-[#1C1917] mb-4 flex items-center gap-2">
                  <Banknote className="text-blue-500" />
                  Movimientos de la Billetera
                </h3>
                
                {transactionsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-[#F9F5F0] rounded-3xl border border-dashed border-[#E5E7EB]">
                    <RefreshCw size={32} className="text-muted-foreground/40 animate-spin" />
                  </div>
                ) : walletTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-[#F9F5F0] rounded-3xl border border-dashed border-[#E5E7EB]">
                    <Wallet size={48} className="text-muted-foreground/40" />
                    <p className="mt-4 font-bold text-muted-foreground text-sm">Aún no hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {walletTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-2xl border border-[#F3F4F6] bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${tx.type === "payment_received" ? "bg-blue-50 text-blue-500 border-blue-100" : tx.type === "debt_payment" ? "bg-orange-50 text-orange-500 border-orange-100" : "bg-red-50 text-red-500 border-red-100"}`}>
                            <ArrowLeft className={tx.type === "payment_received" ? "rotate-[-135deg]" : "rotate-[45deg]"} size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#1C1917] text-sm">{tx.description || (tx.type === "payment_received" ? "Cobro de pedido" : tx.type === "debt_payment" ? "Pago de deuda" : "Retiro de fondos")}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Ref #{tx.id.slice(-6).toUpperCase()}</p>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                              {formatDate(tx.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-lg ${tx.type === "payment_received" ? "text-green-600" : "text-[#1C1917]"}`}>
                            {tx.type === "payment_received" ? "+" : ""}${Math.abs(tx.amount).toLocaleString("es-AR")}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${tx.type === "payment_received" ? "bg-green-50 text-green-600" : tx.type === "debt_payment" ? "bg-orange-50 text-orange-600" : tx.status === "pending" ? "bg-yellow-50 text-yellow-600" : tx.status === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                            {tx.type === "payment_received" ? "Ingreso" : tx.type === "debt_payment" ? "Deuda Pagada" : tx.status === "pending" ? "Retiro Pendiente" : tx.status === "rejected" ? "Rechazado" : "Retiro Completado"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu / Catalog Management Section */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {/* Product Header Buttons */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#1C1917]">Carta del Local</h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Edita y actualiza los platos de tu catálogo</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCategoriesModal(true)}
                    className="bg-[#F9F5F0] hover:bg-[#F3E8FF] border border-[#E5E7EB] text-[#1C1917] text-xs font-bold py-2.5 px-4 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <FolderOpen size={14} className="text-[#F97316]" />
                    Categorías
                  </button>
                  <button
                    onClick={() => handleOpenProductModal(null)}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold py-2.5 px-4 rounded-2xl flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                  >
                    <Plus size={14} />
                    Agregar Plato
                  </button>
                </div>
              </div>

              {productsLoading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <RefreshCw className="animate-spin text-muted-foreground" size={24} />
                  <p className="text-xs text-muted-foreground font-bold mt-2">Cargando catálogo...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#F9F5F0] rounded-3xl border border-dashed border-[#E5E7EB]">
                  <ImageIcon size={48} className="text-muted-foreground/30" />
                  <p className="mt-4 font-bold text-muted-foreground text-sm">Tu menú no tiene productos</p>
                  <p className="text-xs text-muted-foreground mt-1">Crea tu primer producto con el botón "Agregar Plato"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-[#F3F4F6] bg-card p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-border/40 relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/placeholder.jpg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-[#F3F4F6]">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <span className="absolute top-1 left-1 text-[9px] font-black uppercase bg-[#F97316] text-white px-1.5 py-0.5 rounded-lg shadow-sm">
                          {product.category?.name || "Sin categoría"}
                        </span>
                      </div>

                      {/* Product Content Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-black text-sm text-[#1C1917] leading-tight truncate">
                              {product.name}
                            </h3>
                            <span className="text-sm font-black text-[#F97316] shrink-0">
                              ${product.price.toLocaleString("es-AR")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {product.description || "Sin descripción."}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#F3F4F6]">
                          <button
                            onClick={() => handleOpenProductModal(product)}
                            className="flex-1 py-1.5 bg-[#F9F5F0] hover:bg-[#F3F4F6] text-[#1C1917] rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-[#E5E7EB]"
                          >
                            <Edit2 size={10} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-2.5 py-1.5 border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-[10px] font-bold flex items-center justify-center transition-colors"
                            title="Eliminar del menú"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
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
          <p className="text-xs text-muted-foreground">UADE EATS · Panel de Control · v1.0</p>
        </footer>

      </div>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#1C1917] text-base leading-none">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Completa los datos del plato</p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F3F4F6] text-muted-foreground hover:text-foreground hover:bg-[#E5E7EB] transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917]">Nombre del Plato *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Ej. Milanese con puré"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Product Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917]">Precio (ARS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="12500"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                  />
                </div>

                {/* Product Category */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1C1917]">Categoría *</label>
                    {!showNewCatInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(true)}
                        className="text-[10px] text-[#F97316] hover:text-[#EA580C] font-bold transition-colors"
                      >
                        + Crear nueva
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCatInput(false)
                          setNewCatInputVal("")
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {showNewCatInput ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nueva categoría..."
                        value={newCatInputVal}
                        onChange={(e) => setNewCatInputVal(e.target.value)}
                        className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const val = newCatInputVal.trim()
                          if (!val) return

                          const existingCat = allCategories.find(c => c.name.toLowerCase() === val.toLowerCase())
                          if (existingCat) {
                            setProdCategory(existingCat.id)
                            setShowNewCatInput(false)
                            setNewCatInputVal("")
                            return
                          }

                          const loadingToast = toast.loading("Creando categoría...")
                          try {
                            const res = await fetch("/api/store-portal/categories", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "create", name: val })
                            })
                            const data = await res.json()
                            if (data.success) {
                              setCustomCategories(prev => [...prev, data.category])
                              setProdCategory(data.category.id)
                              setShowNewCatInput(false)
                              setNewCatInputVal("")
                              toast.success(`Categoría "${val}" creada y seleccionada 🎉`, { id: loadingToast })
                            } else {
                              toast.error(data.error, { id: loadingToast })
                            }
                          } catch (e) {
                            console.error(e)
                            toast.error("Error de red", { id: loadingToast })
                          }
                        }}
                        className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold px-3 py-2 rounded-2xl transition-colors active:scale-95 shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                    >
                      <option value="">Selecciona una categoría...</option>
                      {allCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Product Image Upload & URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917] block">Imagen del Plato</label>
                <div className="flex items-center gap-3">
                  {/* Image Preview */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] shrink-0 flex items-center justify-center relative">
                    {prodImageUrl ? (
                      <img
                        src={prodImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* File Upload Trigger */}
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-[#F9F5F0] hover:bg-[#F3E8FF] border border-[#E5E7EB] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#1C1917] transition-colors flex items-center gap-1.5 active:scale-95">
                        <Plus size={14} />
                        Elegir archivo local
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            // Set loading state or toast
                            const loadingToast = toast.loading("Subiendo imagen...")

                            try {
                              const formData = new FormData()
                              formData.append("file", file)

                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              })
                              const data = await res.json()

                              if (data.success) {
                                setProdImageUrl(data.url)
                                toast.success("¡Imagen subida con éxito! 🎉", { id: loadingToast })
                              } else {
                                toast.error("Error al subir", { description: data.error, id: loadingToast })
                              }
                            } catch (err) {
                              console.error(err)
                              toast.error("Error de red al subir la imagen", { id: loadingToast })
                            }
                          }}
                        />
                      </label>
                      {prodImageUrl && (
                        <button
                          type="button"
                          onClick={() => setProdImageUrl("")}
                          className="px-3 py-2.5 border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-bold transition-colors"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    {/* Manual input option as a small collapse / option */}
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="O pega una URL externa aquí..."
                      className="w-full rounded-2xl border border-border bg-card px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917]">Descripción</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Detalla los ingredientes o especificaciones..."
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors resize-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-[#F3F4F6] flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1C1917] font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-2xl text-xs transition-colors shadow-md"
                >
                  Guardar Plato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CATEGORIES MODAL --- */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#1C1917] text-base leading-none">Gestionar Categorías</h3>
                <p className="text-xs text-muted-foreground mt-1">Agrega, edita o elimina las categorías de tu menú</p>
              </div>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F3F4F6] text-muted-foreground hover:text-foreground hover:bg-[#E5E7EB] transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Category */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva categoría..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                />
                <button
                  onClick={async () => {
                    const name = newCatName.trim()
                    if (!name) return

                    const existingCat = allCategories.find(c => c.name.toLowerCase() === name.toLowerCase())
                    if (existingCat) {
                      toast.error("La categoría ya existe")
                      return
                    }

                    const loadingToast = toast.loading("Creando categoría...")
                    try {
                      const res = await fetch("/api/store-portal/categories", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "create", name })
                      })
                      const data = await res.json()
                      if (data.success) {
                        setCustomCategories(prev => [...prev, data.category])
                        setNewCatName("")
                        toast.success(`Categoría "${name}" agregada 🎉`, { id: loadingToast })
                      } else {
                        toast.error(data.error, { id: loadingToast })
                      }
                    } catch (e) {
                      console.error(e)
                      toast.error("Error de red", { id: loadingToast })
                    }
                  }}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold py-2.5 px-4 rounded-2xl transition-colors active:scale-95 shrink-0"
                >
                  Agregar
                </button>
              </div>

              {/* List of active categories */}
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {allCategories.map((cat) => {
                  const prodCount = products.filter(p => p.categoryId === cat.id).length
                  const isRenaming = renamingCat?.id === cat.id
                  const isDeleting = deletingCat?.id === cat.id

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-[#F3F4F6] bg-[#F9F5F0] hover:bg-[#F3E8FF]/30 transition-all duration-200"
                    >
                      {isRenaming ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={renameInputVal}
                            onChange={(e) => setRenameInputVal(e.target.value)}
                            className="flex-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              const val = renameInputVal.trim()
                              if (!val || val === cat.name) {
                                setRenamingCat(null)
                                return
                              }
                              const load = toast.loading("Renombrando categoría...")
                              try {
                                const res = await fetch("/api/store-portal/categories", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "rename",
                                    id: cat.id,
                                    newName: val
                                  })
                                })
                                const data = await res.json()
                                if (data.success) {
                                  setCustomCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: val } : c))
                                  toast.success("Categoría renombrada con éxito 🎉", { id: load })
                                  fetchProducts()
                                  setRenamingCat(null)
                                } else {
                                  toast.error(data.error, { id: load })
                                }
                              } catch (e) {
                                console.error(e)
                                toast.error("Error de red", { id: load })
                              }
                            }}
                            className="p-1.5 bg-[#F97316] text-white hover:bg-[#EA580C] rounded-lg transition-colors active:scale-95"
                            title="Guardar"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setRenamingCat(null)}
                            className="p-1.5 bg-[#F3F4F6] text-muted-foreground hover:bg-[#E5E7EB] rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div className="flex-1 flex items-center justify-between gap-2 bg-red-50/50 p-1.5 rounded-xl animate-in fade-in duration-200">
                          <span className="text-[10px] text-red-600 font-bold leading-tight">¿Eliminar categoría permanentemente?</span>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={async () => {
                                const load = toast.loading("Eliminando categoría...")
                                try {
                                  const res = await fetch("/api/store-portal/categories", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "delete",
                                      id: cat.id
                                    })
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    setCustomCategories(prev => prev.filter(c => c.id !== cat.id))
                                    toast.success("Categoría eliminada", { id: load })
                                    fetchProducts()
                                    setDeletingCat(null)
                                  } else {
                                    toast.error(data.error, { id: load })
                                  }
                                } catch (e) {
                                  console.error(e)
                                  toast.error("Error al eliminar", { id: load, description: "Revisá tu conexión" })
                                }
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded-lg text-[9px] font-bold hover:bg-red-600 transition-colors"
                            >
                              Sí, borrar
                            </button>
                            <button
                              onClick={() => setDeletingCat(null)}
                              className="px-2 py-1 bg-[#F3F4F6] text-muted-foreground rounded-lg text-[9px] font-bold hover:bg-[#E5E7EB] transition-colors"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1C1917] text-xs">{cat.name}</span>
                            <span className="text-[10px] bg-white text-muted-foreground border px-2 py-0.5 rounded-full font-bold">
                              {prodCount} {prodCount === 1 ? "plato" : "platos"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Rename */}
                            <button
                              onClick={() => {
                                setRenamingCat(cat)
                                setRenameInputVal(cat.name)
                              }}
                              className="p-1.5 hover:bg-white rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                              title="Renombrar categoría"
                            >
                              <Edit2 size={12} />
                            </button>

                            {/* Delete / Reset */}
                            <button
                              onClick={() => {
                                setDeletingCat(cat)
                              }}
                              className="p-1.5 hover:bg-white rounded-lg text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar categoría"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#F97316] mb-4">
                <Banknote size={32} />
              </div>
              <h2 className="text-2xl font-black text-[#1C1917] mb-2">Confirmar Retiro</h2>
              <p className="text-muted-foreground font-medium mb-6">
                ¿Estás seguro de que querés transferir <span className="font-bold text-[#1C1917]">${storeWalletBalance.toLocaleString("es-AR")}</span> a tu cuenta bancaria? 
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawLoading}
                  className="flex-1 py-3 bg-[#F3F4F6] hover:bg-gray-200 text-muted-foreground font-bold rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setWithdrawLoading(true)
                    try {
                      const res = await fetch("/api/store-portal/wallet/withdraw", { method: "POST" })
                      const data = await res.json()
                      if (data.success) {
                        toast.success("¡Retiro exitoso! La plata llegará pronto a tu cuenta.")
                        setStoreWalletBalance(0)
                        setShowWithdrawModal(false)
                        fetchWalletTransactions()
                      } else {
                        toast.error(data.error || "Error al procesar el retiro")
                      }
                    } catch (e) {
                      toast.error("Error de conexión")
                    } finally {
                      setWithdrawLoading(false)
                    }
                  }}
                  disabled={withdrawLoading}
                  className="flex-1 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {withdrawLoading ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                  Sí, Retirar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar nombre</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
            placeholder="Nombre completo"
          />
          <DialogFooter>
            <button
              onClick={handleSaveName}
              disabled={nameLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
              style={{ backgroundColor: "#F97316" }}
            >
              {nameLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
