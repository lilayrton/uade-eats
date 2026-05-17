import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { nombre, email, password, role = "student", storeId } = await req.json()

    if (role === "student") {
      if (!email || !email.endsWith("@uade.edu.ar")) {
        return NextResponse.json({ error: "Solo podés registrarte con un mail @uade.edu.ar" }, { status: 400 })
      }
    } else if (role === "store_owner") {
      if (!email) {
        return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
      }
      if (!storeId) {
        return NextResponse.json({ error: "Debés seleccionar un local o comedor" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "La contraseña no cumple los requisitos de seguridad" }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name: nombre,
        email,
        passwordHash,
        role,
        storeId: role === "store_owner" ? storeId : null
      },
    })

    // Auto-login
    const session = await encrypt({ id: user.id, email: user.email, role: user.role })
    const cookieStore = await cookies()
    cookieStore.set("uade-eats-session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    
    // Also set the old auth cookie for frontend backward compatibility until fully replaced
    cookieStore.set("uade-eats-auth", "1", { path: "/" })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
