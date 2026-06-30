import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, peopleCount } = body

    const people = Number(peopleCount)
    if (!orderId || !Number.isInteger(people) || people < 2 || people > 10) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { splitBill: true },
    })

    if (!order) {
      return NextResponse.json({ error: "El pedido no existe" }, { status: 404 })
    }
    if (order.userId !== session.id) {
      return NextResponse.json({ error: "Solo el dueño del pedido puede dividirlo" }, { status: 403 })
    }

    const amountPerPerson = Math.round((order.total / people) * 100) / 100

    // Si ya existe una división para este pedido, la reutilizamos (mismo código).
    // Si todavía no hay pagos, permitimos actualizar la cantidad de personas.
    if (order.splitBill) {
      const existingPayments = await db.splitPayment.count({
        where: { splitBillId: order.splitBill.id },
      })

      let split = order.splitBill
      if (existingPayments === 0 && split.peopleCount !== people) {
        split = await db.splitBill.update({
          where: { id: split.id },
          data: { peopleCount: people, amountPerPerson },
        })
      }

      return NextResponse.json({
        success: true,
        code: split.code,
        total: order.total,
        peopleCount: split.peopleCount,
        amountPerPerson: split.amountPerPerson,
      })
    }

    // Generar un código único, reintentando ante colisión del @unique
    let split = null
    for (let attempt = 0; attempt < 5 && !split; attempt++) {
      const code = generateCode()
      try {
        split = await db.splitBill.create({
          data: {
            code,
            orderId: order.id,
            creatorId: session.id,
            peopleCount: people,
            amountPerPerson,
          },
        })
      } catch (e: any) {
        // P2002 = unique constraint (code). Reintentamos con otro código.
        if (e?.code === "P2002" && e?.meta?.target?.includes("code")) {
          continue
        }
        throw e
      }
    }

    if (!split) {
      return NextResponse.json({ error: "No se pudo generar el código, intentá de nuevo" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code: split.code,
      total: order.total,
      peopleCount: split.peopleCount,
      amountPerPerson: split.amountPerPerson,
    })
  } catch (error) {
    console.error("Split bill creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
