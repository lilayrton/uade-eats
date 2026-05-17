"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Star, Clock, ShoppingBag } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { CategoryTabs } from "@/components/category-tabs"
import { BottomNav } from "@/components/bottom-nav"
import type { Product } from "@/lib/types"
// TODO: replace with API call
import { MOCK_STORES, MOCK_PRODUCTS } from "@/lib/mock-data"
import { useApp } from "@/context/AppContext"

const STORE_ID = "store-1"

export default function StorePage() {
  const router = useRouter()
  const { state, dispatch, cartCount } = useApp()
  const [activeCategory, setActiveCategory] = useState("Bebidas")
  const [activeNav, setActiveNav] = useState("home")

  // TODO: replace with API call (fetch store by id)
  const storeData = MOCK_STORES.find((s) => s.id === STORE_ID)!
  // TODO: replace with API call (fetch products by storeId)
  const storeProducts = MOCK_PRODUCTS.filter((p) => p.storeId === STORE_ID)

  const categories = useMemo(
    () => Array.from(new Set(storeProducts.map((p) => p.category))),
    [storeProducts]
  )

  const visibleProducts = useMemo(
    () => storeProducts.filter((p) => p.category === activeCategory),
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
      dispatch({ type: "ADD_TO_CART", payload: { product, storeId: STORE_ID } })
    },
    [dispatch]
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

            {/* Meta chips over hero */}
            <div className="absolute bottom-3 left-4 flex items-center gap-3">
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Star size={11} fill="#F97316" stroke="none" />
                <span className="text-white text-xs font-bold">{storeData.rating}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Clock size={11} className="text-white/80" />
                <span className="text-white text-xs font-semibold">{storeData.estimatedWaitMinutes} min</span>
              </div>
            </div>
          </div>

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
            if (id === "profile") router.push("/profile")
          }}
          cartCount={cartCount}
        />
      </div>
    </div>
  )
}
