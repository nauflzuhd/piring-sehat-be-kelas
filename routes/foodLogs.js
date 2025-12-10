import express from 'express'
import {
  getFoodLogsByDate,
  addFoodLog,
  deleteFoodLog,
  getTotalCaloriesInRange,
  getDailyNutritionSummary,
} from '../services/foodLogsService.js'

const router = express.Router()

// GET /api/food-logs?userId=...&date=YYYY-MM-DD
/**
 * Mengambil daftar catatan makanan untuk seorang pengguna pada tanggal tertentu.
 *
 * Route: `GET /api/food-logs`
 *
 * Query params:
 * - `userId` (string, wajib): ID pengguna yang ingin diambil catatannya.
 * - `date` (string, wajib): Tanggal dalam format `YYYY-MM-DD`.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `userId` atau `date` tidak dikirim.
 * - Jika sukses, mengembalikan JSON `{ data: FoodLog[] }`.
 *
 * @name GET/api/food-logs
 * @function
 * @param {import('express').Request} req - Objek request Express dengan query `userId` dan `date`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim daftar catatan makanan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/', async (req, res) => {
  const { userId, date } = req.query

  if (!userId || !date) {
    return res.status(400).json({ error: 'userId dan date wajib diisi' })
  }

  try {
    const logs = await getFoodLogsByDate(userId, date)
    res.json({ data: logs })
  } catch (error) {
    console.error('Error getFoodLogsByDate:', error)
    res.status(500).json({ error: 'Gagal mengambil data food_logs' })
  }
})

// POST /api/food-logs
// body: { userId, date, foodName, calories, foodId }
/**
 * Menambahkan catatan makanan baru ke tabel `food_logs`.
 *
 * Route: `POST /api/food-logs`
 *
 * Body JSON:
 * - `userId` (string, wajib): ID pengguna pemilik catatan.
 * - `date` (string, wajib): Tanggal konsumsi dalam format `YYYY-MM-DD`.
 * - `foodName` (string, wajib): Nama makanan (custom) yang dikonsumsi.
 * - `calories` (number, wajib): Jumlah kalori makanan tersebut.
 * - `foodId` (number, opsional): ID referensi ke tabel `foods` jika catatan terhubung ke data makanan standar.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika salah satu field wajib tidak diisi.
 * - Jika sukses, mengembalikan HTTP 201 dengan JSON `{ data: FoodLog }`.
 *
 * @name POST/api/food-logs
 * @function
 * @param {import('express').Request} req - Objek request Express dengan body JSON catatan makanan.
 * @param {import('express').Response} res - Objek response Express untuk mengirim catatan yang dibuat.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.post('/', async (req, res) => {
  const { userId, date, foodName, calories, foodId } = req.body

  if (!userId || !date || !foodName || calories == null) {
    return res.status(400).json({ error: 'userId, date, foodName, dan calories wajib diisi' })
  }

  try {
    const created = await addFoodLog({
      userId,
      date,
      foodName,
      calories,
      foodId: foodId || null,
    })
    res.status(201).json({ data: created })
  } catch (error) {
    console.error('Error addFoodLog:', error)
    res.status(500).json({ error: 'Gagal menambah food_log' })
  }
})

// DELETE /api/food-logs/:id
/**
 * Menghapus satu catatan makanan berdasarkan ID.
 *
 * Route: `DELETE /api/food-logs/:id`
 *
 * Params:
 * - `id` (string/number, wajib): ID catatan makanan di tabel `food_logs`.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `id` tidak dikirim.
 * - Jika sukses, mengembalikan HTTP 204 tanpa body.
 *
 * @name DELETE/api/food-logs/:id
 * @function
 * @param {import('express').Request} req - Objek request Express dengan parameter `id`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim status penghapusan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'id wajib diisi' })
  }

  try {
    await deleteFoodLog(id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleteFoodLog:', error)
    res.status(500).json({ error: 'Gagal menghapus food_log' })
  }
})

// GET /api/food-logs/summary/month?userId=...&startDate=...&endDate=...
/**
 * Mengambil total kalori yang dikonsumsi pengguna dalam rentang tanggal tertentu.
 *
 * Route: `GET /api/food-logs/summary/month`
 *
 * Query params:
 * - `userId` (string, wajib): ID pengguna.
 * - `startDate` (string, wajib): Tanggal awal rentang dalam format `YYYY-MM-DD`.
 * - `endDate` (string, wajib): Tanggal akhir rentang dalam format `YYYY-MM-DD`.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika salah satu parameter wajib tidak diisi.
 * - Jika sukses, mengembalikan JSON `{ total }` di mana `total` adalah jumlah kalori.
 *
 * @name GET/api/food-logs/summary/month
 * @function
 * @param {import('express').Request} req - Objek request Express dengan query `userId`, `startDate`, dan `endDate`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim total kalori.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/summary/month', async (req, res) => {
  const { userId, startDate, endDate } = req.query

  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ error: 'userId, startDate, dan endDate wajib diisi' })
  }

  try {
    const total = await getTotalCaloriesInRange(userId, startDate, endDate)
    res.json({ total })
  } catch (error) {
    console.error('Error getTotalCaloriesInRange:', error)
    res.status(500).json({ error: 'Gagal mengambil total kalori bulanan' })
  }
})

// GET /api/food-logs/summary/nutrition?userId=...&date=...
/**
 * Mengambil ringkasan nutrisi harian (protein, karbohidrat, lemak) untuk seorang pengguna.
 *
 * Route: `GET /api/food-logs/summary/nutrition`
 *
 * Query params:
 * - `userId` (string, wajib): ID pengguna.
 * - `date` (string, wajib): Tanggal dalam format `YYYY-MM-DD`.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `userId` atau `date` tidak diisi.
 * - Jika sukses, mengembalikan JSON `{ data: { protein, carbs, fat } }`.
 *
 * @name GET/api/food-logs/summary/nutrition
 * @function
 * @param {import('express').Request} req - Objek request Express dengan query `userId` dan `date`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim ringkasan nutrisi.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/summary/nutrition', async (req, res) => {
  const { userId, date } = req.query

  if (!userId || !date) {
    return res.status(400).json({ error: 'userId dan date wajib diisi' })
  }

  try {
    const totals = await getDailyNutritionSummary(userId, date)
    res.json({ data: totals })
  } catch (error) {
    console.error('Error getDailyNutritionSummary:', error)
    res.status(500).json({ error: 'Gagal mengambil ringkasan nutrisi harian' })
  }
})

export default router