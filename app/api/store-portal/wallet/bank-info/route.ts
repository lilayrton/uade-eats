import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

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

    const { bankInfo } = await req.json()
    
    if (typeof bankInfo !== "string") {
      return NextResponse.json({ error: "CVU/CBU/Alias inválido" }, { status: 400 })
    }

    await db.store.update({
      where: { id: user.storeId },
      data: { bankInfo }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating bank info:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
