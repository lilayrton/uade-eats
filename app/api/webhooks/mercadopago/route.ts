import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dispatchEvent } from "@/lib/events"
import { MercadoPagoConfig, Payment } from "mercadopago"

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type")
    const id = url.searchParams.get("id") || url.searchParams.get("data.id")

    // Parse request body if present
    let body: any = {}
    try {
      body = await req.json()
    } catch (_) {}

    const resourceId = id || body.data?.id
    const resourceType = topic || body.type

    console.log("Mercado Pago Webhook Received - Type:", resourceType, "ID:", resourceId)

    if (resourceType === "payment" && resourceId) {
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || ""
      })
      const payment = new Payment(mpClient)

      const paymentData = await payment.get({ id: resourceId })
      const orderId = paymentData.external_reference
      const paymentStatus = paymentData.status

      console.log(`Payment parsed - OrderID: ${orderId}, Status: ${paymentStatus}`)

      if (paymentStatus === "approved" && orderId) {
        if (orderId.startsWith("wallet_")) {
          // Wallet top-up payment
          const transactionId = orderId.replace("wallet_", "")
          const tx = await db.walletTransaction.findUnique({ where: { id: transactionId } })
          if (tx) {
            // Transición atómica pending -> completed: solo el primer caller
            // (webhook o confirm) obtiene count === 1 y acredita el saldo. Esto
            // evita doble acreditación si ambos corren concurrentemente.
            const result = await db.walletTransaction.updateMany({
              where: { id: transactionId, status: "pending" },
              data: { status: "completed" }
            })
            if (result.count === 1) {
              await db.user.update({
                where: { id: tx.userId },
                data: { walletBalance: { increment: tx.amount } }
              })
              console.log(`Wallet transaction ${transactionId} completed, credited $${tx.amount} to user ${tx.userId}`)
            }
          }
        } else {
          // Regular order payment
          const order = await db.order.findUnique({
            where: { id: orderId }
          })

          if (order && (order.status === "pending_payment" || order.status === "cancelled" || order.status === "abandoned")) {
            const processedOrder = await db.$transaction(async (tx) => {
              const result = await tx.order.updateMany({
                where: { id: orderId, status: "pending_payment" },
                data: { status: "pending" }
              })
              
              if (result.count === 0) {
                return null
              }
              
              const currentOrder = await tx.order.findUnique({ where: { id: orderId } })
              if (!currentOrder) return null

              const actualServiceFee = currentOrder.serviceFee
              const storeRevenue = currentOrder.total - currentOrder.serviceFee
              
              // Acreditar subtotal al local
              await tx.store.update({
                where: { id: currentOrder.storeId },
                data: { walletBalance: { increment: storeRevenue } }
              })
              
              // Registrar comisión para la plataforma
              await tx.platformTransaction.create({
                data: {
                  amount: actualServiceFee,
                  type: "service_fee",
                  description: `Comisión MP Webhook (5%) - Pedido #${currentOrder.pickupCode || currentOrder.id.slice(-4)}`,
                  storeId: currentOrder.storeId
                }
              })

              return currentOrder
            })

            if (processedOrder) {
              dispatchEvent("new_order", { orderId: processedOrder.id, storeId: processedOrder.storeId })
              console.log(`Order ${orderId} successfully marked as PAID and funds distributed!`)
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Mercado Pago Webhook error:", error)
    // Always return 200/201 to prevent Mercado Pago from retrying endlessly
    return NextResponse.json({ error: "Webhook received but not fully processed" })
  }
}
