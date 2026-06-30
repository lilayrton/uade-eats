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
  admin/              panel de administración (role "admin")
  api/
    auth/             login, logout, register
    admin/
      metrics/        métricas de plataforma
      withdrawals/    gestión de retiros de locales
    orders/           CRUD de pedidos + confirm (MP)
    wallet/           GET balance, POST /load, POST /confirm
    webhooks/
      mercadopago/    webhook de MP (órdenes y recargas de wallet)
    store-portal/     dashboard de comerciantes
      wallet/
        bank-info/    configurar CVU/CBU/Alias
        pay-debt/     pagar deuda de plataforma
        transactions/ historial de movimientos del local
        withdraw/     solicitar retiro a banco
    sse/              Server-Sent Events
    stores/           listado de locales
    upload/           subida de imágenes
    user/             perfil del usuario
  cart/               página de carrito
  checkout/           flujo de pago (page + success + failure)
  wallet/             wallet del alumno (page + confirm)
  store/[id]/         página de local
  store-portal/       dashboard para dueños de local
  orders/             historial de pedidos del alumno
  profile/            configuración de perfil
    help/
    notifications-settings/
    payment-methods/
    personal-info/
    report/
    theme/
  login/
  register/
    store/
components/
  bottom-nav.tsx          navegación inferior
  cart-empty.tsx          estado vacío del carrito
  cart-item.tsx           ítem de carrito
  category-tabs.tsx       tabs de categorías en store
  filter-chips.tsx        chips de filtro
  filter-modal.tsx        modal de filtros
  notifications-bell.tsx  campana de notificaciones
  notifications-panel.tsx panel lateral de notificaciones
  product-card.tsx        card de producto
  search-bar.tsx          barra de búsqueda
  split-bill-modal.tsx    generador de código para dividir cuenta (UI only)
  store-card.tsx          card de local
  theme-provider.tsx      proveedor de tema claro/oscuro
  wallet-load-modal.tsx   modal de carga de saldo vía MP
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
Store         id, name, category, tagline, imageUrl, estimatedWaitMinutes, isOpen, rating,
              walletBalance, platformDebt, bankInfo, createdAt
