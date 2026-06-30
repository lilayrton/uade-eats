import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true, storeId: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const store = await db.store.findUnique({
      where: { id: user.storeId },
      select: { platformDebt: true, walletBalance: true }
    })

    if (!store) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
    }

    const { amount } = await req.json()
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    if (amount > store.platformDebt) {
      return NextResponse.json({ error: "No puedes pagar más de lo que debes" }, { status: 400 })
    }

    if (amount > store.walletBalance) {
      return NextResponse.json({ error: "Saldo insuficiente en la billetera" }, { status: 400 })
    }

    // Process the debt payment
    await db.$transaction([
      db.store.update({
        where: { id: user.storeId },
        data: {
          walletBalance: { decrement: amount },
          platformDebt: { decrement: amount }
        }
      }),
      db.storeWalletTransaction.create({
        data: {
          storeId: user.storeId,
          type: "withdrawal", // it acts like a withdrawal from the store's perspective
          amount: amount,
          description: `Pago de deuda a UADE Eats`
        }
      }),
      db.platformTransaction.create({
        data: {
          storeId: user.storeId,
          type: "debt_payment",
          amount: amount,
          description: `Cobro de deuda de local`
        }
      })
    ])

    return NextResponse.json({ success: true, message: "Deuda saldada correctamente" })
  } catch (error) {
    console.error("Pay debt error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
