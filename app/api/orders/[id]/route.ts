import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const order = await db.order.findUnique({
      where: {
        id: id,
        userId: session.id, // Ensure user owns the order
      },
      include: {
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Fetch order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    if (status !== "cancelled") {
      return NextResponse.json({ error: "Only cancellations are allowed" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: id, userId: session.id }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only allow cancelling if it's pending_payment or pending
    if (order.status !== "pending_payment" && order.status !== "pending") {
      return NextResponse.json({ error: "No se puede cancelar en este estado" }, { status: 400 })
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status: "cancelled" }
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

