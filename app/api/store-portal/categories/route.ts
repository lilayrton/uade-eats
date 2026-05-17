import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

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
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const { action, oldCategory, newCategory } = await req.json()

    if (action === "rename") {
      if (!oldCategory || !newCategory) {
        return NextResponse.json({ error: "Faltan parámetros de renombrado" }, { status: 400 })
      }

      // Bulk update all matching products
      const result = await db.product.updateMany({
        where: {
          storeId: user.storeId,
          category: oldCategory.trim()
        },
        data: {
          category: newCategory.trim()
        }
      })

      return NextResponse.json({ success: true, count: result.count })
    } else if (action === "delete") {
      if (!oldCategory) {
        return NextResponse.json({ error: "Falta el nombre de la categoría a eliminar" }, { status: 400 })
      }

      // Set category of these products to "Sin categoría"
      const result = await db.product.updateMany({
        where: {
          storeId: user.storeId,
          category: oldCategory.trim()
        },
        data: {
          category: "Sin categoría"
        }
      })

      return NextResponse.json({ success: true, count: result.count })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error managing categories in bulk:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
