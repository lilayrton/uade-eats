export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled"

export type AuthStatus = "unauthenticated" | "authenticated"

export interface Store {
  id: string
  name: string
  category: string
  tagline: string
  imageUrl: string
  estimatedWaitMinutes: number
  isOpen: boolean
  rating: number
}

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  categoryId: string
  category: { id: string; name: string }
  imageUrl: string
}

export interface CartItem {
  product: Product
  quantity: number
  storeId: string
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: {
    name: string
    imageUrl: string
  }
}

export interface UserOrder {
  id: string
  userId: string
  storeId: string
  total: number
  status: OrderStatus
  paymentMethod: string
  pickupCode: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  store: { id: string; name: string }
  user: {
    name: string
    email: string
  }
  items: OrderItem[]
}

export interface Order {
  id: string
  userId: string
  storeId: string
  total: number
  status: OrderStatus
  paymentMethod: string
  pickupCode: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
  items: OrderItem[]
}

export interface User {
  id: string
  name: string
  email: string
  role: "student" | "faculty" | "store_owner"
}

export type Notification = {
  id: string
  title: string
  body: string
  timestamp: number
  read: boolean
  type: "order" | "promo" | "system"
}
