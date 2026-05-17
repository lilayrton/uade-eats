import { ShoppingCart } from "lucide-react"

interface CartEmptyProps {
  onBrowse: () => void
}

export function CartEmpty({ onBrowse }: CartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        {/* Outer ring */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#FFF0E6" }}
        >
          {/* Inner circle */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F97316" }}
          >
            <ShoppingCart size={32} className="text-white" strokeWidth={1.75} />
          </div>
        </div>
        {/* Floating dots decoration */}
        <span
          className="absolute top-2 right-0 w-4 h-4 rounded-full"
          style={{ backgroundColor: "#FED7AA" }}
        />
        <span
          className="absolute bottom-3 left-0 w-3 h-3 rounded-full"
          style={{ backgroundColor: "#FDBA74" }}
        />
        <span
          className="absolute top-6 left-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: "#FED7AA" }}
        />
      </div>

      {/* Copy */}
      <h2 className="text-xl font-black text-foreground leading-tight text-balance">
        Tu carrito est&aacute; vac&iacute;o
      </h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-balance max-w-[240px]">
        Todav&iacute;a no agregaste ning&uacute;n producto. &iexcl;Explorá los locales y pedí algo rico!
      </p>

      <button
        onClick={onBrowse}
        className="mt-8 px-6 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md active:scale-95 transition-transform duration-150"
        style={{ backgroundColor: "#F97316" }}
      >
        Ver locales
      </button>
    </div>
  )
}
