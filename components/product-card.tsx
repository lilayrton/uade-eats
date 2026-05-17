"use client"

import Image from "next/image"
import { Plus, Minus } from "lucide-react"
import type { Product } from "@/lib/types"

export type { Product }

interface ProductCardProps {
  product: Product
  quantity: number
  onAdd: (product: Product) => void
  onRemove: (product: Product) => void
}

export function ProductCard({ product, quantity, onAdd, onRemove }: ProductCardProps) {
  const hasItem = quantity > 0

  return (
    <div className="flex items-center gap-4 bg-card rounded-2xl p-3 shadow-sm border border-border/50">
      {/* Thumbnail */}
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-bold text-foreground text-sm leading-tight truncate">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <p className="font-black text-sm mt-1.5" style={{ color: "#F97316" }}>
          ${product.price.toLocaleString("es-AR")}
        </p>
      </div>

      {/* Add / counter control */}
      <div className="shrink-0">
        {!hasItem ? (
          <button
            onClick={() => onAdd(product)}
            aria-label={`Agregar ${product.name}`}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform duration-150"
            style={{ backgroundColor: "#F97316" }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemove(product)}
              aria-label={`Quitar ${product.name}`}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center active:scale-95 transition-transform duration-150"
              style={{ borderColor: "#F97316", color: "#F97316" }}
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span
              className="w-5 text-center text-sm font-black"
              style={{ color: "#F97316" }}
            >
              {quantity}
            </span>
            <button
              onClick={() => onAdd(product)}
              aria-label={`Agregar otro ${product.name}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform duration-150"
              style={{ backgroundColor: "#F97316" }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
