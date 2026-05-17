import { db } from "@/lib/db"
import HomePageClient from "./page-client"
import { Store } from "@/lib/types"

// Revalidate every 60 seconds or make it dynamic if we need real-time open status
export const revalidate = 60

export default async function HomePage() {
  const storesData = await db.store.findMany({
    orderBy: {
      rating: 'desc'
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

  return <HomePageClient stores={stores} />
}
