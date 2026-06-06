"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bell, MapPin } from "lucide-react"
import { StoreCard } from "@/components/store-card"
import { FilterChips } from "@/components/filter-chips"
import { BottomNav } from "@/components/bottom-nav"
import { SearchBar } from "@/components/search-bar"
import { NotificationsPanel } from "@/components/notifications-panel"
import { FilterModal } from "@/components/filter-modal"
import { Store, Product } from "@/lib/types"
import { useApp } from "@/context/AppContext"

export interface GlobalProduct extends Product {
  storeName: string
}

const CATEGORY_DISPLAY: Record<string, string> = {
  cafeteria: "Cafetería",
  pasteleria: "Pastelería",
  buffet: "Buffet",
  kiosco: "Kiosco",
}

interface HomePageProps {
  stores: Store[]
  allProducts: GlobalProduct[]
}

export default function HomePageClient({ stores, allProducts }: HomePageProps) {
  const router = useRouter()
  const { cartCount, state, dispatch } = useApp()
  const { notifications } = state

  const [activeFilter, setActiveFilter] = useState("all")
  const [activeNav, setActiveNav] = useState("home")
  const [search, setSearch] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"relevance" | "wait" | "rating">("relevance")

  const unreadCount = notifications.filter((n) => !n.read).length
  const hasActiveFilters = onlyOpen || sortBy !== "relevance"

  const filteredStores = useMemo(() => {
    const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    let result = stores.filter((store) => {
      const matchFilter = activeFilter === "all" || store.category === activeFilter
      const matchSearch =
        normalizedSearch.trim() === "" ||
        store.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch) ||
        store.tagline.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch)
      const matchOpen = !onlyOpen || store.isOpen
      return matchFilter && matchSearch && matchOpen
    })

    if (sortBy === "wait") {
      result = [...result].sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes)
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [activeFilter, search, onlyOpen, sortBy, stores])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    if (normalizedSearch.trim() === "") return []
    return allProducts.filter(p => 
      p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch) ||
      p.description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch) ||
      p.category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch)
    )
  }, [search, allProducts])

  const openCount = filteredStores.filter((s) => s.isOpen).length

  const hour = new Date().getHours()
  let greeting = "Buenas noches"
  if (hour >= 7 && hour < 12) {
    greeting = "Buen día"
  } else if (hour >= 12 && hour < 19) {
    greeting = "Buenas tardes"
  }
  const firstName = state.user?.name ? state.user.name.split(" ")[0] : ""

  return (
    <div className="min-h-svh flex flex-col items-center" style={{ backgroundColor: "var(--brand-surface)" }}>
      {/* Mobile container */}
      <div className="w-full max-w-[480px] min-h-svh flex flex-col bg-background relative">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-6 pb-4 space-y-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-0.5">
                <MapPin size={12} style={{ color: "#F97316" }} />
                <span>UADE — Sede Lima</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
                UADE{" "}
                <span style={{ color: "#F97316" }} className="font-black">
                  EATS
                </span>
              </h1>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={18} className="text-foreground" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-2 right-2 min-w-[8px] h-2 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {unreadCount >= 2 && (
                    <span className="text-white leading-none" style={{ fontSize: "9px", paddingInline: "2px" }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>

          {/* Greeting */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed" suppressHydrationWarning>
              {greeting}{firstName ? `, ${firstName}` : ""} 👋 &nbsp;¿Qué vas a pedir hoy?
            </p>
          </div>

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            onFiltersClick={() => setShowFilters(true)}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Filter chips */}
          <FilterChips active={activeFilter} onChange={setActiveFilter} />
        </header>

        {/* ── Store list ── */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
          {search.trim() !== "" ? (
            <div className="space-y-6">
              {filteredProducts.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-foreground mb-3">
                    Productos ({filteredProducts.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => router.push(`/store/${product.storeId}`)}
                        className="w-full bg-card rounded-2xl border border-border p-3 flex gap-4 text-left hover:bg-muted/30 active:scale-[0.98] transition-all"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-sm text-foreground truncate">{product.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{product.storeName}</p>
                          <p className="text-sm font-black text-[#F97316] mt-1">${product.price.toLocaleString("es-AR")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {filteredStores.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-foreground mb-3">
                    Locales ({filteredStores.length})
                  </h2>
                  <div className="space-y-4">
                    {filteredStores.map((store) => (
                      <StoreCard key={store.id} store={store} />
                    ))}
                  </div>
                </section>
              )}

              {filteredProducts.length === 0 && filteredStores.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                    style={{ backgroundColor: "#FFF0E6" }}
                  >
                    🔍
                  </div>
                  <p className="font-semibold text-foreground">Sin resultados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Probá con otro nombre o categoría
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Section label */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">
                  {activeFilter === "all" ? "Locales disponibles" : `Locales · ${CATEGORY_DISPLAY[activeFilter] ?? activeFilter}`}
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  {openCount} abierto{openCount !== 1 ? "s" : ""}
                </span>
              </div>

              {filteredStores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                    style={{ backgroundColor: "#FFF0E6" }}
                  >
                    🔍
                  </div>
                  <p className="font-semibold text-foreground">Sin resultados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Probá con otro nombre o categoría
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}

              {/* Promo banner */}
              <div
                className="mt-6 rounded-2xl p-4 flex items-center gap-4 overflow-hidden relative"
                style={{ backgroundColor: "#F97316" }}
              >
                <div className="flex-1">
                  <p className="text-white font-bold text-base leading-tight text-balance">
                    ¡Primera orden gratis!
                  </p>
                  <p className="text-orange-100 text-xs mt-1 leading-relaxed">
                    Usá el código <span className="font-bold text-white">UADE2026</span> en tu primer pedido
                  </p>
                </div>
                <div className="text-4xl shrink-0">🎉</div>
              </div>
            </>
          )}
        </main>

        {/* ── Bottom Navigation ── */}
        <BottomNav
          active={activeNav}
          onChange={(id) => {
            setActiveNav(id)
            if (id === "cart") router.push("/cart")
            if (id === "orders") router.push("/orders")
            if (id === "profile") router.push("/profile")
          }}
          cartCount={cartCount}
        />
      </div>

      {/* ── Notifications Panel ── */}
      <NotificationsPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={(id) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: { id } })}
        onMarkAllRead={() => dispatch({ type: "MARK_ALL_READ" })}
      />

      {/* ── Filter Modal ── */}
      <FilterModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={() => {
          setActiveFilter("all")
          setOnlyOpen(false)
          setSortBy("relevance")
        }}
      />
    </div>
  )
}
