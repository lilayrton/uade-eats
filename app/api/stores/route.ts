import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const stores = await db.store.findMany({
      orderBy: { name: "asc" }
    })
    return NextResponse.json({ success: true, stores })
  } catch (error) {
    console.error("Error fetching stores:", error)
    return NextResponse.json({ success: false, error: "Error al cargar los locales" }, { status: 500 })
  }
}
