"use client"

interface VendorStatusToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function VendorStatusToggle({ isOpen, onToggle }: VendorStatusToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-colors"
      style={{ backgroundColor: isOpen ? "#22C55E" : "#EF4444" }}
      aria-label={isOpen ? "Local abierto, click para cerrar" : "Local cerrado, click para abrir"}
    >
      ● {isOpen ? "Abierto" : "Cerrado"}
    </button>
  )
}
