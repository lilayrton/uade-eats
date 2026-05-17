"use client"

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react"
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
    items: CartItem[]
  }
  orders: Order[]
  activeOrderId: string | null
  notifications: Notification[]
}

const initialState: AppState = {
  authStatus: "unauthenticated",
  user: null,
  cart: { storeId: null, items: [] },
  orders: [],
  activeOrderId: null,
  notifications: [
    {
      id: "n1",
      type: "order",
      title: "¡Tu pedido está listo!",
      body: "Pasá a retirar tu pedido en Cafetería Pepe. Código #42.",
      timestamp: Date.now() - 300000,
      read: false,
    },
    {
      id: "n2",
      type: "promo",
      title: "Oferta del día 🎉",
      body: "Tostado Mixto + Café con Leche por $3.200 en Cafetería Pepe. Solo hoy.",
      timestamp: Date.now() - 3600000,
      read: false,
    },
    {
      id: "n3",
      type: "system",
      title: "Bienvenido a UADE EATS",
      body: "Hacé tu primer pedido y retiralo sin filas.",
      timestamp: Date.now() - 86400000,
      read: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppAction =
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" }
  | { type: "LOGIN"; payload: { email: string } }
  | { type: "LOGOUT" }
  | { type: "ADD_TO_CART"; payload: { product: Product; storeId: string } }
  | { type: "REMOVE_FROM_CART"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "PLACE_ORDER"; payload: { storeName: string; paymentMethod: PaymentMethod } }
  | { type: "UPDATE_ORDER_STATUS"; payload: { orderId: string; status: OrderStatus } }
  | { type: "SET_ACTIVE_ORDER"; payload: { orderId: string | null } }
  | { type: "REGISTER"; payload: { user: User } }
  | { type: "RESTORE_SESSION"; payload: User }
  | { type: "MARK_NOTIFICATION_READ"; payload: { id: string } }
  | { type: "MARK_ALL_READ" }

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
      // TODO: replace with real auth provider
      const email = action.payload.email.toLowerCase().trim()
      if (!email.endsWith("@uade.edu.ar")) return state
      const found = findUserByEmail(email)
      return { ...state, user: found ?? MOCK_USER, authStatus: "authenticated" }
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
        cart: { storeId: null, items: [] },
        activeOrderId: null,
      }

    case "ADD_TO_CART": {
      const { product, storeId } = action.payload
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
        cart: { storeId, items: updatedItems },
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
      return { ...state, cart: { storeId: null, items: [] } }

    case "PLACE_ORDER": {
      const { storeName, paymentMethod: _paymentMethod } = action.payload
      const total = state.cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
      )
      const pickupCode = Math.floor(Math.random() * 90) + 10
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        storeId: state.cart.storeId ?? "",
        storeName,
        items: state.cart.items,
        total,
        status: "pending",
        pickupCode,
        createdAt: Date.now(),
      }
      return {
        ...state,
        orders: [...state.orders, newOrder],
        activeOrderId: newOrder.id,
        cart: { storeId: null, items: [] },
      }
    }

    case "UPDATE_ORDER_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId
            ? { ...o, status: action.payload.status }
            : o
        ),
      }

    case "SET_ACTIVE_ORDER":
      return { ...state, activeOrderId: action.payload.orderId }

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
          dispatch({ type: "LOGIN", payload: { email: MOCK_USER.email } })
        }
      } else {
        dispatch({ type: "LOGIN", payload: { email: MOCK_USER.email } })
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
    if (state.authStatus === "authenticated") {
      document.cookie = "uade-eats-auth=1; path=/"
    } else {
      document.cookie = "uade-eats-auth=; path=/; max-age=0"
      localStorage.removeItem("uade-eats-user")
    }
  }, [state.authStatus])

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
