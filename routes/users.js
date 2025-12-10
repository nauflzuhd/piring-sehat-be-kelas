import express from 'express'
import { getUserDailyCalorieTarget, updateUserDailyCalorieTarget, getUserProfileById } from '../services/usersService.js'

const router = express.Router()

// GET /api/users/me
/**
 * Mengembalikan profil user (id, email, username, role) berdasarkan req.user.supabaseUserId.
 *
 * Route: `GET /api/users/me`
 *
 * Perilaku:
 * - Mengembalikan HTTP 401 jika user tidak terautentikasi.
 * - Jika sukses, mengembalikan JSON `{ id, email, username, role }` di mana `id`, `email`, `username`, dan `role` adalah profil user yang terkait dengan req.user.supabaseUserId.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name GET/api/users/me
 * @function
 * @param {import('express').Request} req - Objek request Express dengan req.user.supabaseUserId.
 * @param {import('express').Response} res - Objek response Express untuk mengirim profil user.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/me', async (req, res) => {
  const userId = req.user?.supabaseUserId

  if (!userId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  try {
    const profile = await getUserProfileById(userId)
    res.json(profile)
  } catch (error) {
    console.error('Error getUserProfileById:', error)
    res.status(500).json({ error: 'Gagal mengambil profil user' })
  }
})

// GET /api/users/:id/daily-target
/**
 * Mengambil target kalori harian untuk seorang pengguna tertentu.
 *
 * Route: `GET /api/users/:id/daily-target`
 *
 * Params:
 * - `id` (string, wajib): ID pengguna (biasanya ID di database Supabase).
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Jika sukses, mengembalikan JSON `{ target }` di mana `target` adalah nilai target kalori harian (bisa null jika belum diset).
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name GET/api/users/:id/daily-target
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim target kalori harian.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/:id/daily-target', async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  try {
    const target = await getUserDailyCalorieTarget(id)
    res.json({ target })
  } catch (error) {
    console.error('Error getUserDailyCalorieTarget:', error)
    res.status(500).json({ error: 'Gagal mengambil target kalori harian' })
  }
})

// PUT /api/users/:id/daily-target
/**
 * Mengupdate atau menyimpan target kalori harian untuk seorang pengguna.
 *
 * Route: `PUT /api/users/:id/daily-target`
 *
 * Params:
 * - `id` (string, wajib): ID pengguna.
 *
 * Body JSON:
 * - `target` (number, opsional tetapi sebaiknya diisi): Nilai target kalori harian yang baru.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Jika sukses, mengembalikan JSON `{ target: saved }` di mana `saved` adalah nilai target yang tersimpan di database.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name PUT/api/users/:id/daily-target
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id` dan body `target`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim target kalori yang tersimpan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.put('/:id/daily-target', async (req, res) => {
  const { id } = req.params
  const { target } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  try {
    const saved = await updateUserDailyCalorieTarget(id, target)
    res.json({ target: saved })
  } catch (error) {
    console.error('Error updateUserDailyCalorieTarget:', error)
    res.status(500).json({ error: 'Gagal mengupdate target kalori harian' })
  }
})

export default router