import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
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
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador." }, { status: 403 })
    }

    // 1. Fetch transactions
    const transactions = await db.platformTransaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        store: {
          select: { name: true }
        }
      }
    })

    // 2. Fetch stores with their balances
    const stores = await db.store.findMany({
      select: {
        id: true,
        name: true,
        platformDebt: true,
        walletBalance: true,
        isOpen: true,
      },
      orderBy: { name: "asc" }
    })

    // 3. Calculate metrics
    let liquidCash = 0

    for (const tx of transactions) {
      if (tx.type === "service_fee" || tx.type === "debt_payment") {
        liquidCash += tx.amount
      }
    }

    // Debt from stores (Dinero pendiente de cobro por pedidos en efectivo)
    const totalPendingDebt = stores.reduce((sum, store) => sum + store.platformDebt, 0)
    
    // Total histórico generado = lo que ya cobramos + lo que nos deben
    const totalServiceFeeGenerated = liquidCash + totalPendingDebt

    // 4. Fetch pending withdrawals
    const pendingWithdrawals = await db.storeWalletTransaction.findMany({
      where: {
        type: "withdrawal",
        status: "pending"
      },
      include: {
        store: {
          select: { name: true, bankInfo: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      success: true,
      metrics: {
        totalServiceFeeGenerated,
        totalPendingDebt,
        liquidCash,
      },
      stores,
      transactions,
      pendingWithdrawals,
    })
  } catch (error) {
    console.error("Admin metrics error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
