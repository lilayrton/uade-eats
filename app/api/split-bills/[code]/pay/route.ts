import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await params

    const split = await db.splitBill.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        order: { include: { store: true } },
        payments: true,
      },
    })

    if (!split) {
      return NextResponse.json({ error: "No encontramos un pedido con ese código" }, { status: 404 })
    }

    if (split.order.userId === session.id) {
      return NextResponse.json(
        { error: "Sos quien generó la división, no podés pagar tu propia parte" },
        { status: 400 }
      )
    }

    if (split.payments.some((p) => p.payerId === session.id)) {
      return NextResponse.json({ error: "Ya pagaste tu parte de este pedido" }, { status: 400 })
    }

    const slotsLeft = split.peopleCount - 1 - split.payments.length
    if (slotsLeft <= 0) {
      return NextResponse.json({ error: "Esta división ya está completa" }, { status: 400 })
    }

    const payer = await db.user.findUnique({ where: { id: session.id } })
    if (!payer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (payer.walletBalance < split.amountPerPerson) {
      return NextResponse.json({ error: "Saldo insuficiente en tu wallet" }, { status: 400 })
    }

    const amount = split.amountPerPerson
    const storeName = split.order.store.name

    await db.$transaction([
      // Debitar al que paga
      db.user.update({
        where: { id: session.id },
        data: { walletBalance: { decrement: amount } },
      }),
      // Reembolsar al creador del pedido
      db.user.update({
        where: { id: split.creatorId },
        data: { walletBalance: { increment: amount } },
      }),
      // Registrar el pago de la parte (unique [splitBillId, payerId] evita duplicados)
      db.splitPayment.create({
        data: {
          splitBillId: split.id,
          payerId: session.id,
          amount,
        },
      }),
      // Movimiento en la wallet del que paga
      db.walletTransaction.create({
        data: {
          userId: session.id,
          type: "split_payment",
          amount: -amount,
          status: "completed",
          description: `Tu parte de ${storeName}`,
        },
      }),
      // Movimiento en la wallet del creador
      db.walletTransaction.create({
        data: {
          userId: split.creatorId,
          type: "split_received",
          amount,
          status: "completed",
          description: `Parte de pedido dividido (${storeName})`,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      balance: payer.walletBalance - amount,
    })
  } catch (error: any) {
    // Carrera: dos pagos simultáneos del mismo usuario chocan con el unique
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya pagaste tu parte de este pedido" }, { status: 400 })
    }
    console.error("Split bill payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
