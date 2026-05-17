import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { dispatchEvent } from "@/lib/events"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { storeId, items, paymentMethod } = body

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Retrieve the actual products from the database to securely calculate the total
    const productIds = items.map((item: any) => item.productId)
    const dbProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        storeId: storeId
      }
    })

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Algún producto no existe o no pertenece al local" }, { status: 400 })
    }

    let total = 0
    const orderItemsData = items.map((item: any) => {
      const dbProduct = dbProducts.find(p => p.id === item.productId)!
      total += dbProduct.price * item.quantity
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: dbProduct.price
      }
    })

    // Generate random 4-digit pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000)

    const order = await db.order.create({
      data: {
        userId: session.id,
        storeId,
        total,
        paymentMethod: paymentMethod || "efectivo",
        pickupCode,
        status: "pending",
        items: {
          create: orderItemsData
        }
      },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Dispatch event to SSE connections
    dispatchEvent("new_order", { orderId: order.id, storeId })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orders = await db.order.findMany({
      where: { userId: session.id },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
