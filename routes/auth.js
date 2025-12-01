import express from 'express'
import { syncFirebaseUser } from '../services/usersService.js'

const router = express.Router()

// POST /api/auth/sync-user
// body: { firebase_uid, email, username }
router.post('/sync-user', async (req, res) => {
  const { firebase_uid, email, username } = req.body

  if (!firebase_uid) {
    return res.status(400).json({ error: 'firebase_uid wajib diisi' })
  }

  try {
    const id = await syncFirebaseUser({ firebase_uid, email, username })
    res.json({ id })
  } catch (error) {
    console.error('Error syncFirebaseUser:', error)
    res.status(500).json({ error: 'Gagal sinkronisasi user ke Supabase' })
  }
})

export default router
