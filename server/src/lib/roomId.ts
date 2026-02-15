/**
 * Generate a simple room ID: XXXX-XXXX-XXXX-XXXX (each char is letter or digit).
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function segment(): string {
  return randomChar() + randomChar() + randomChar() + randomChar()
}

export function generateSimpleRoomId(): string {
  return `${segment()}-${segment()}-${segment()}-${segment()}`
}
