"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Lock } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { toast } from "sonner"

export default function PersonalInfoPage() {
  const router = useRouter()
  const { state } = useApp()
  const user = state.user

  const initials = user
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
    : "?"

  const roleLabel =
    user?.role === "faculty" ? "Docente" : user?.role === "staff" ? "Staff" : "Estudiante"

  const [name, setName] = useState(user?.name ?? "")

  const handleSave = () => {
    toast.success("Cambios guardados ✓")
  }

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-svh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0"
          aria-label="Volver"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Información personal</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Avatar card */}
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ backgroundColor: "#F97316" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base text-foreground leading-tight">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>
        </div>

        {/* Fields */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Tus datos
          </p>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Mail universitario
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm text-muted-foreground pr-10"
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Rol
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roleLabel}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm text-muted-foreground pr-10"
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ backgroundColor: "#F97316" }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
