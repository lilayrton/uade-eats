import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
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

    const categories = await db.category.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const { action, name, id, newName } = await req.json()

    if (action === "create") {
      if (!name) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 })
      
      const category = await db.category.create({
        data: {
          name: name.trim(),
          storeId: user.storeId
        }
      })
      return NextResponse.json({ success: true, category })
    } 
    else if (action === "rename") {
      if (!id || !newName) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
      
      const category = await db.category.update({
        where: { id, storeId: user.storeId },
        data: { name: newName.trim() }
      })
      return NextResponse.json({ success: true, category })
    } 
    else if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 })
      
      await db.category.delete({
        where: { id, storeId: user.storeId }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error: any) {
    console.error("Error managing categories:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
