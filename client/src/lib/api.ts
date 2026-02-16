/**
 * REST API helpers. Used to create rooms (and wake server on Render) before Socket.io connect.
 */

import { API_URL } from './constants'

export interface CreateRoomResponse {
  roomId: string
}

/** Wake the server (e.g. Render free tier) by hitting health. */
export async function wakeServer(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(10000) })
  } catch {
    /* ignore */
  }
}

/** Create a room via REST. Server creates a pending room; client then joins via Socket.io to claim as host. */
export async function createRoomViaApi(): Promise<string> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const name = err instanceof Error ? err.constructor?.name : ''
    const isNetwork =
      name === 'AbortError' || /fetch|network|failed|connection|refused|abort|timeout/i.test(message)
    if (isNetwork) throw new Error('BACKEND_UNREACHABLE')
    throw err
  }
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const data = (await res.json()) as CreateRoomResponse
  if (!data?.roomId) throw new Error('INVALID_RESPONSE')
  return data.roomId
}

/** Check if a room exists (optional; also wakes server). */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(roomId)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { exists: boolean }
    return data.exists
  } catch {
    return false
  }
}
