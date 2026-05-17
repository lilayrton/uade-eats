import type { Store, Product, User } from "./types"

// TODO: replace with API call
export const MOCK_STORES: Store[] = [
  {
    id: "store-1",
    name: "Cafetería Pepe",
    category: "cafeteria",
    tagline: "El clásico del campus. Café, tostados y más.",
    imageUrl: "/images/cafeteria-pepe.jpg",
    estimatedWaitMinutes: 8,
    isOpen: true,
    rating: 4.5,
  },
  {
    id: "store-2",
    name: "Pastelería Claudio",
    category: "pasteleria",
    tagline: "Medialunas recién horneadas y tortas artesanales.",
    imageUrl: "/images/pasteleria-claudio.jpg",
    estimatedWaitMinutes: 12,
    isOpen: true,
    rating: 4.8,
  },
  {
    id: "store-3",
    name: "Buffet La Cantina",
    category: "buffet",
    tagline: "Platos del día con opciones vegetarianas.",
    imageUrl: "/images/buffet-la-cantina.jpg",
    estimatedWaitMinutes: 18,
    isOpen: false,
    rating: 4.2,
  },
  {
    id: "store-4",
    name: "Kiosco UADE",
    category: "kiosco",
    tagline: "Snacks, bebidas y golosinas al instante.",
    imageUrl: "/images/kiosco-uade.jpg",
    estimatedWaitMinutes: 3,
    isOpen: true,
    rating: 4.0,
  },
]

// TODO: replace with API call
export const MOCK_PRODUCTS: Product[] = [
  // Cafetería Pepe — store-1
  {
    id: "p1-1",
    storeId: "store-1",
    name: "Café con Leche",
    description: "Café espresso con leche vaporizada, tamaño grande.",
    price: 1400,
    category: "Bebidas",
    imageUrl: "/images/products/cafe-con-leche.jpg",
  },
  {
    id: "p1-2",
    storeId: "store-1",
    name: "Tostado Mixto",
    description: "Pan lactal tostado con jamón y queso derretido.",
    price: 2200,
    category: "Sándwiches",
    imageUrl: "/images/products/tostado-mixto.jpg",
  },
  {
    id: "p1-3",
    storeId: "store-1",
    name: "Medialunas x3",
    description: "Tres medialunas de manteca recién horneadas.",
    price: 1800,
    category: "Medialunas",
    imageUrl: "/images/products/medialunas.jpg",
  },
  {
    id: "p1-4",
    storeId: "store-1",
    name: "Agua Mineral 500ml",
    description: "Agua mineral sin gas, botella personal.",
    price: 1200,
    category: "Bebidas",
    imageUrl: "/images/products/agua-mineral.jpg",
  },
  {
    id: "p1-5",
    storeId: "store-1",
    name: "Alfajor de Maicena",
    description: "Alfajor artesanal relleno de dulce de leche.",
    price: 1500,
    category: "Snacks",
    imageUrl: "/images/products/alfajor.jpg",
  },

  // Pastelería Claudio — store-2
  {
    id: "p2-1",
    storeId: "store-2",
    name: "Medialuna de Manteca",
    description: "Medialuna esponjosa con baño de azúcar, recién horneada.",
    price: 700,
    category: "Medialunas",
    imageUrl: "/images/products/medialuna-manteca.jpg",
  },
  {
    id: "p2-2",
    storeId: "store-2",
    name: "Torta de Ricota",
    description: "Porción de torta casera de ricota con pasas.",
    price: 2800,
    category: "Postres",
    imageUrl: "/images/products/torta-ricota.jpg",
  },
  {
    id: "p2-3",
    storeId: "store-2",
    name: "Café Espresso",
    description: "Espresso doble en taza pequeña.",
    price: 1100,
    category: "Bebidas",
    imageUrl: "/images/products/cafe-espresso.jpg",
  },
  {
    id: "p2-4",
    storeId: "store-2",
    name: "Brownie de Chocolate",
    description: "Brownie húmedo con chips de chocolate.",
    price: 2200,
    category: "Postres",
    imageUrl: "/images/products/brownie.jpg",
  },

  // Buffet La Cantina — store-3
  {
    id: "p3-1",
    storeId: "store-3",
    name: "Sándwich de Pollo",
    description: "Pollo grillado con lechuga, tomate y mayonesa en pan árabe.",
    price: 3200,
    category: "Sándwiches",
    imageUrl: "/images/products/sandwich-pollo.jpg",
  },
  {
    id: "p3-2",
    storeId: "store-3",
    name: "Jugo de Naranja",
    description: "Jugo de naranja exprimido al momento, 400ml.",
    price: 1800,
    category: "Bebidas",
    imageUrl: "/images/products/jugo-naranja.jpg",
  },
  {
    id: "p3-3",
    storeId: "store-3",
    name: "Ensalada César",
    description: "Lechuga romana, crutones, parmesano y aderezo césar.",
    price: 3500,
    category: "Snacks",
    imageUrl: "/images/products/ensalada-cesar.jpg",
  },

  // Kiosco UADE — store-4
  {
    id: "p4-1",
    storeId: "store-4",
    name: "Coca-Cola 500ml",
    description: "Gaseosa Coca-Cola clásica, botella personal.",
    price: 1600,
    category: "Bebidas",
    imageUrl: "/images/products/coca-cola.jpg",
  },
  {
    id: "p4-2",
    storeId: "store-4",
    name: "Papas Fritas Lay's",
    description: "Bolsa de papas fritas clásicas, 55g.",
    price: 1900,
    category: "Snacks",
    imageUrl: "/images/products/papas-lays.jpg",
  },
  {
    id: "p4-3",
    storeId: "store-4",
    name: "Chocolate Milka",
    description: "Tableta de chocolate con leche Milka, 100g.",
    price: 2400,
    category: "Snacks",
    imageUrl: "/images/products/milka.jpg",
  },
  {
    id: "p4-4",
    storeId: "store-4",
    name: "Barra de Cereal",
    description: "Barra de cereal con granola y miel, 30g.",
    price: 1300,
    category: "Snacks",
    imageUrl: "/images/products/barra-cereal.jpg",
  },
]

// TODO: replace with API call
export const MOCK_USER: User = {
  id: "u1",
  name: "John Von Neumann",
  email: "vonneumann@uade.edu.ar",
  role: "student",
}

export let REGISTERED_USERS: User[] = [MOCK_USER]

export function registerUser(user: User): void {
  REGISTERED_USERS.push(user)
}

export function findUserByEmail(email: string): User | undefined {
  return REGISTERED_USERS.find((u) => u.email === email)
}
