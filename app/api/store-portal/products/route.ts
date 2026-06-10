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
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const products = await db.product.findMany({
      where: { storeId: user.storeId },
      orderBy: [
        { name: "asc" }
      ],
      include: {
        category: true
      }
    })

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error("Error fetching portal products:", error)
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
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const { name, price, description, categoryId, imageUrl } = await req.json()
    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ error: "Nombre, precio y categoría requeridos" }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        storeId: user.storeId,
        name: name.trim(),
        price: parseFloat(price),
        description: (description || "").trim(),
        categoryId: categoryId,
        imageUrl: (imageUrl || "/images/placeholder.jpg").trim()
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
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
      return NextResponse.json({ error: "Acceso denegado. Se requiere cuenta de Comedor" }, { status: 403 })
    }

    const { id, name, price, description, categoryId, imageUrl } = await req.json()
    if (!id || !name || price === undefined || !categoryId) {
      return NextResponse.json({ error: "Datos del producto incompletos" }, { status: 400 })
    }

    // Verify product belongs to owner's store
    const existingProduct = await db.product.findFirst({
      where: { id, storeId: user.storeId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado o no pertenece a tu local" }, { status: 404 })
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: name.trim(),
        price: parseFloat(price),
        description: (description || "").trim(),
        categoryId: categoryId,
        imageUrl: (imageUrl || "/images/placeholder.jpg").trim()
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 })
    }

    // Verify product belongs to owner's store
    const existingProduct = await db.product.findFirst({
      where: { id, storeId: user.storeId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado o no pertenece a tu local" }, { status: 404 })
    }

    await db.product.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
