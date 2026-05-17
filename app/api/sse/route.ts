import { NextRequest } from "next/server"
import { addListener } from "@/lib/events"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  let unsubscribe: () => void = () => {}
  let keepAliveInterval: NodeJS.Timeout

  const responseStream = new ReadableStream({
    start(controller) {
      // Send initial ping to keep the stream open
      controller.enqueue(new TextEncoder().encode(": ping\n\n"))

      // Send a periodic keep-alive comment every 30 seconds
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"))
        } catch {
          clearInterval(keepAliveInterval)
        }
      }, 30000)

      unsubscribe = addListener((payload) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`))
        } catch {
          // controller is closed, unsubscribe is handled automatically on cancel
        }
      })
    },
    cancel() {
      unsubscribe()
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
      }
    }
  })

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    }
  })
}
