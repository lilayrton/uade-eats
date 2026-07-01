"use client"

import { cn } from "@/lib/utils"

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "pasteleria", label: "Pastelerías" },
  { id: "buffet", label: "Buffet" },
]

interface FilterChipsProps {
  active: string
  onChange: (id: string) => void
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
      {FILTERS.map((filter) => {
        const isActive = active === filter.id
        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 active:scale-95",
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
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
