export type ProductCategory =
  | "Bebidas"
  | "Sándwiches"
  | "Snacks"
  | "Postres"
  | "Medialunas"

export type OrderStatus = "pending" | "preparing" | "ready" | "completed"

export type PaymentMethod = "mercadopago" | "efectivo"

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
  category: ProductCategory
  imageUrl: string
}

export interface CartItem {
  product: Product
  quantity: number
  storeId: string
}

export interface Order {
  id: string
  storeId: string
  storeName: string
  items: CartItem[]
  total: number
  status: OrderStatus
  pickupCode: number
  createdAt: number
}

export interface User {
  id: string
  name: string
  email: string
  role: "student" | "faculty" | "staff"
}

export type Notification = {
  id: string
  title: string
  body: string
  timestamp: number
  read: boolean
  type: "order" | "promo" | "system"
}
