"use client"

import { cn } from "@/lib/utils"

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div
      className="flex gap-0 overflow-x-auto scrollbar-none border-b border-border/60 -mx-4 px-4"
      role="tablist"
      aria-label="Categorías de productos"
    >
      {categories.map((cat) => {
        const isActive = active === cat
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={cn(
              "shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap",
              isActive
                ? "border-current font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            style={isActive ? { color: "#F97316", borderColor: "#F97316" } : {}}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
