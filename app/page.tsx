import { db } from "@/lib/db"
import HomePageClient from "./page-client"
import { Store } from "@/lib/types"

// Force dynamic so open/closed status is always real-time
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const storesData = await db.store.findMany({
    include: {
      products: {
        include: { category: true }
      }
    }
  })

  // Convert dates and ensure it matches the Client's expected Store type
  const stores: Store[] = storesData.map(store => ({
    id: store.id,
    name: store.name,
    category: store.category,
    tagline: store.tagline,
    imageUrl: store.imageUrl,
    estimatedWaitMinutes: store.estimatedWaitMinutes,
    isOpen: store.isOpen,
    rating: store.rating,
  }))

  const allProducts = storesData.flatMap(store => 
    store.products.map(p => ({
      id: p.id,
      storeId: p.storeId,
      storeName: store.name,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category?.name ?? "",
      imageUrl: p.imageUrl,
    }))
  )

  return <HomePageClient stores={stores} allProducts={allProducts} />
}
