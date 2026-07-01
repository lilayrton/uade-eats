"use client"

import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "pasteleria", label: "Pastelerías" },
  { id: "buffet", label: "Buffet" },
]

interface FilterModalProps {
  open: boolean
  onClose: () => void
  activeFilter: string
  onFilterChange: (id: string) => void
  onlyOpen: boolean
  onOnlyOpenChange: (v: boolean) => void
  onReset: () => void
}

export function FilterModal({
  open,
  onClose,
  activeFilter,
  onFilterChange,
  onlyOpen,
  onOnlyOpenChange,
  onReset,
}: FilterModalProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-background rounded-t-2xl shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1" />

        {/* Title */}
        <div className="px-4 py-3">
          <span className="text-base font-bold text-foreground">Filtrar locales</span>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pb-2">
          {/* Category section */}
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeFilter === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => onFilterChange(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 active:scale-95",
                      isActive
                        ? "text-white border-transparent"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: "#F97316", borderColor: "#F97316" }
                        : {}
                    }
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estado section */}
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Estado
            </p>
            <div className="flex gap-2">
              {[
                { label: "Todos", value: false },
                { label: "Abiertos ahora", value: true },
              ].map(({ label, value }) => {
                const isActive = onlyOpen === value
                return (
                  <button
                    key={label}
                    onClick={() => onOnlyOpenChange(value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 active:scale-95",
                      isActive
                        ? "text-white border-transparent"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: "#F97316", borderColor: "#F97316" }
                        : {}
                    }
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-border px-4 py-3 flex gap-3">
          <button
            onClick={() => {
              onReset()
              onClose()
            }}
            className="flex-1 border border-border bg-background text-foreground rounded-xl py-3 font-semibold text-sm transition-colors hover:bg-muted active:scale-95"
          >
            Limpiar filtros
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-semibold text-sm text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#F97316" }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  )
}
