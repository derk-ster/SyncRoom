/**
 * Generate a simple room ID: XXXX-XXXX (2 groups of 4, each char is letter or digit).
 * When a room ends and everyone leaves, the room is removed from memory; the same
 * code can be generated again with the same probability as any other (no reservation).
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function segment(): string {
  return randomChar() + randomChar() + randomChar() + randomChar()
}

export function generateSimpleRoomId(): string {
  return `${segment()}-${segment()}`
}
