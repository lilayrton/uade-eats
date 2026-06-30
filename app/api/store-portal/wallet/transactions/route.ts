import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
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

    const transactions = await db.storeWalletTransaction.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    return NextResponse.json({ success: true, transactions })

  } catch (error) {
    console.error("Store transactions error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
