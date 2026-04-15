// Shared broadcast registry for SSE clients
const clients = new Map<string, (data: string) => void>()

export function addClient(id: string, fn: (d: string) => void) { clients.set(id, fn) }
export function removeClient(id: string) { clients.delete(id) }
export function broadcast(data: any) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  clients.forEach(fn => { try { fn(msg) } catch {} })
}
