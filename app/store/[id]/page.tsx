import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import StorePageClient from "./page-client"
import { Store, Product } from "@/lib/types"

export const revalidate = 60

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const storeData = await db.store.findUnique({
    where: { id },
    include: { products: true }
  })

  if (!storeData) {
    notFound()
  }

  // Map to the types expected by the client
  const store: Store = {
    id: storeData.id,
    name: storeData.name,
    category: storeData.category,
    tagline: storeData.tagline,
    imageUrl: storeData.imageUrl,
    estimatedWaitMinutes: storeData.estimatedWaitMinutes,
    isOpen: storeData.isOpen,
    rating: storeData.rating,
  }

  // Ensure products conform strictly to the Product type
  const products: Product[] = storeData.products.map(p => ({
    id: p.id,
    storeId: p.storeId,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category as any, // Type cast since db category is string and Product category is union
    imageUrl: p.imageUrl,
  }))

  return <StorePageClient storeData={store} storeProducts={products} />
}
