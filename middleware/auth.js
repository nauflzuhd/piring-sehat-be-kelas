import { adminAuth } from '../firebaseAdmin.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing token' })
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    req.firebaseUser = decoded
    next()
  } catch (error) {
    console.error('Error verifyIdToken:', error)
    return res.status(401).json({ error: 'Unauthorized: invalid token' })
  }
}
