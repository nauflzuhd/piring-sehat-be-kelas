import express from 'express'
import { searchFoodsByName, getFirstFoodByName, getAllFoods } from '../services/foodsService.js'

const router = express.Router()

// GET /api/foods/search?query=...&limit=...
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
router.get('/all', async (req, res) => {
  try {
    const foods = await getAllFoods(100)
    res.json({ data: foods, count: foods.length })
  } catch (error) {
    console.error('Error getAllFoods:', error)
    res.status(500).json({ error: 'Gagal mengambil data makanan', details: error.message })
  }
})

export default router
