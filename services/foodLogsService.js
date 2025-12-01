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

// Ringkasan nutrisi harian (protein, karbo, lemak) berdasarkan relasi ke tabel makanan
// Catatan: butuh foreign key food_logs.food_id -> makanan.id di Supabase agar join ini bekerja.
export async function getDailyNutritionSummary(userId, date) {
  try {
    const { data, error } = await supabase
      .from('food_logs')
      // Sesuaikan field nutrisi dengan kolom di tabel `makanan`.
      // Kolom: proteins, fat, carbohydrate
      .select('calories, makanan!inner(proteins, fat, carbohydrate)')
      .eq('user_id', userId)
      .eq('date', date)

    if (error) {
      console.error('Supabase error getDailyNutritionSummary:', error)
      return { protein: 0, carbs: 0, fat: 0 }
    }

    let protein = 0
    let carbs = 0
    let fat = 0

    for (const row of data || []) {
      const food = row.makanan
      if (!food) continue
      // gunakan `proteins` dan `carbohydrate` sesuai nama kolom di tabel makanan
      protein += Number(food.proteins || 0)
      carbs += Number(food.carbohydrate || 0)
      fat += Number(food.fat || 0)
    }

    return { protein, carbs, fat }
  } catch (err) {
    console.error('Unexpected error getDailyNutritionSummary:', err)
    return { protein: 0, carbs: 0, fat: 0 }
  }
}
