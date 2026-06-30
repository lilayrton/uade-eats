import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { storeId: true, role: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const store = await db.store.findUnique({
      where: { id: user.storeId }
    })

    if (!store) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
    }

    if (!store.bankInfo) {
      return NextResponse.json({ error: "Debés configurar tu CVU/CBU/Alias en la sección Billetera antes de retirar fondos." }, { status: 400 })
    }

    if (store.walletBalance <= 0) {
      return NextResponse.json({ error: "No hay fondos suficientes para retirar" }, { status: 400 })
    }

    // Atomic transaction: decrease balance and create pending transaction
    await db.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: { walletBalance: 0 }
      })

      await tx.storeWalletTransaction.create({
        data: {
          storeId: store.id,
          type: "withdrawal",
          amount: -store.walletBalance,
          status: "pending",
          description: "Retiro a cuenta bancaria (Pendiente)"
        }
      })
    })

    return NextResponse.json({ success: true, message: "Retiro procesado con éxito" })

  } catch (error) {
    console.error("Store withdrawal error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
