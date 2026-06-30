"use client"

import { useState } from "react"
import { useApp } from "@/context/AppContext"

export default function LoginPage() {
  const { dispatch } = useApp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.toLowerCase().trim()
    if (!trimmed) {
      setError("Ingresá tu correo electrónico")
      return
    }
    if (!password) {
      setError("Ingresá tu contraseña")
      return
    }
    
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      dispatch({ type: "LOGIN", payload: data.user })
      localStorage.setItem("uade-eats-user", JSON.stringify(data.user))
      document.cookie = "uade-eats-auth=1; path=/"
      
      if (data.user.role === "store_owner") {
        window.location.replace("/store-portal")
      } else if (data.user.role === "admin") {
        window.location.replace("/admin")
      } else {
        window.location.replace("/")
      }
    } catch (err) {
      setError("Error de conexión")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center relative"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      <div className="w-full max-w-[480px] min-h-svh flex flex-col justify-center bg-background relative">
        {/* Main card */}
        <div className="px-6 py-12 space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
              UADE{" "}
              <span style={{ color: "#F97316" }} className="font-black">
                EATS
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Ingresá con tu mail universitario
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                }}
                placeholder="tu.nombre@uade.edu.ar"
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError("")
                }}
                placeholder="Contraseña"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
                disabled={loading}
              />
              {error && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#F97316" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Link to register */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <a href="/register" className="font-semibold" style={{ color: "#F97316" }}>
                Registrate
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-10 text-center absolute bottom-0 left-0 right-0">
          <p className="text-[11px] text-muted-foreground">
            UADevs — Grupo 5
          </p>
        </div>
      </div>
    </div>
  )
}
