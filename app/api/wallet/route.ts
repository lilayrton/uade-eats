import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        walletBalance: true,
        walletTransactions: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      balance: user.walletBalance,
      transactions: user.walletTransactions
    })
  } catch (error) {
    console.error("Wallet fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
