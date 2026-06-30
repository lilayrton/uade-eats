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
      select: { role: true, storeId: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const store = await db.store.findUnique({
      where: { id: user.storeId },
      select: { isOpen: true, walletBalance: true, platformDebt: true, bankInfo: true }
    })

    if (!store) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, isOpen: store.isOpen, walletBalance: store.walletBalance, platformDebt: store.platformDebt, bankInfo: store.bankInfo })
  } catch (error) {
    console.error("Error fetching store status:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true, storeId: true }
    })

    if (!user || user.role !== "store_owner" || !user.storeId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { isOpen } = await req.json()
    if (typeof isOpen !== "boolean") {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const store = await db.store.update({
      where: { id: user.storeId },
      data: { isOpen }
    })

    return NextResponse.json({ success: true, isOpen: store.isOpen })
  } catch (error) {
    console.error("Error updating store status:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
