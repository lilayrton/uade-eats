"use client"

import { useState, useEffect } from "react"
import { Bell, ShoppingBag, Tag } from "lucide-react"
import type { Notification } from "@/lib/types"

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

const CLOSE_ANIMATION_MS = 250

function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} h`
  return "Ayer"
}

function NotifIcon({ type, read }: { type: Notification["type"]; read: boolean }) {
  const Icon = type === "order" ? ShoppingBag : type === "promo" ? Tag : Bell
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={
        read
          ? undefined
          : { backgroundColor: "#FFF0E6" }
      }
      data-read={read}
    >
      <Icon
        size={18}
        style={{ color: read ? undefined : "#F97316" }}
        className={read ? "text-muted-foreground" : undefined}
      />
    </div>
  )
}

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length
  const [shouldRender, setShouldRender] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setClosing(false)
    }
  }, [open])

  if (!shouldRender) return null

  function handleClose() {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setShouldRender(false)
      onClose()
    }, CLOSE_ANIMATION_MS)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ transitionDuration: `${CLOSE_ANIMATION_MS}ms` }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div
          className={`relative w-full max-w-[480px] bg-background rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col pointer-events-auto ${
            closing ? "animate-out slide-out-to-bottom" : "animate-in slide-in-from-bottom-4"
          }`}
          style={{ animationDuration: `${CLOSE_ANIMATION_MS}ms` }}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-base font-bold text-foreground">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-medium"
                style={{ color: "#F97316" }}
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Bell size={32} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No tenés notificaciones</span>
              </div>
            ) : (
              notifications.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    i < notifications.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <NotifIcon type={n.type} read={n.read} />

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        n.read ? "font-normal text-muted-foreground" : "font-semibold text-foreground"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>{relativeTime(n.timestamp)}</p>
                  </div>

                  {!n.read && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: "#F97316" }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
