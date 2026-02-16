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
  const doFetch = async (): Promise<string> => {
    const res = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`HTTP_${res.status}`)
    const data = (await res.json()) as CreateRoomResponse
    if (!data?.roomId) throw new Error('INVALID_RESPONSE')
    return data.roomId
  }

  try {
    return await doFetch()
  } catch (firstErr) {
    const isNetwork =
      firstErr instanceof Error &&
      (firstErr.constructor?.name === 'AbortError' ||
        /fetch|network|failed|connection|refused|abort|timeout/i.test(firstErr.message))
    if (isNetwork) {
      await wakeServer()
      await new Promise((r) => setTimeout(r, 5000))
      try {
        return await doFetch()
      } catch {
        throw new Error(`BACKEND_UNREACHABLE|${API_URL}`)
      }
    }
    throw firstErr instanceof Error ? firstErr : new Error(String(firstErr))
  }
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
