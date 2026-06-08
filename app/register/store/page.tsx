"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"

interface Store {
  id: string
  name: string
}

interface FieldErrors {
  nombre: string
  email: string
  password: string
  confirmPassword: string
  storeId: string
  server?: string
}

const emptyErrors: FieldErrors = {
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
  storeId: "",
}

export default function RegisterStorePage() {
  const { dispatch } = useApp()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [storeId, setStoreId] = useState("")
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores")
        const data = await res.json()
        if (data.success) {
          setStores(data.stores)
        }
      } catch (err) {
        console.error("Error fetching stores", err)
      } finally {
        setLoadingStores(false)
      }
    }
    fetchStores()
  }, [])

  const role = "store_owner"

  function validateField(field: keyof FieldErrors, value: string): string {
    switch (field) {
      case "nombre":
        return value.trim() === "" ? "El nombre no puede estar vacío" : ""
      case "email":
        if (value.trim() === "") return "El email es requerido"
        if (!value.includes("@")) return "Email inválido"
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
        return value === "" ? "Debés seleccionar un local" : ""
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
          storeId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors(prev => ({ ...prev, server: data.error || "Error al registrarse" }))
        setLoading(false)
        return
      }

      dispatch({ type: "LOGIN", payload: data.user })
      window.location.replace("/store-portal")
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
              Registro para locales
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.server && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center">
                {errors.server}
              </div>
            )}

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
                placeholder="Nombre del responsable"
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

            {/* Local */}
            <div className="space-y-1.5">
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value)
                  if (submitted) setErrors((prev) => ({ ...prev, storeId: validateField("storeId", e.target.value) }))
                }}
                onBlur={(e) => handleBlur("storeId", e.target.value)}
                disabled={loading || loadingStores}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition-colors appearance-none"
              >
                <option value="">Seleccioná tu local</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              {errors.storeId && (
                <p className="text-xs font-medium px-1" style={{ color: "#EF4444" }}>
                  {errors.storeId}
                </p>
              )}
            </div>

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
                placeholder="Email de contacto"
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
              {loading ? "Creando cuenta..." : "Crear cuenta de local"}
            </button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Sos alumno?{" "}
              <a href="/register" className="font-semibold" style={{ color: "#F97316" }}>
                Registrate acá
              </a>
            </p>
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
