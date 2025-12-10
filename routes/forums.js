import express from 'express'
import {
  getAllForums,
  getForumById,
  createForum,
  updateForum,
  deleteForum,
} from '../services/forumsService.js'
const router = express.Router()

// GET /api/forums
/**
 * Mengambil daftar semua forum yang tersedia.
 *
 * Route: `GET /api/forums`
 *
 * Perilaku:
 * - Memanggil `getAllForums()` dari layanan untuk mengambil data forum.
 * - Jika sukses, mengembalikan JSON `{ data: Forum[] }`.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name GET/api/forums
 * @function
 * @param {import('express').Request} req - Objek request Express.
 * @param {import('express').Response} res - Objek response Express untuk mengirim daftar forum.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/', async (req, res) => {
  try {
    const forums = await getAllForums()
    res.json({ data: forums })
  } catch (error) {
    console.error('Error getAllForums:', error)
    res.status(500).json({ error: 'Gagal mengambil data forums' })
  }
})

// GET /api/forums/:id
/**
 * Mengambil detail satu forum berdasarkan ID.
 *
 * Route: `GET /api/forums/:id`
 *
 * Params:
 * - `id` (string, wajib): ID forum.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Jika forum tidak ditemukan, mengembalikan HTTP 404 dengan pesan kesalahan.
 * - Jika sukses, mengembalikan JSON `{ data: Forum }`.
 *
 * @name GET/api/forums/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim detail forum.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  try {
    const forum = await getForumById(Number(id))
    if (!forum) {
      return res.status(404).json({ error: 'Forum tidak ditemukan' })
    }
    res.json({ data: forum })
  } catch (error) {
    console.error('Error getForumById:', error)
    res.status(500).json({ error: 'Gagal mengambil detail forum' })
  }
})

// POST /api/forums
/**
 * Membuat forum baru oleh user yang terautentikasi.
 *
 * Route: `POST /api/forums`
 *
 * Body JSON:
 * - `title` (string, wajib): Judul forum.
 * - `content` (string, wajib): Isi/konten forum.
 *
 * Perilaku:
 * - Mengembalikan HTTP 401 jika user belum terautentikasi (req.user.supabaseUserId tidak ada).
 * - Mengembalikan HTTP 400 jika `title` atau `content` tidak diisi.
 * - Jika sukses, mengembalikan HTTP 201 dengan JSON `{ data: Forum }`.
 *
 * @name POST/api/forums
 * @function
 * @param {import('express').Request} req - Objek request Express dengan body JSON.
 * @param {import('express').Response} res - Objek response Express untuk mengirim forum yang dibuat.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.post('/', async (req, res) => {
  const userId = req.user?.supabaseUserId
  const { title, content } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  if (!title || !content) {
    return res.status(400).json({ error: 'title dan content wajib diisi' })
  }

  try {
    const created = await createForum({ userId, title, content })
    res.status(201).json({ data: created })
  } catch (error) {
    console.error('Error createForum:', error)
    res.status(500).json({ error: 'Gagal membuat forum baru' })
  }
})

// PUT /api/forums/:id
/**
 * Mengupdate forum yang sudah ada (hanya pemilik atau admin yang boleh).
 *
 * Route: `PUT /api/forums/:id`
 *
 * Params:
 * - `id` (string, wajib): ID forum.
 *
 * Body JSON:
 * - `title` (string, opsional): Judul forum baru.
 * - `content` (string, opsional): Konten forum baru.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Mengembalikan HTTP 401 jika user belum terautentikasi.
 * - Otorisasi (pemilik/admin) dan error status spesifik ditangani di service `updateForum`.
 * - Jika sukses, mengembalikan JSON `{ data: Forum }` yang sudah diperbarui.
 *
 * @name PUT/api/forums/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id` dan body JSON.
 * @param {import('express').Response} res - Objek response Express untuk mengirim forum yang diperbarui.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, content } = req.body
  const requesterId = req.user?.supabaseUserId
  const requesterRole = req.user?.role

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  if (!requesterId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  try {
    const updated = await updateForum({
      forumId: Number(id),
      requesterId,
      requesterRole,
      title,
      content,
    })
    res.json({ data: updated })
  } catch (error) {
    console.error('Error updateForum:', error)
    const status = error.statusCode || 500
    res.status(status).json({ error: error.message || 'Gagal mengupdate forum' })
  }
})

// DELETE /api/forums/:id
/**
 * Menghapus forum berdasarkan ID (hanya pemilik atau admin yang boleh).
 *
 * Route: `DELETE /api/forums/:id`
 *
 * Params:
 * - `id` (string, wajib): ID forum yang akan dihapus.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Mengembalikan HTTP 401 jika user belum terautentikasi.
 * - Detail otorisasi dan error status spesifik ditangani di service `deleteForum`.
 * - Jika sukses, mengembalikan HTTP 204 tanpa body.
 *
 * @name DELETE/api/forums/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim status penghapusan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const requesterId = req.user?.supabaseUserId
  const requesterRole = req.user?.role

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  if (!requesterId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  try {
    await deleteForum({
      forumId: Number(id),
      requesterId,
      requesterRole,
    })
    res.status(204).send()
  } catch (error) {
    console.error('Error deleteForum:', error)
    const status = error.statusCode || 500
    res.status(status).json({ error: error.message || 'Gagal menghapus forum' })
  }
})


export default router