Product       id, storeId, name, description, price, categoryId, imageUrl
Category      id, storeId, name  (unique por store)
Order         id, userId, storeId, total, serviceFee, status, paymentMethod, pickupCode, notes
OrderItem     id, orderId, productId, quantity, unitPrice
WalletTransaction      id, userId, type, amount, status, mpPreferenceId, description, createdAt
StoreWalletTransaction id, storeId, type, amount, status, description, createdAt
PlatformTransaction    id, amount, type, description, storeId?, orderId?, createdAt
```

**Roles de usuario**: `"student"` | `"store_owner"` | `"faculty"` | `"admin"`

**Estados de orden**: `"pending_payment"` → `"pending"` → `"preparing"` → `"ready"` → `"completed"` / `"cancelled"` / `"abandoned"`

**Métodos de pago**: `"mercadopago"` | `"efectivo"` | `"tarjeta"` | `"wallet"`

**WalletTransaction.type**: `"load"` (carga vía MP) | `"payment"` (pago de orden)
**WalletTransaction.status**: `"pending"` | `"completed"` | `"failed"`

**StoreWalletTransaction.type**: `"payment_received"` | `"withdrawal"` | `"debt_payment"`
**StoreWalletTransaction.status**: `"pending"` | `"completed"` | `"rejected"`

**PlatformTransaction.type**: `"service_fee"` | `"debt_payment"`

## Service fees

| Método de pago | Comisión |
|---------------|----------|
| Wallet | 3% |
| MercadoPago / Efectivo | 5% |

El `serviceFee` se guarda en `Order.serviceFee` y se registra en `PlatformTransaction`.

## Flujos clave

### Checkout con MercadoPago (orden)
1. `POST /api/orders` → crea Order `pending_payment` + genera MP Preference (`external_reference = orderId`)
2. Frontend redirige a `initPoint` (en localhost abre nueva pestaña)
3. MP llama `POST /api/webhooks/mercadopago` → actualiza Order a `"pending"` + SSE a cocina
4. Página `/checkout/success` llama `POST /api/orders/confirm` como fallback de polling

### Checkout con wallet
1. Usuario selecciona "Wallet" en el paso de método de pago
2. `POST /api/orders` verifica saldo suficiente, luego en una transacción:
   - Descuenta `user.walletBalance`
   - Acredita `store.walletBalance`
   - Crea `WalletTransaction` (type=`"payment"`, status=`"completed"`)
   - Crea `StoreWalletTransaction` (type=`"payment_received"`)
   - Crea `PlatformTransaction` (type=`"service_fee"`, 3%)
3. Order queda directamente en `"pending"` (sin pasar por `pending_payment`) + SSE a cocina

### Carga de wallet con MercadoPago
1. `POST /api/wallet/load` → crea WalletTransaction `pending` + genera MP Preference (`external_reference = "wallet_{txId}"`)
2. Frontend redirige a `initPoint` (en localhost abre nueva pestaña)
3. MP llama `POST /api/webhooks/mercadopago` → detecta prefijo `wallet_` → acredita `user.walletBalance`
4. Página `/wallet/confirm` llama `POST /api/wallet/confirm` como fallback de polling

> **Distinción en webhook**: si `external_reference` empieza con `"wallet_"` → es recarga de wallet; si no → es pago de orden.

### Dividir cuenta (split bill)
El pedido ya fue pagado completo por su creador; dividir la cuenta **reembolsa al creador** vía wallet (transferencia 1:1 entre alumnos, **sin comisión**).
1. El creador, desde "Mis pedidos" → "Dividir cuenta", elige N personas y `POST /api/split-bills` → crea `SplitBill` (`code` único, `orderId @unique`, `amountPerPerson = total / N`). Reabrir el modal devuelve el mismo código.
2. Otro alumno ingresa el código en Wallet → "Pagar mi parte": `GET /api/split-bills/[code]` devuelve detalle + `slotsLeft`, `isCreator`, `alreadyPaid`.
3. `POST /api/split-bills/[code]/pay` paga con wallet en una transacción: debita al pagador, acredita al creador, crea `SplitPayment` y dos `WalletTransaction` (`split_payment` negativo / `split_received` positivo).
4. Validaciones: el creador no paga su parte, un usuario paga una sola vez (`@@unique([splitBillId, payerId])`), máximo `peopleCount - 1` pagos, saldo suficiente.

> **WalletTransaction.type** suma: `"split_payment"` (parte pagada) | `"split_received"` (parte recibida por el creador).

### Sistema financiero de locales
- Órdenes en **efectivo** generan deuda (`store.platformDebt`) en lugar de acreditar saldo
- El local puede pagar su deuda con su saldo: `POST /api/store-portal/wallet/pay-debt`
- El local configura datos bancarios: `POST /api/store-portal/wallet/bank-info` (guarda CVU/CBU/Alias en `Store.bankInfo`)
- El local solicita retiro: `POST /api/store-portal/wallet/withdraw`
- Historial de movimientos: `GET /api/store-portal/wallet/transactions`

### Cupón de descuento
Código `UADE2026` aplica 20% de descuento. Se valida en `POST /api/orders` y se ajusta el `unit_price` en la preferencia de MP.

### Panel de admin
- Accesible en `/admin` solo para usuarios con `role = "admin"`
- Login redirige automáticamente a `/admin` si el rol es `"admin"`
- `GET /api/admin/metrics` — métricas de plataforma (comisiones, deudas, volumen)
- `GET/POST /api/admin/withdrawals` — ver y gestionar retiros solicitados por locales

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
| Checkout con wallet | ✅ Completo |
| Historial de pedidos | ✅ Completo |
| Dashboard de comerciante | ✅ Completo |
| Notificaciones SSE cocina | ✅ Completo |
| Cargar wallet vía MP | ✅ Completo |
| Sistema financiero de locales | ✅ Completo |
| Panel de admin | ✅ Completo |
| Reportes / estadísticas | ✅ Completo (página de reporte) |
| Dividir cuenta (split bill) | ✅ Completo |
| Pagar mi parte con wallet | ✅ Completo |
