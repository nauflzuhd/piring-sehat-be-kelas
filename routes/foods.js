import express from 'express'
import { searchFoodsByName, getFirstFoodByName, getAllFoods, createFood } from '../services/foodsService.js'

const router = express.Router()

// GET /api/foods/search?query=...&limit=...
/**
 * Mencari daftar makanan berdasarkan nama, atau mengambil semua makanan saat query kosong.
 *
 * Route: `GET /api/foods/search`
 *
 * Query params:
 * - `query` (string, opsional): Kata kunci pencarian nama makanan. Jika kosong, akan mengembalikan semua makanan (dengan batas `limit`).
 * - `limit` (number, opsional): Batas maksimal jumlah hasil yang dikembalikan. Default 10 jika `query` kosong, atau 5 jika `query` terisi.
 *
 * Perilaku:
 * - Jika `query` kosong atau hanya spasi, memanggil `getAllFoods(limit)` dan mengembalikan `{ data: Food[] }`.
 * - Jika `query` terisi, memanggil `searchFoodsByName(query, limit)` dan mengembalikan `{ data: Food[] }`.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name GET/api/foods/search
 * @function
 * @param {import('express').Request} req - Objek request Express dengan query `query` dan `limit`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim daftar makanan hasil pencarian.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/search', async (req, res) => {
  const { query, limit } = req.query

  // Allow empty query to get all foods
  try {
    if (!query || query.trim() === '') {
      // Get all foods when query is empty
      const foods = await getAllFoods(limit ? Number(limit) : 10)
      return res.json({ data: foods })
    }
    
    const foods = await searchFoodsByName(query, limit ? Number(limit) : 5)
    res.json({ data: foods })
  } catch (error) {
    console.error('Error searchFoodsByName:', error)
    res.status(500).json({ error: 'Gagal mencari makanan' })
  }
})

// GET /api/foods/first?query=...
/**
 * Mengambil satu data makanan pertama yang cocok dengan nama yang dicari.
 *
 * Route: `GET /api/foods/first`
 *
 * Query params:
 * - `query` (string, wajib): Kata kunci pencarian nama makanan.
 *
 * Perilaku:
 * - Mengembalikan HTTP 400 jika `query` tidak diisi.
 * - Jika sukses, mengembalikan JSON `{ data: Food | null }` dari `getFirstFoodByName`.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan pesan kesalahan umum.
 *
 * @name GET/api/foods/first
 * @function
 * @param {import('express').Request} req - Objek request Express dengan query `query`.
 * @param {import('express').Response} res - Objek response Express untuk mengirim data makanan pertama yang ditemukan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/first', async (req, res) => {
  const { query } = req.query

  if (!query) {
    return res.status(400).json({ error: 'query wajib diisi' })
  }

  try {
    const food = await getFirstFoodByName(query)
    res.json({ data: food })
  } catch (error) {
    console.error('Error getFirstFoodByName:', error)
    res.status(500).json({ error: 'Gagal mengambil data makanan' })
  }
})

// GET /api/foods/all - Debug endpoint untuk melihat semua makanan
/**
 * Endpoint debug untuk mengambil daftar semua makanan dengan batas maksimum tertentu.
 *
 * Route: `GET /api/foods/all`
 *
 * Perilaku:
 * - Memanggil `getAllFoods(100)` dan mengembalikan JSON `{ data: Food[], count }`.
 * - `count` menunjukkan jumlah baris yang dikembalikan.
 * - Jika terjadi error, mengembalikan HTTP 500 dengan detail pesan error.
 *
 * @name GET/api/foods/all
 * @function
 * @param {import('express').Request} req - Objek request Express.
 * @param {import('express').Response} res - Objek response Express untuk mengirim daftar semua makanan.
 * @returns {Promise<void>} Promise yang selesai ketika respons sudah dikirim.
 */
router.get('/all', async (req, res) => {
  try {
    const foods = await getAllFoods(100)
    res.json({ data: foods, count: foods.length })
  } catch (error) {
    console.error('Error getAllFoods:', error)
    res.status(500).json({ error: 'Gagal mengambil data makanan', details: error.message })
  }
})

// POST /api/foods
/**
 * Menambahkan makanan baru ke tabel `makanan`.
 *
 * Body JSON:
 * - `name` (string, wajib)
 * - `calories` (number, wajib)
 * - `proteins` (number, opsional)
 * - `carbohydrate` (number, opsional)
 * - `fat` (number, opsional)
 * - `image_url` (string, opsional)
 */
router.post('/', async (req, res) => {
  const { name, calories, proteins, carbohydrate, fat, image_url } = req.body

  if (!name || calories == null) {
    return res.status(400).json({ error: 'name dan calories wajib diisi' })
  }

  try {
    const created = await createFood({
      name,
      calories,
      proteins,
      carbohydrate,
      fat,
      image_url,
    })
    res.status(201).json({ data: created })
  } catch (error) {
    console.error('Error createFood:', error)
    res.status(500).json({ error: 'Gagal menambah makanan baru' })
  }
})

export default router
