"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { CategoryTabs } from "@/components/category-tabs"
import { BottomNav } from "@/components/bottom-nav"
import type { Product, Store } from "@/lib/types"
import { useApp } from "@/context/AppContext"
import { toast } from "sonner"

interface StorePageClientProps {
  storeData: Store
  storeProducts: Product[]
}

export default function StorePageClient({ storeData, storeProducts }: StorePageClientProps) {
  const router = useRouter()
  const { state, dispatch, cartCount } = useApp()
  const [activeNav, setActiveNav] = useState("home")
  const [pendingAddProduct, setPendingAddProduct] = useState<Product | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(storeProducts.map((p) => p.category.name))),
    [storeProducts]
  )

  const [activeCategory, setActiveCategory] = useState(categories[0] || "Bebidas")

  const visibleProducts = useMemo(
    () => storeProducts.filter((p) => p.category.name === activeCategory),
    [storeProducts, activeCategory]
  )

  const getQuantity = useCallback(
    (productId: string): number =>
      state.cart.items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [state.cart.items]
  )

  const cartTotal = state.cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  )

  const handleAdd = useCallback(
    (product: Product) => {
      if (!storeData.isOpen) {
        toast.error("El local está cerrado, no se pueden agregar productos.")
        return
      }
      if (state.cart.storeId !== null && state.cart.storeId !== storeData.id) {
        setPendingAddProduct(product)
        return
      }
      dispatch({ type: "ADD_TO_CART", payload: { product, storeId: storeData.id, storeName: storeData.name } })
    },
    [dispatch, storeData.id, storeData.name, state.cart.storeId, storeData.isOpen]
  )

  const handleRemove = useCallback(
    (product: Product) => {
      const qty = getQuantity(product.id)
      if (qty <= 1) {
        dispatch({ type: "REMOVE_FROM_CART", payload: { productId: product.id } })
      } else {
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId: product.id, quantity: qty - 1 } })
      }
    },
    [dispatch, getQuantity]
  )

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface)" }}>
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">

        {/* ── Sticky header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">

          {/* Back row */}
          <div className="flex items-center gap-3 px-4 pt-6 pb-3">
            <a
              href="/"
              aria-label="Volver al inicio"
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all duration-150 shrink-0"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </a>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-lg text-foreground leading-tight truncate">
                {storeData.name}
              </h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5 truncate">
                {storeData.tagline}
              </p>
            </div>
            {/* Open badge */}
            <span
              className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
              style={
                storeData.isOpen
                  ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                  : { backgroundColor: "#F3F4F6", color: "#6B7280" }
              }
            >
              {storeData.isOpen ? "Abierto" : "Cerrado"}
            </span>
          </div>

          {/* Category tabs */}
          <div className="px-4 pb-0">
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        </header>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-28">

          {/* Hero image */}
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={storeData.imageUrl}
              alt={`${storeData.name} — foto del local`}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 480px"
              priority
            />
            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          {/* Warning Banner */}
          {!storeData.isOpen && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
              <div className="shrink-0 mt-0.5 text-red-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">El local acaba de cerrar</h3>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Ya no se pueden hacer pedidos por ahora. Probá buscar otra opción disponible en la página principal.
                </p>
              </div>
            </div>
          )}

          {/* Product list */}
          <section className="px-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">{activeCategory}</h2>
              <span className="text-xs text-muted-foreground">
                {visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}
              </span>
            </div>

            <div className="space-y-3">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={getQuantity(product.id)}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </section>

          {/* Order summary strip — shown when cart has items */}
          {cartCount > 0 && (
            <div className="mx-4 mt-6">
              <button
                onClick={() => router.push("/cart")}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-bold shadow-lg active:scale-[0.98] transition-transform duration-150"
                style={{ backgroundColor: "#F97316" }}
                aria-label={`Ver carrito — ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <span className="text-sm">Ver carrito</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-90">
                    {cartCount} {cartCount === 1 ? "ítem" : "ítems"}
                  </span>
                  <span className="text-sm font-black">
                    ${cartTotal.toLocaleString("es-AR")}
                  </span>
                </div>
              </button>
            </div>
          )}
        </main>

        {/* ── Bottom navigation ────────────────────────────────────────── */}
        <BottomNav
          active={activeNav}
          onChange={(id) => {
            setActiveNav(id)
            if (id === "home") router.push("/")
            if (id === "cart") router.push("/cart")
            if (id === "orders") router.push("/orders")
            if (id === "wallet") router.push("/wallet")
            if (id === "profile") router.push("/profile")
          }}
          cartCount={cartCount}
        />
        {/* ── Custom Modal for Cart Collision ────────────────────────── */}
        {pendingAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-[320px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: "#FFF0E6" }}>
                <ShoppingBag size={24} color="#F97316" />
              </div>
              <h3 className="text-xl font-black text-center text-[#1C1917] mb-2">
                ¿Empezar de cero?
              </h3>
              <p className="text-sm text-center text-muted-foreground mb-6 leading-relaxed">
                Ya tenés un pedido armado en <span className="font-bold text-[#1C1917]">{state.cart.storeName}</span>. Si agregás esto, se descartará tu carrito actual.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    dispatch({ type: "ADD_TO_CART", payload: { product: pendingAddProduct, storeId: storeData.id, storeName: storeData.name } })
                    setPendingAddProduct(null)
                  }}
                  className="w-full py-3.5 rounded-2xl font-bold text-white active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: "#F97316" }}
                >
                  Sí, vaciar y agregar
                </button>
                <button
                  onClick={() => setPendingAddProduct(null)}
                  className="w-full py-3.5 rounded-2xl font-bold text-[#1C1917] bg-[#F3F4F6] hover:bg-[#E5E7EB] active:scale-[0.98] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
