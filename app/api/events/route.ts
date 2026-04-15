export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { addClient, removeClient } from '../../../lib/broadcast'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

export async function GET(req: NextRequest) {
  const clientId = Math.random().toString(36).slice(2)

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try { controller.enqueue(new TextEncoder().encode(data)) } catch {}
      }
      addClient(clientId, send)

      // Send current state immediately
      if (fs.existsSync(STATE_FILE)) {
        try {
          const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
          send(`data: ${JSON.stringify(state)}\n\n`)
        } catch {}
      }

      const interval = setInterval(() => {
        try { send(': keepalive\n\n') } catch { clearInterval(interval) }
      }, 15000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        removeClient(clientId)
        try { controller.close() } catch {}
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
