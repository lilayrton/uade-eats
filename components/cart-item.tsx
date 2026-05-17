"use client"

import { useRef, useState, useCallback } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/components/product-card"

interface CartItemProps {
  product: Product
  quantity: number
  onAdd: (product: Product) => void
  onRemove: (product: Product) => void
  onDelete: (product: Product) => void
}

const SWIPE_THRESHOLD = 72

export function CartItem({ product, quantity, onAdd, onRemove, onDelete }: CartItemProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const startX = useRef<number | null>(null)
  const currentX = useRef(0)

  const handleDelete = useCallback(() => {
    setIsRemoving(true)
    setTimeout(() => onDelete(product), 280)
  }, [onDelete, product])

  // ── Touch handlers ──────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = offsetX
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    const newOffset = Math.max(-SWIPE_THRESHOLD, Math.min(0, currentX.current + delta))
    setOffsetX(newOffset)
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    startX.current = null
    if (offsetX < -SWIPE_THRESHOLD * 0.55) {
      setOffsetX(-SWIPE_THRESHOLD)
    } else {
      setOffsetX(0)
    }
  }

  // ── Mouse handlers (desktop preview) ──────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX
    currentX.current = offsetX
    setIsDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || startX.current === null) return
    const delta = e.clientX - startX.current
    const newOffset = Math.max(-SWIPE_THRESHOLD, Math.min(0, currentX.current + delta))
    setOffsetX(newOffset)
  }

  const onMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    startX.current = null
    if (offsetX < -SWIPE_THRESHOLD * 0.55) {
      setOffsetX(-SWIPE_THRESHOLD)
    } else {
      setOffsetX(0)
    }
  }

  const revealRatio = Math.min(1, Math.abs(offsetX) / SWIPE_THRESHOLD)

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        isRemoving && "opacity-0 scale-95 transition-all duration-280"
      )}
      aria-label={`${product.name} en el carrito`}
    >
      {/* Delete reveal layer */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl"
        style={{ backgroundColor: `rgba(239,68,68,${0.08 + revealRatio * 0.92})` }}
        aria-hidden="true"
      >
        <Trash2
          size={22}
          className="text-red-500 transition-transform duration-150"
          style={{ transform: `scale(${0.7 + revealRatio * 0.3})` }}
        />
      </div>

      {/* Card */}
      <div
        className={cn(
          "flex items-start gap-3 bg-card rounded-2xl p-3.5 shadow-sm border border-border/50 select-none cursor-grab active:cursor-grabbing",
          isDragging ? "transition-none" : "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
            draggable={false}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Name + category */}
          <div>
            <h3 className="font-bold text-foreground text-sm leading-snug truncate">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-snug line-clamp-1 mt-0.5">
              {product.description}
            </p>
          </div>

          {/* Price + controls row */}
          <div className="flex items-center justify-between gap-2">
            {/* Prices */}
            <div>
              <p className="font-black text-sm leading-none" style={{ color: "#F97316" }}>
                ${(product.price * quantity).toLocaleString("es-AR")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                ${product.price.toLocaleString("es-AR")} c/u
              </p>
            </div>

            {/* Quantity pill */}
            <div
              className="flex items-center gap-1 rounded-full px-1 py-1"
              style={{ backgroundColor: "#FFF0E6" }}
            >
              <button
                onClick={() => quantity === 1 ? handleDelete() : onRemove(product)}
                aria-label={quantity === 1 ? `Eliminar ${product.name}` : `Quitar uno de ${product.name}`}
                className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150"
                style={{ backgroundColor: quantity === 1 ? "#FEE2E2" : "white", color: quantity === 1 ? "#EF4444" : "#F97316" }}
              >
                {quantity === 1
                  ? <Trash2 size={12} strokeWidth={2.5} />
                  : <Minus size={13} strokeWidth={2.5} />
                }
              </button>
              <span
                className="w-5 text-center text-sm font-black tabular-nums leading-none"
                style={{ color: "#F97316" }}
              >
                {quantity}
              </span>
              <button
                onClick={() => onAdd(product)}
                aria-label={`Agregar otro ${product.name}`}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform duration-150"
                style={{ backgroundColor: "#F97316" }}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
