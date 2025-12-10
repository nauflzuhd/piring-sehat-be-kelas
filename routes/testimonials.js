import express from 'express'
import {
  addTestimoni,
  getAllTestimonials,
  getTestimonialsByUserId,
} from '../services/testimoniService.js'

export const testimonialsRouter = express.Router()
const router = testimonialsRouter

/**
 * GET /api/testimonials
 * Mengambil semua testimoni yang tersimpan di database.
 *
 * Response:
 * - 200: Array testimoni (bisa kosong jika tidak ada atau error)
 */
router.get('/', async (req, res) => {
  const testimonials = await getAllTestimonials()
  res.json(testimonials)
})

/**
 * GET /api/testimonials/user/:userId
 * Mengambil testimoni berdasarkan ID user.
 *
 * Params:
 * - userId (string, wajib): ID user
 *
 * Response:
 * - 200: Array testimoni dari user tersebut
 * - 400: userId tidak dikirim
 * - 500: Error server
 */
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params

  if (!userId) {
    return res.status(400).json({ error: 'userId wajib diisi' })
  }

  try {
    const testimonials = await getTestimonialsByUserId(Number(userId))
    res.json(testimonials)
  } catch (error) {
    console.error('Error getTestimonialsByUserId:', error)
    res.status(500).json({ error: 'Gagal mengambil testimoni user' })
  }
})

/**
 * POST /api/testimonials
 * Menambahkan testimoni baru dari user yang terautentikasi.
 *
 * Body JSON:
 * - username (string, wajib): Username pengguna
 * - job (string, wajib): Pekerjaan/profesi pengguna
 * - message (string, wajib): Pesan testimoni
 *
 * Response:
 * - 201: Testimoni berhasil dibuat
 * - 400: Data tidak lengkap
 * - 500: Error server
 *
 * Note: userId diambil dari Firebase token yang sudah diverifikasi oleh middleware requireAuth.
 * Middleware ini menyimpan supabaseUserId di req.user.supabaseUserId.
 */
router.post('/', async (req, res) => {
  const { username, job, message } = req.body
  const userId = req.user?.supabaseUserId

  if (!userId) {
    return res.status(400).json({ error: 'User tidak terautentikasi' })
  }

  if (!username || !job || !message) {
    return res.status(400).json({ error: 'username, job, dan message wajib diisi' })
  }

  try {
    const testimonial = await addTestimoni({
      userId,
      username,
      job,
      message,
    })
    res.status(201).json(testimonial)
  } catch (error) {
    console.error('Error addTestimoni:', error)
    res.status(500).json({ error: 'Gagal menambahkan testimoni' })
  }
})

export default router
