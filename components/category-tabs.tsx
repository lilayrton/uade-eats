"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [categories])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="relative flex items-center -mx-4 px-4 border-b border-border/60 group">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-4 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border shadow-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Desplazar a la izquierda"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-0 overflow-x-auto scrollbar-none w-full"
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

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-4 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border shadow-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
