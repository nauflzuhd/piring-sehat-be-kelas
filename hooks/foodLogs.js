import { supabase } from '../supabaseClient.js'

// Ambil catatan makanan untuk user dan tanggal tertentu (YYYY-MM-DD)
export async function getFoodLogsByDate(userId, date) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Tambah catatan makanan baru
export async function addFoodLog({ userId, date, foodName, calories, foodId = null }) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      date,
      food_name_custom: foodName,
      calories,
      food_id: foodId,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Hapus catatan makanan berdasarkan id
export async function deleteFoodLog(id) {
  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Total kalori dalam rentang tanggal (YYYY-MM-DD)
export async function getTotalCaloriesInRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('calories')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error

  return (data || []).reduce((sum, row) => sum + Number(row.calories || 0), 0)
}

// Ringkasan nutrisi harian (protein, karbo, lemak) berdasarkan relasi ke tabel foods
export async function getDailyNutritionSummary(userId, date) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('calories, foods!inner(protein, carbs, fat)')
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error

  let protein = 0
  let carbs = 0
  let fat = 0

  for (const row of data || []) {
    const food = row.foods
    if (!food) continue
    protein += Number(food.protein || 0)
    carbs += Number(food.carbs || 0)
    fat += Number(food.fat || 0)
  }

  return { protein, carbs, fat }
}


