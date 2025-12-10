import express from 'express'
import { syncFirebaseUser } from '../services/usersService.js'

const router = express.Router()

// POST /api/auth/sync-user
// body: { firebase_uid, email, username }
/**
 * Endpoint untuk sinkronisasi data user Firebase ke database Supabase.
 *
 * Route: `POST /api/auth/sync-user`
 *
 * Body request:
 * - `firebase_uid` (string, wajib): UID user dari Firebase Authentication.
 * - `email` (string, opsional): Alamat email user.
 * - `username` (string, opsional): Nama pengguna yang akan disimpan di Supabase.
 *
 * Perilaku:
 * - Jika `firebase_uid` tidak dikirim, mengembalikan HTTP 400 dengan pesan error.
 * - Jika valid, fungsi akan memanggil `syncFirebaseUser` untuk membuat/memperbarui user di Supabase.
 * - Respons sukses berupa JSON `{ id }` di mana `id` adalah ID user di tabel Supabase.
 * - Jika terjadi error saat sinkronisasi, akan mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name POST/api/auth/sync-user
 * @function
 * @param {import('express').Request} req - Objek request Express yang berisi body JSON.
 * @param {import('express').Response} res - Objek response Express untuk mengirim hasil sinkronisasi.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
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