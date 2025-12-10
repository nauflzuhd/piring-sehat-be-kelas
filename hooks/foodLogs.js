import { supabase } from '../supabaseClient.js'

// Ambil catatan makanan untuk user dan tanggal tertentu (YYYY-MM-DD)
/**
 * Mengambil daftar catatan makanan untuk seorang pengguna pada tanggal tertentu.
 *
 * @async
 * @function getFoodLogsByDate
 * @param {string} userId - ID pengguna (biasanya Supabase user_id) yang memiliki catatan makanan.
 * @param {string} date - Tanggal dalam format `YYYY-MM-DD` yang ingin diambil catatannya.
 * @returns {Promise<object[]>} Promise yang berisi array catatan makanan, atau array kosong jika tidak ada data.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM food_logs
 * WHERE user_id = $1
 *   AND date = $2
 * ORDER BY logged_at ASC;
 * ```
 */
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
/**
 * Menambahkan satu catatan makanan baru untuk pengguna pada tanggal tertentu.
 *
 * @async
 * @function addFoodLog
 * @param {Object} params - Parameter untuk catatan makanan.
 * @param {string} params.userId - ID pengguna yang menambahkan catatan makanan.
 * @param {string} params.date - Tanggal konsumsi dalam format `YYYY-MM-DD`.
 * @param {string} params.foodName - Nama makanan yang dikonsumsi (custom / bebas).
 * @param {number|string} params.calories - Jumlah kalori makanan yang dikonsumsi.
 * @param {?number} [params.foodId=null] - ID makanan yang mereferensi tabel `foods` (jika ada), atau `null` jika catatan custom.
 * @returns {Promise<object>} Promise yang berisi satu baris catatan makanan yang baru dibuat.
 * @throws {Error} Melempar error dari Supabase jika proses insert gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * INSERT INTO food_logs (user_id, date, food_name_custom, calories, food_id)
 * VALUES ($1, $2, $3, $4, $5)
 * RETURNING *;
 * ```
 */
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
/**
 * Menghapus satu catatan makanan berdasarkan ID baris pada tabel `food_logs`.
 *
 * @async
 * @function deleteFoodLog
 * @param {number} id - ID catatan makanan yang akan dihapus.
 * @returns {Promise<void>} Promise yang selesai ketika penghapusan berhasil.
 * @throws {Error} Melempar error dari Supabase jika proses delete gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * DELETE FROM food_logs
 * WHERE id = $1;
 * ```
 */
export async function deleteFoodLog(id) {
  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Total kalori dalam rentang tanggal (YYYY-MM-DD)
/**
 * Menghitung total kalori yang dikonsumsi pengguna dalam suatu rentang tanggal.
 *
 * @async
 * @function getTotalCaloriesInRange
 * @param {string} userId - ID pengguna yang datanya akan dihitung.
 * @param {string} startDate - Tanggal awal rentang dalam format `YYYY-MM-DD`.
 * @param {string} endDate - Tanggal akhir rentang dalam format `YYYY-MM-DD`.
 * @returns {Promise<number>} Promise yang berisi total kalori (number), 0 jika tidak ada data.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen pengambilan datanya):
 * ```sql
 * SELECT calories
 * FROM food_logs
 * WHERE user_id = $1
 *   AND date >= $2
 *   AND date <= $3;
 * ```
 *
 * Lalu penjumlahan total kalori dilakukan di sisi JavaScript dengan
 * `reduce`, ekuivalen kira-kira dengan:
 * ```sql
 * SELECT COALESCE(SUM(calories), 0) AS total
 * FROM food_logs
 * WHERE user_id = $1
 *   AND date >= $2
 *   AND date <= $3;
 * ```
 */
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
/**
 * Mengambil ringkasan nutrisi harian (protein, karbohidrat, dan lemak) dari catatan makanan pengguna.
 *
 * Fungsi ini mengandalkan relasi ke tabel `foods` untuk mengambil nilai nutrisi
 * berdasarkan `food_id` yang tersimpan di tabel `food_logs`.
 *
 * @async
 * @function getDailyNutritionSummary
 * @param {string} userId - ID pengguna yang datanya akan diringkas.
 * @param {string} date - Tanggal harian dalam format `YYYY-MM-DD` yang ingin dihitung nutrisinya.
 * @returns {Promise<{protein: number, carbs: number, fat: number}>} Promise yang berisi objek ringkasan nutrisi.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen query dasarnya):
 * ```sql
 * SELECT
 *   fl.calories,
 *   f.protein,
 *   f.carbs,
 *   f.fat
 * FROM food_logs AS fl
 * JOIN foods AS f ON fl.food_id = f.id
 * WHERE fl.user_id = $1
 *   AND fl.date = $2;
 * ```
 *
 * Lalu agregasi `protein`, `carbs`, dan `fat` dilakukan di sisi JavaScript
 * dengan loop, ekuivalen kira-kira dengan:
 * ```sql
 * SELECT
 *   COALESCE(SUM(f.protein), 0) AS protein,
 *   COALESCE(SUM(f.carbs), 0)   AS carbs,
 *   COALESCE(SUM(f.fat), 0)     AS fat
 * FROM food_logs AS fl
 * JOIN foods AS f ON fl.food_id = f.id
 * WHERE fl.user_id = $1
 *   AND fl.date = $2;
 * ```
 */
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