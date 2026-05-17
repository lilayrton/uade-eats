"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, ChevronRight, Info } from "lucide-react"
import { CartItem } from "@/components/cart-item"
import { CartEmpty } from "@/components/cart-empty"
import { BottomNav } from "@/components/bottom-nav"
import type { Product } from "@/lib/types"
// TODO: replace with API call
import { MOCK_STORES } from "@/lib/mock-data"
import { useApp } from "@/context/AppContext"

export default function CartPage() {
  const router = useRouter()
  const { state, dispatch, cartCount } = useApp()
  const [activeNav, setActiveNav] = useState("cart")

  const cartItems = state.cart.items
  const storeName = state.cart.storeId
    ? (MOCK_STORES.find((s) => s.id === state.cart.storeId)?.name ?? "")
    : ""
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  )
  const isEmpty = cartItems.length === 0

  const handleAdd = useCallback(
    (product: Product) => {
      if (!state.cart.storeId) return
      dispatch({ type: "ADD_TO_CART", payload: { product, storeId: state.cart.storeId } })
    },
    [dispatch, state.cart.storeId]
  )

  const handleRemove = useCallback(
    (product: Product) => {
      const item = cartItems.find((i) => i.product.id === product.id)
      const qty = item?.quantity ?? 0
      if (qty <= 1) {
        dispatch({ type: "REMOVE_FROM_CART", payload: { productId: product.id } })
      } else {
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId: product.id, quantity: qty - 1 } })
      }
    },
    [dispatch, cartItems]
  )

  const handleDelete = useCallback(
    (product: Product) => {
      dispatch({ type: "REMOVE_FROM_CART", payload: { productId: product.id } })
    },
    [dispatch]
  )

  const handleConfirm = () => {
    dispatch({
      type: "PLACE_ORDER",
      payload: { storeName, paymentMethod: "efectivo" },
    })
    router.push("/checkout")
  }

  return (
    <div
      className="min-h-svh flex flex-col items-center"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">

        {/* ── Sticky header ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4">
          {/* Back row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Volver"
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all duration-150 shrink-0"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-black text-xl text-foreground leading-tight">
                Tu pedido
              </h1>
              {!isEmpty && storeName && (
                <button
                  onClick={() => router.push("/store")}
                  className="flex items-center gap-1 mt-0.5 group"
                  aria-label={`Ver ${storeName}`}
                >
                  <Store size={11} style={{ color: "#F97316" }} />
                  <span className="text-xs text-muted-foreground group-hover:underline leading-none">
                    {storeName}
                  </span>
                  <ChevronRight size={11} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {!isEmpty && (
              <span
                className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "#F97316" }}
              >
                {cartCount} {cartCount === 1 ? "ítem" : "ítems"}
              </span>
            )}
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        {isEmpty ? (
          <CartEmpty onBrowse={() => router.push("/")} />
        ) : (
          <>
            <main className="flex-1 overflow-y-auto pb-[272px]">
              {/* Swipe hint */}
              <div className="flex items-center gap-1.5 mx-4 mt-4 mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFF0E6" }}>
                <Info size={13} style={{ color: "#F97316" }} />
                <p className="text-xs font-medium" style={{ color: "#C2410C" }}>
                  Deslizá hacia la izquierda para eliminar un producto
                </p>
              </div>

              {/* Cart item list */}
              <section className="px-4 space-y-3" aria-label="Productos en el carrito">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.product.id}
                    product={item.product}
                    quantity={item.quantity}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onDelete={handleDelete}
                  />
                ))}
              </section>

              {/* Order notes */}
              <div className="mx-4 mt-5">
                <label
                  htmlFor="cart-notes"
                  className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2"
                >
                  Nota para el local
                </label>
                <textarea
                  id="cart-notes"
                  rows={2}
                  placeholder="Ej: sin azúcar, sin cebolla…"
                  className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 leading-relaxed"
                  style={{ "--tw-ring-color": "#F97316" } as React.CSSProperties}
                />
              </div>
            </main>

            {/* ── Fixed bottom: subtotal + CTA ──────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-card border-t border-border/60 px-4 pt-4 pb-2">
              {/* Subtotal rows */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({cartCount} {cartCount === 1 ? "ítem" : "ítems"})
                  </span>
                  <span className="font-semibold text-foreground">
                    ${subtotal.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Costo de servicio</span>
                  <span
                    className="font-semibold text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
                  >
                    Gratis
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-black text-foreground text-base">Total</span>
                  <span className="font-black text-foreground text-xl">
                    ${subtotal.toLocaleString("es-AR")}
                    <span className="text-xs font-medium text-muted-foreground ml-1">ARS</span>
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-white font-bold shadow-lg active:scale-[0.98] transition-transform duration-150"
                style={{ backgroundColor: "#F97316" }}
                aria-label="Confirmar pedido"
              >
                <span className="text-base">Confirmar pedido</span>
                <span className="text-base font-black">
                  ${subtotal.toLocaleString("es-AR")}
                </span>
              </button>

              {/* Bottom nav spacing */}
              <div className="h-20" />
            </div>
          </>
        )}

        {/* ── Bottom navigation ────────────────────────────────────────── */}
        <BottomNav
          active={activeNav}
          onChange={(id) => {
            setActiveNav(id)
            if (id === "home") router.push("/")
            if (id === "orders") router.push("/orders")
            if (id === "profile") router.push("/profile")
          }}
          cartCount={cartCount}
        />
      </div>
    </div>
  )
}
