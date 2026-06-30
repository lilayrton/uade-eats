import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true }
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { transactionId, action } = await req.json()
    
    if (!transactionId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const tx = await db.storeWalletTransaction.findUnique({
      where: { id: transactionId },
      include: { store: true }
    })

    if (!tx || tx.type !== "withdrawal" || tx.status !== "pending") {
      return NextResponse.json({ error: "Transacción no válida o ya procesada" }, { status: 400 })
    }

    if (action === "approve") {
      await db.storeWalletTransaction.update({
        where: { id: transactionId },
        data: { 
          status: "completed",
          description: "Retiro a cuenta bancaria (Completado)"
        }
      })
    } else if (action === "reject") {
      // Refund the money back to the store
      await db.$transaction(async (prisma) => {
        await prisma.storeWalletTransaction.update({
          where: { id: transactionId },
          data: { 
            status: "rejected",
            description: "Retiro rechazado (Reembolsado)"
          }
        })
        
        await prisma.store.update({
          where: { id: tx.storeId },
          data: { walletBalance: { increment: Math.abs(tx.amount) } }
        })
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
