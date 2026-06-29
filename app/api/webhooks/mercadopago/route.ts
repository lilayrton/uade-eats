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
        const order = await db.order.findUnique({
          where: { id: orderId }
        })

        if (order && (order.status === "pending_payment" || order.status === "cancelled" || order.status === "abandoned")) {
          const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: { status: "pending" }
          })

          // Dispatch event to SSE connections in La Cantina
          dispatchEvent("new_order", { orderId: updatedOrder.id, storeId: updatedOrder.storeId })
          console.log(`Order ${orderId} successfully marked as PAID and dispatched via SSE!`)
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
