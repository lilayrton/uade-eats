import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        storeId: updatedUser.storeId
      } 
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
