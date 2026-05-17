"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"

interface FieldErrors {
  nombre: string
  email: string
  password: string
  confirmPassword: string
  storeId?: string
  server?: string
}

const emptyErrors: FieldErrors = {
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
  storeId: "",
}

export default function RegisterPage() {
  const { dispatch } = useApp()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "store_owner">("student")
  const [storeId, setStoreId] = useState("")
  const [stores, setStores] = useState<any[]>([])
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role === "store_owner" && stores.length === 0) {
      fetch("/api/stores")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStores(data.stores)
          }
        })
        .catch(console.error)
    }
  }, [role, stores.length])

  function validateField(field: keyof FieldErrors, value: string): string {
    switch (field) {
      case "nombre":
        return value.trim() === "" ? "El nombre no puede estar vacío" : ""
      case "email":
        if (value.trim() === "") return "El email es requerido"
        if (!value.includes("@")) return "Email inválido"
        if (role === "student" && !value.toLowerCase().trim().endsWith("@uade.edu.ar")) {
          return "Solo podés registrarte con un mail @uade.edu.ar"
        }
        return ""
      case "password":
        if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres"
        if (!/[a-z]/.test(value)) return "Debe incluir al menos una letra minúscula"
        if (!/[A-Z]/.test(value)) return "Debe incluir al menos una letra mayúscula"
        if (!/[0-9]/.test(value)) return "Debe incluir al menos un número"
        return ""
      case "confirmPassword":
        return value !== password ? "Las contraseñas no coinciden" : ""
      case "storeId":
        return role === "store_owner" && value === "" ? "Debés seleccionar un local" : ""
      default:
        return ""
    }
  }

  function handleBlur(field: keyof FieldErrors, value: string) {
    if (!submitted) return
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value), server: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setErrors(prev => ({ ...prev, server: "" }))

    const newErrors: FieldErrors = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
      storeId: validateField("storeId", storeId),
    }
    setErrors(newErrors)

    const hasErrors = Object.keys(newErrors).some((k) => k !== "server" && newErrors[k as keyof typeof newErrors] !== "")
    if (hasErrors) return

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.toLowerCase().trim(),
          password,
          role,
          storeId: role === "store_owner" ? storeId : undefined
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors(prev => ({ ...prev, server: data.error || "Error al registrarse" }))
        setLoading(false)
        return
      }

      dispatch({ type: "LOGIN", payload: data.user })
      
      // Redirect based on role
      if (data.user.role === "store_owner") {
        window.location.replace("/store-portal")
      } else {
        window.location.replace("/")
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, server: "Error de conexión" }))
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
              {role === "student" ? "Creá tu cuenta universitaria" : "Registrá tu comedor o local"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.server && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center">
                {errors.server}
              </div>
            )}

            {/* Account Type Selector */}
            <div className="flex bg-[#F3F4F6] p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setRole("student")
                  setErrors(emptyErrors)
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  role === "student"
                    ? "bg-white text-[#1C1917] shadow-sm"
                    : "text-muted-foreground hover:text-[#1C1917]"
                }`}
              >
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("store_owner")
                  setErrors(emptyErrors)
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  role === "store_owner"
                    ? "bg-white text-[#1C1917] shadow-sm"
                    : "text-muted-foreground hover:text-[#1C1917]"
                }`}
              >
                Comedor
              </button>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (submitted) setErrors((prev) => ({ ...prev, nombre: validateField("nombre", e.target.value) }))
                }}
                onBlur={(e) => handleBlur("nombre", e.target.value)}
                placeholder={role === "student" ? "Nombre" : "Nombre del Administrador"}
                autoComplete="name"
                disabled={loading}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
              />
              {errors.nombre && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Local Dropdown for Store Owners */}
            {role === "store_owner" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <select
                    value={storeId}
                    onChange={(e) => {
                      setStoreId(e.target.value)
                      if (submitted) setErrors((prev) => ({ ...prev, storeId: validateField("storeId", e.target.value) }))
                    }}
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors appearance-none"
                  >
                    <option value="">Selecciona tu local comedor</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {errors.storeId && (
                  <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                    {errors.storeId}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (submitted) setErrors((prev) => ({ ...prev, email: validateField("email", e.target.value) }))
                }}
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder={role === "student" ? "usuario@uade.edu.ar" : "email@proveedor.com"}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
              />
              {errors.email && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (submitted) {
                    setErrors((prev) => ({
                      ...prev,
                      password: validateField("password", e.target.value),
                      confirmPassword: confirmPassword !== e.target.value ? "Las contraseñas no coinciden" : "",
                    }))
                  }
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                placeholder="Contraseña (mín. 8 caracteres)"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
              />
              {errors.password && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (submitted) setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", e.target.value) }))
                }}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#F97316" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          {/* Link to login */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="font-semibold" style={{ color: "#F97316" }}>
                Iniciá sesión
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
