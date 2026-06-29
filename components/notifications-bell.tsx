"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Bell } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { NotificationsPanel } from "@/components/notifications-panel"

export function NotificationsBell() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const unreadCount = state.notifications.filter((n) => !n.read).length

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {mounted && createPortal(
        <NotificationsPanel
          open={open}
          onClose={() => setOpen(false)}
          notifications={state.notifications}
          onMarkRead={(id) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: { id } })}
          onMarkAllRead={() => dispatch({ type: "MARK_ALL_READ" })}
        />,
        document.body
      )}
    </>
  )
}
