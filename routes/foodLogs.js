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
