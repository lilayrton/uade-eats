type Listener = (data: string) => void

const globalForEvents = globalThis as unknown as {
  listeners: Set<Listener> | undefined
}

const listeners = globalForEvents.listeners ?? new Set<Listener>()
if (process.env.NODE_ENV !== "production") globalForEvents.listeners = listeners

export function addListener(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dispatchEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data })
  listeners.forEach((listener) => {
    try {
      listener(payload)
    } catch (e) {
      // Silent error: listener might have disconnected
    }
  })
}
