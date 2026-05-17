"use client"

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import type {
  AuthStatus,
  User,
  Product,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Notification,
} from "@/lib/types"
import { MOCK_USER, registerUser, findUserByEmail } from "@/lib/mock-data"

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AppState {
  authStatus: AuthStatus
  user: User | null
  cart: {
    storeId: string | null
    storeName: string | null
    items: CartItem[]
  }
  notifications: Notification[]
}

const initialState: AppState = {
  authStatus: "unauthenticated",
  user: null,
  cart: { storeId: null, storeName: null, items: [] },
  notifications: [],
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppAction =
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" }
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "ADD_TO_CART"; payload: { product: Product; storeId: string; storeName: string } }
  | { type: "REMOVE_FROM_CART"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "REGISTER"; payload: { user: User } }
  | { type: "RESTORE_SESSION"; payload: User }
  | { type: "MARK_NOTIFICATION_READ"; payload: { id: string } }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_NOTIFICATION"; payload: { type: "order" | "promo" | "system"; title: string; body: string } }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload }

    case "CLEAR_USER":
      return { ...state, user: null }

    case "LOGIN": {
      return { ...state, user: action.payload, authStatus: "authenticated" }
    }

    case "REGISTER": {
      registerUser(action.payload.user)
      return { ...state, user: action.payload.user, authStatus: "authenticated" }
    }

    case "RESTORE_SESSION":
      return { ...state, user: action.payload, authStatus: "authenticated" }

    case "LOGOUT":
      return {
        ...state,
        user: null,
        authStatus: "unauthenticated",
        cart: { storeId: null, storeName: null, items: [] },
      }

    case "ADD_TO_CART": {
      const { product, storeId, storeName } = action.payload
      let items = state.cart.items

      // If adding from a different store, warn and reset cart
      if (state.cart.storeId !== null && state.cart.storeId !== storeId) {
        console.warn(
          `[AppContext] Cart reset: switched from store "${state.cart.storeId}" to "${storeId}".`
        )
        items = []
      }

      const existingIndex = items.findIndex(
        (i) => i.product.id === product.id
      )

      let updatedItems: CartItem[]
      if (existingIndex >= 0) {
        updatedItems = items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        updatedItems = [...items, { product, quantity: 1, storeId }]
      }

      return {
        ...state,
        cart: { storeId, storeName, items: updatedItems },
      }
    }

    case "REMOVE_FROM_CART": {
      const updatedItems = state.cart.items.filter(
        (i) => i.product.id !== action.payload.productId
      )
      return {
        ...state,
        cart: {
          storeId: updatedItems.length === 0 ? null : state.cart.storeId,
          storeName: updatedItems.length === 0 ? null : state.cart.storeName,
          items: updatedItems,
        },
      }
    }

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload
      if (quantity <= 0) {
        // Treat as remove
        const updatedItems = state.cart.items.filter(
          (i) => i.product.id !== productId
        )
        return {
          ...state,
          cart: {
            storeId: updatedItems.length === 0 ? null : state.cart.storeId,
            storeName: updatedItems.length === 0 ? null : state.cart.storeName,
            items: updatedItems,
          },
        }
      }
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        },
      }
    }

    case "CLEAR_CART":
      return { ...state, cart: { storeId: null, storeName: null, items: [] } }

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, read: true } : n
        ),
      }

    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case "ADD_NOTIFICATION": {
      const newNotif: Notification = {
        id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: action.payload.type,
        title: action.payload.title,
        body: action.payload.body,
        timestamp: Date.now(),
        read: false,
      }
      return {
        ...state,
        notifications: [newNotif, ...state.notifications],
      }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  cartCount: number
}

const AppContext = createContext<AppContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const cartCount = state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  // On mount: restore session from cookie so a full page reload keeps the user logged in
  useEffect(() => {
    if (document.cookie.includes("uade-eats-auth=1")) {
      const stored = localStorage.getItem("uade-eats-user")
      if (stored) {
        try {
          dispatch({ type: "RESTORE_SESSION", payload: JSON.parse(stored) as User })
        } catch {
          dispatch({ type: "LOGOUT" })
        }
      } else {
        dispatch({ type: "LOGOUT" })
      }
    }
  }, [])

  // Sync cookie whenever authStatus changes, but skip the initial render to
  // avoid immediately clearing the cookie before the restore effect above runs
  const isMounted = useRef(false)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    if (state.authStatus === "authenticated" && state.user) {
      document.cookie = "uade-eats-auth=1; path=/"
      localStorage.setItem("uade-eats-user", JSON.stringify(state.user))
    } else {
      document.cookie = "uade-eats-auth=; path=/; max-age=0"
      localStorage.removeItem("uade-eats-user")
    }
  }, [state.authStatus, state.user])

  const prevStatuses = useRef<Record<string, string>>({})

  // Poll orders every 5 seconds to detect state changes and trigger notifications
  useEffect(() => {
    if (state.authStatus !== "authenticated" || state.user?.role !== "student") {
      return
    }

    const checkOrders = async () => {
      try {
        const res = await fetch("/api/orders")
        const data = await res.json()
        if (data.success && Array.isArray(data.orders)) {
          data.orders.forEach((order: any) => {
            const lastStatus = prevStatuses.current[order.id]
            if (lastStatus && lastStatus !== order.status) {
              let title = ""
              let body = ""

              if (order.status === "preparing") {
                title = "¡Pedido en preparación! 👨‍🍳"
                body = `Tu pedido de ${order.store.name} ya se está preparando.`
              } else if (order.status === "ready") {
                title = "¡Pedido listo! 🛵"
                body = `Tu pedido de ${order.store.name} está listo. Retiralo con el código #${order.pickupCode}.`
              } else if (order.status === "completed") {
                title = "¡Pedido entregado! 🎉"
                body = `¡Gracias por tu compra en ${order.store.name}! Que lo disfrutes.`
              } else if (order.status === "cancelled") {
                title = "Pedido cancelado ❌"
                body = `Tu pedido de ${order.store.name} fue cancelado.`
              }

              if (title && body) {
                dispatch({
                  type: "ADD_NOTIFICATION",
                  payload: { type: "order", title, body }
                })
                toast.success(title, {
                  description: body,
                  duration: 6000,
                })
              }
            }
            prevStatuses.current[order.id] = order.status
          })
        }
      } catch (e) {
        console.error("Error checking order updates for notifications:", e)
      }
    }

    // Populate initial statuses without notifications
    const initialTimeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/orders")
        const data = await res.json()
        if (data.success && Array.isArray(data.orders)) {
          data.orders.forEach((order: any) => {
            prevStatuses.current[order.id] = order.status
          })
        }
      } catch (e) {
        console.error(e)
      }
    }, 1000)

    const interval = setInterval(checkOrders, 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [state.authStatus, state.user])

  return (
    <AppContext.Provider value={{ state, dispatch, cartCount }}>
      {children}
    </AppContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (ctx === null) {
    throw new Error("useApp must be used within AppProvider")
  }
  return ctx
}
