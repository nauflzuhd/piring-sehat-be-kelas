import express from 'express'
import { getUserDailyCalorieTarget, updateUserDailyCalorieTarget } from '../services/usersService.js'

const router = express.Router()

// GET /api/users/:id/daily-target
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
