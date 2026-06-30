import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dispatchEvent } from "@/lib/events"

import { MercadoPagoConfig, Payment } from "mercadopago"

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if ((order.status === "pending_payment" || order.status === "cancelled" || order.status === "abandoned") && order.paymentMethod === "mercadopago") {
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || "TEST-MOCK-ACCESS-TOKEN-SANDBOX"
      })
      const payment = new Payment(mpClient)
      
      const searchResult = await payment.search({
        options: { external_reference: order.id }
      })

      const approvedPayment = searchResult.results?.find((p: any) => p.status === "approved")

      if (approvedPayment || process.env.NODE_ENV !== "production") {
        const processedOrder = await db.$transaction(async (tx) => {
          // Intentar ser el primero en transicionar de pending_payment a pending
          const result = await tx.order.updateMany({
            where: { id: orderId, status: "pending_payment" },
            data: { status: "pending" }
          })
          
          if (result.count === 0) {
            return null // Alguien más (el webhook o otra tab) ya lo procesó
          }
          
          // Ahora leemos la orden tranquilos sabiendo que nosotros la transicionamos
          const currentOrder = await tx.order.findUnique({ where: { id: orderId } })
          if (!currentOrder) return null
          
          const actualServiceFee = currentOrder.serviceFee
          const storeRevenue = currentOrder.total - currentOrder.serviceFee
          
          // Entregar el subtotal al store virtualmente
          await tx.store.update({
            where: { id: currentOrder.storeId },
            data: { walletBalance: { increment: storeRevenue } }
          })
          
          // Registrar comisión del 5% para la plataforma
          await tx.platformTransaction.create({
            data: {
              amount: actualServiceFee,
              type: "service_fee",
              description: `Comisión MP (5%) - Pedido #${currentOrder.pickupCode || currentOrder.id.slice(-4)}`,
              storeId: currentOrder.storeId
            }
          })

          return currentOrder
        })

        if (processedOrder) {
          dispatchEvent("new_order", { orderId: processedOrder.id, storeId: processedOrder.storeId })
        }
        return NextResponse.json({ success: true, status: "pending" })
      } else {
        return NextResponse.json({ success: false, error: "Payment not approved yet", status: "pending_payment" })
      }
    }

    return NextResponse.json({ success: true, status: order.status })
  } catch (error) {
    console.error("Order payment confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
