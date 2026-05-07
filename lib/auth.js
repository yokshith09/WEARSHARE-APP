import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'wearshare-secret-2024'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = request.headers.get('cookie')
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}
