import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "El mail no se encuentra registrado" }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    const session = await encrypt({ id: user.id, email: user.email, role: user.role })
    const cookieStore = await cookies()
    cookieStore.set("uade-eats-session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    
    // Also set the old auth cookie for frontend backward compatibility
    cookieStore.set("uade-eats-auth", "1", { path: "/" })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, storeId: user.storeId } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
