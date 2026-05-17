import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dispatchEvent } from "@/lib/events"

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    // Check if the order is currently in "pending_payment" status
    const order = await db.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "pending_payment") {
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: { status: "pending" }
      })

      // Dispatch new_order event so that SSE triggers real-time update in La Cantina administrative panel
      dispatchEvent("new_order", { orderId: updatedOrder.id, storeId: updatedOrder.storeId })

      return NextResponse.json({ success: true, status: "pending" })
    }

    return NextResponse.json({ success: true, status: order.status })
  } catch (error) {
    console.error("Order payment confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
