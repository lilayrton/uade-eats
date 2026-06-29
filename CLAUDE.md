# UADE Eats — Guía para Claude Code

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5.7
- **ORM**: Prisma 5 + PostgreSQL 15
- **Auth**: JWT custom con `jose` (HttpOnly cookie `uade-eats-session`, 7 días)
- **Pagos**: MercadoPago SDK v2 (testing/sandbox con token `TEST-...`)
- **UI**: Tailwind CSS v4 + Radix UI + Lucide React + Sonner (toasts)
- **Realtime**: Server-Sent Events (SSE) para notificaciones de cocina

## Levantar el proyecto

```bash
# 1. Base de datos (PostgreSQL en Docker, puerto 5433)
docker-compose up -d

# 2. Variables de entorno
cp .env.example .env   # luego completar MP_ACCESS_TOKEN

# 3. Dependencias + schema
npm install
npm run db:setup       # prisma db push + seed

# 4. Dev server
npm run dev            # puerto 3000
```

## Variables de entorno requeridas

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/uade_eats
MP_ACCESS_TOKEN=TEST-...      # token de MercadoPago sandbox
NEXT_PUBLIC_URL=http://localhost:3000
```

## Estructura de directorios

```
app/
  api/
    auth/           login, logout, register
    orders/         CRUD de pedidos + confirm (MP)
    wallet/         GET balance, POST /load, POST /confirm
    webhooks/
      mercadopago/  webhook de MP (órdenes y recargas de wallet)
    store-portal/   dashboard de comerciantes
    sse/            Server-Sent Events
    stores/         listado de locales
    user/           perfil del usuario
  checkout/         flujo de pago (page + success + failure)
  wallet/           wallet del alumno (page + confirm)
  store/[id]/       página de local
  store-portal/     dashboard para dueños de local
  orders/           historial de pedidos del alumno
  profile/          configuración de perfil
components/
  wallet-load-modal.tsx   modal de carga de saldo vía MP
  split-bill-modal.tsx    generador de código para dividir cuenta (UI only)
  bottom-nav.tsx          navegación inferior
lib/
  auth.ts           getSession() — lee JWT de cookie
  db.ts             singleton Prisma client
  events.ts         dispatchEvent() para SSE
context/
  AppContext.tsx    estado global: user, cart, notifications
prisma/
  schema.prisma     esquema de la BD
```

## Base de datos (Prisma)

```prisma
User          id, name, email, passwordHash, role, legajo, storeId, walletBalance, createdAt
Store         id, name, category, tagline, imageUrl, estimatedWaitMinutes, isOpen, rating
Product       id, storeId, name, description, price, categoryId, imageUrl
Category      id, storeId, name  (unique por store)
Order         id, userId, storeId, total, status, paymentMethod, pickupCode, notes
OrderItem     id, orderId, productId, quantity, unitPrice
WalletTransaction  id, userId, type, amount, status, mpPreferenceId, description
```

**Roles de usuario**: `"student"` | `"store_owner"` | `"faculty"`

**Estados de orden**: `"pending_payment"` → `"pending"` → `"preparing"` → `"ready"` → `"completed"` / `"cancelled"` / `"abandoned"`

**WalletTransaction.type**: `"load"` (carga) | `"payment"` (pago futuro)
**WalletTransaction.status**: `"pending"` | `"completed"` | `"failed"`

## Flujos clave

### Checkout con MercadoPago (orden)
1. `POST /api/orders` → crea Order `pending_payment` + genera MP Preference (`external_reference = orderId`)
2. Frontend redirige a `initPoint` (en localhost abre nueva pestaña)
3. MP llama `POST /api/webhooks/mercadopago` → actualiza Order a `"pending"` + SSE a cocina
4. Página `/checkout/success` llama `POST /api/orders/confirm` como fallback de polling

### Carga de wallet con MercadoPago
1. `POST /api/wallet/load` → crea WalletTransaction `pending` + genera MP Preference (`external_reference = "wallet_{txId}"`)
2. Frontend redirige a `initPoint` (en localhost abre nueva pestaña)
3. MP llama `POST /api/webhooks/mercadopago` → detecta prefijo `wallet_` → acredita `user.walletBalance`
4. Página `/wallet/confirm` llama `POST /api/wallet/confirm` como fallback de polling

> **Distinción en webhook**: si `external_reference` empieza con `"wallet_"` → es recarga de wallet; si no → es pago de orden.

### Cupón de descuento
Código `UADE2026` aplica 20% de descuento. Se valida en `POST /api/orders` y se ajusta el `unit_price` en la preferencia de MP.

## Convenciones del proyecto

- Todos los API routes usan `getSession()` de `@/lib/auth` para autenticar
- El cliente Prisma se importa desde `@/lib/db`
- Los eventos SSE se despachan con `dispatchEvent(type, payload)` de `@/lib/events`
- En localhost, MP se abre en nueva pestaña y el confirm endpoint usa `NODE_ENV !== "production"` para aprobar automáticamente (no espera pago real)
- Schema se actualiza con `npx prisma db push` (no usa migrations)

## Estado de features

| Feature | Estado |
|---------|--------|
| Login / Register | ✅ Completo |
| Listado de locales y productos | ✅ Completo |
| Carrito (un local a la vez) | ✅ Completo |
| Checkout efectivo | ✅ Completo |
| Checkout MercadoPago | ✅ Completo |
| Historial de pedidos | ✅ Completo |
| Dashboard de comerciante | ✅ Completo |
| Notificaciones SSE cocina | ✅ Completo |
| Cargar wallet vía MP | ✅ Completo |
| Pagar con wallet (checkout) | ⬜ Pendiente |
| Dividir cuenta (split bill) | ⬜ Pendiente (UI mock only) |
| Pagar mi parte con wallet | ⬜ Pendiente |
| Reportes / estadísticas | ✅ Completo (página de reporte) |
