import express from 'express'
import {
  getCommentsByForumId,
  createComment,
  updateComment,
  deleteComment,
} from '../services/forumCommentsService.js'

const router = express.Router()

// GET /api/forums/:forumId/comments
/**
 * Mengambil daftar komentar untuk sebuah forum tertentu.
 *
 * Route: `GET /api/forums/:forumId/comments`
 *
 * Params:
 * - `forumId` (string, wajib): ID forum yang komentarnya ingin diambil.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `forumId` tidak dikirim.
 * - Jika sukses, mengembalikan JSON `{ data: Comment[] }`.
 *
 * @name GET/api/forums/:forumId/comments
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `forumId`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim daftar komentar.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/:forumId/comments', async (req, res) => {
  const { forumId } = req.params

  if (!forumId) {
    return res.status(400).json({ error: 'forumId wajib diisi' })
  }

  try {
    const comments = await getCommentsByForumId(Number(forumId))
    res.json({ data: comments })
  } catch (error) {
    console.error('Error getCommentsByForumId:', error)
    res.status(500).json({ error: 'Gagal mengambil komentar forum' })
  }
})

// POST /api/forums/:forumId/comments
/**
 * Menambahkan komentar baru pada sebuah forum.
 *
 * Route: `POST /api/forums/:forumId/comments`
 *
 * Params:
 * - `forumId` (string, wajib): ID forum tujuan komentar.
 *
 * Body JSON:
 * - `content` (string, wajib): Isi komentar.
 * - `parentCommentId` (number|null, opsional): ID komentar induk jika ini adalah reply.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `forumId` atau `content` tidak diisi.
 * - Mengembalikan HTTP 401 jika user belum terautentikasi.
 * - Jika sukses, mengembalikan HTTP 201 dengan JSON `{ data: Comment }`.
 *
 * @name POST/api/forums/:forumId/comments
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `forumId` dan body JSON.
 * @param {import('express').Response} res - Objek response Express untuk mengirim komentar yang dibuat.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.post('/:forumId/comments', async (req, res) => {
  const { forumId } = req.params
  const { content, parentCommentId } = req.body
  const userId = req.user?.supabaseUserId

  if (!forumId) {
    return res.status(400).json({ error: 'forumId wajib diisi' })
  }

  if (!userId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  if (!content) {
    return res.status(400).json({ error: 'content wajib diisi' })
  }

  try {
    const created = await createComment({
      forumId: Number(forumId),
      userId,
      content,
      parentCommentId: parentCommentId ?? null,
    })
    res.status(201).json({ data: created })
  } catch (error) {
    console.error('Error createComment:', error)
    res.status(500).json({ error: 'Gagal menambahkan komentar' })
  }
})

// PUT /api/forums/comments/:id
/**
 * Mengupdate isi komentar pada forum.
 *
 * Route: `PUT /api/forums/comments/:id`
 *
 * Params:
 * - `id` (string, wajib): ID komentar.
 *
 * Body JSON:
 * - `content` (string, wajib): Isi komentar baru.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` atau `content` tidak dikirim.
 * - Mengembalikan HTTP 401 jika user belum terautentikasi.
 * - Otorisasi (pemilik/admin) dan error status spesifik ditangani di service `updateComment`.
 * - Jika sukses, mengembalikan JSON `{ data: Comment }` yang sudah diperbarui.
 *
 * @name PUT/api/forums/comments/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id` dan body JSON.
 * @param {import('express').Response} res - Objek response Express untuk mengirim komentar yang diperbarui.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.put('/comments/:id', async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const requesterId = req.user?.supabaseUserId
  const requesterRole = req.user?.role

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  if (!requesterId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' })
  }

  if (!content) {
    return res.status(400).json({ error: 'content wajib diisi' })
  }

  try {
    const updated = await updateComment({
      commentId: Number(id),
      requesterId,
      requesterRole,
      content,
    })
    res.json({ data: updated })
  } catch (error) {
    console.error('Error updateComment:', error)
    const status = error.statusCode || 500
    res.status(status).json({ error: error.message || 'Gagal mengupdate komentar' })
  }
})

// DELETE /api/forums/comments/:id
/**
 * Menghapus komentar pada forum.
 *
 * Route: `DELETE /api/forums/comments/:id`
 *
 * Params:
 * - `id` (string, wajib): ID komentar yang akan dihapus.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Mengembalikan HTTP 401 jika user belum terautentikasi.
 * - Otorisasi (pemilik/admin) dan error status spesifik ditangani di service `deleteComment`.
 * - Jika sukses, mengembalikan HTTP 204 tanpa body.
 *
 * @name DELETE/api/forums/comments/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim status penghapusan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.delete('/comments/:id', async (req, res) => {
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
    await deleteComment({
      commentId: Number(id),
      requesterId,
      requesterRole,
    })
    res.status(204).send()
  } catch (error) {
    console.error('Error deleteComment:', error)
    const status = error.statusCode || 500
    res.status(status).json({ error: error.message || 'Gagal menghapus komentar' })
  }
})

export default router
