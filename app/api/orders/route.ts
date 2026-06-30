import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { dispatchEvent } from "@/lib/events"
import { MercadoPagoConfig, Preference } from "mercadopago"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { storeId, items, paymentMethod, couponCode, notes } = body

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

    let discount = 0
    if (couponCode === "UADE2026") {
      discount = total * 0.20
      total = total - discount
    }

    const isMP = paymentMethod === "mercadopago"
    const isWallet = paymentMethod === "wallet"
    const isEfectivo = paymentMethod === "efectivo"
    
    const serviceFeePercentage = isWallet ? 0.03 : 0.05
    const serviceFee = total * serviceFeePercentage
    
    // Store revenue is the subtotal
    const storeRevenue = total
    
    // Total charged to student includes service fee
    total = total + serviceFee
    
    // Clean up any previous ghost orders that the user abandoned
    if (isMP) {
      await db.order.updateMany({
        where: { userId: session.id, status: "pending_payment" },
        data: { status: "abandoned" }
      })
    }

    if (isWallet) {
      const user = await db.user.findUnique({ where: { id: session.id } })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      if (user.walletBalance < total) {
        return NextResponse.json({ error: "Saldo insuficiente en tu wallet" }, { status: 400 })
      }
    }

    // Create the order
    const order = await db.order.create({
      data: {
        userId: session.id,
        storeId,
        total,
        serviceFee,
        status: isMP ? "pending_payment" : "pending",
        paymentMethod: paymentMethod || "efectivo",
        notes: notes || null,
        pickupCode: Math.floor(1000 + Math.random() * 9000), // Generate 4 digit code
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

    if (isWallet) {
      await db.user.update({
        where: { id: session.id },
        data: { walletBalance: { decrement: total } }
      })

      await db.store.update({
        where: { id: storeId },
        data: { walletBalance: { increment: storeRevenue } }
      })

      await db.storeWalletTransaction.create({
        data: {
          storeId: storeId,
          type: "payment_received",
          amount: storeRevenue,
          description: `Cobro a ${session.id}` // simplified
        }
      })

      await db.walletTransaction.create({
        data: {
          userId: session.id,
          type: "payment",
          amount: -total,
          status: "completed",
          description: `Pago de pedido`
        }
      })
    }

    if (isEfectivo) {
      await db.store.update({
        where: { id: storeId },
        data: { platformDebt: { increment: serviceFee } }
      })
      // No creamos PlatformTransaction acá. La comisión real "entra" al sistema 
      // recién cuando el local paga esta deuda generada.
    }

    if (isWallet) {
      await db.platformTransaction.create({
        data: {
          amount: serviceFee,
          type: "service_fee",
          description: `Comisión por pedido (${paymentMethod})`,
          storeId: storeId,
          orderId: order.id
        }
      })
    }

    if (isMP) {
      try {
        const mpClient = new MercadoPagoConfig({
          accessToken: process.env.MP_ACCESS_TOKEN || "TEST-MOCK-ACCESS-TOKEN-SANDBOX"
        })
        const mpPreference = new Preference(mpClient)
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

        const mpItems = order.items.map(item => ({
          id: item.productId,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: couponCode === "UADE2026" ? item.unitPrice * 0.8 : item.unitPrice,
          currency_id: "ARS"
        }))

        const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")

        const preferenceBody: any = {
          items: mpItems,
          external_reference: order.id
        }

        if (!isLocalhost) {
          preferenceBody.back_urls = {
            success: `${baseUrl}/checkout/success?orderId=${order.id}`,
            failure: `${baseUrl}/checkout/failure?orderId=${order.id}`,
            pending: `${baseUrl}/checkout/pending?orderId=${order.id}`
          }
          preferenceBody.auto_return = "approved"
        }
        const preferenceResult = await mpPreference.create({
          body: preferenceBody
        })

        return NextResponse.json({
          success: true,
          order,
          initPoint: preferenceResult.init_point,
          preferenceId: preferenceResult.id
        })
      } catch (mpError) {
        console.error("Mercado Pago Preference creation error:", mpError)
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
        return NextResponse.json({
          success: true,
          order,
          initPoint: `${baseUrl}/checkout/success?orderId=${order.id}&mock=true`,
          preferenceId: "MOCK_PREFERENCE_ID"
        })
      }
    }

    // Dispatch event to SSE connections (Cash payment is immediate)
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
        },
        splitBill: {
          include: {
            _count: { select: { payments: true } }
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
