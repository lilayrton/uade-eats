"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Store } from "@/lib/types"

export type { Store }

interface StoreCardProps {
  store: Store
  onClick?: () => void
}

export function StoreCard({ store, onClick }: StoreCardProps) {
  return (
    <Link
      href={`/store/${store.id}`}
      onClick={onClick}
      className="block w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 active:scale-[0.99] transition-transform duration-150 hover:shadow-md"
    >
      {/* Food image */}
      <div className="relative w-full h-44 overflow-hidden">
        <Image
          src={store.imageUrl}
          alt={store.name}
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 480px"
        />
        <div
          className={cn(
            "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide",
            store.isOpen
              ? "bg-green-500 text-white"
              : "bg-foreground/70 text-white"
          )}
        >
          {store.isOpen ? "Abierto" : "Cerrado"}
        </div>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-sm">
          {store.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight truncate">
              {store.name}
            </h3>
            <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed line-clamp-1">
              {store.tagline}
            </p>
          </div>
          <ChevronRight className="shrink-0 mt-0.5 text-muted-foreground" size={18} />
        </div>
      </div>
    </Link>
  )
}
