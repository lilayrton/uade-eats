import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
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

    const paidCount = split.payments.length
    const slotsLeft = split.peopleCount - 1 - paidCount

    return NextResponse.json({
      success: true,
      storeName: split.order.store.name,
      total: split.order.total,
      peopleCount: split.peopleCount,
      amountPerPerson: split.amountPerPerson,
      paidCount,
      slotsLeft,
      isCreator: split.order.userId === session.id,
      alreadyPaid: split.payments.some((p) => p.payerId === session.id),
    })
  } catch (error) {
    console.error("Split bill lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
