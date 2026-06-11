import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { dispatchEvent } from "@/lib/events"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Fetch user details to get storeId
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true, storeId: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const orders = await db.order.findMany({
      where: { storeId: user.storeId },
      include: {
        user: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ success: true, storeId: user.storeId, orders })
  } catch (error) {
    console.error("Error fetching portal orders:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Fetch user details to get storeId
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true, storeId: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const { orderId, status } = await req.json()
    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId y status requeridos" }, { status: 400 })
    }

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    // Check if order belongs to the owner's store
    const order = await db.order.findFirst({
      where: { id: orderId, storeId: user.storeId }
    })

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado o no pertenece a tu local" }, { status: 404 })
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: { name: true, email: true }
        },
        store: true,
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true }
            }
          }
        }
      }
    })

    // Dispatch event to SSE connections
    dispatchEvent("order_updated", { orderId, status, userId: updatedOrder.userId, order: updatedOrder })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("Error updating portal order:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
