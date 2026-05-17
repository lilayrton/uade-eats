"use client"

import { Search, SlidersHorizontal } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onFiltersClick?: () => void
  hasActiveFilters?: boolean
}

export function SearchBar({ value, onChange, onFiltersClick, hasActiveFilters }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={18}
        />
        <input
          type="search"
          placeholder="Buscar restaurantes, comidas..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          style={{ "--tw-ring-color": "#F97316" } as React.CSSProperties}
        />
      </div>
      <button
        onClick={onFiltersClick}
        className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors active:scale-95"
        aria-label="Filtros avanzados"
      >
        <SlidersHorizontal size={18} className="text-foreground" />
        {hasActiveFilters && (
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#F97316" }}
          />
        )}
      </button>
    </div>
  )
}
