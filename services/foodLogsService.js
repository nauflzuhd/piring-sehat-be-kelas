import { supabase } from '../supabaseClient.js'

// Ambil catatan makanan untuk user dan tanggal tertentu (YYYY-MM-DD)
/**
 * Mengambil daftar catatan makanan dari tabel `food_logs` untuk pengguna dan tanggal tertentu.
 *
 * @async
 * @function getFoodLogsByDate
 * @param {string} userId - ID pengguna pemilik catatan.
 * @param {string} date - Tanggal dalam format `YYYY-MM-DD`.
 * @returns {Promise<object[]>} Promise yang berisi array catatan makanan, atau array kosong jika tidak ada.
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
 * Menambahkan catatan makanan baru ke tabel `food_logs`.
 *
 * @async
 * @function addFoodLog
 * @param {Object} params - Parameter catatan makanan yang akan disimpan.
 * @param {string} params.userId - ID pengguna.
 * @param {string} params.date - Tanggal konsumsi dalam format `YYYY-MM-DD`.
 * @param {string} params.foodName - Nama makanan custom yang dikonsumsi.
 * @param {number|string} params.calories - Jumlah kalori makanan tersebut.
 * @param {?number} [params.foodId=null] - ID referensi ke tabel `makanan` jika tersedia.
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
 * Menghapus satu catatan makanan dari tabel `food_logs` berdasarkan ID.
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
 * Menghitung total kalori yang dikonsumsi pengguna dalam rentang tanggal tertentu.
 *
 * @async
 * @function getTotalCaloriesInRange
 * @param {string} userId - ID pengguna.
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
 * Agregasi total kalori dilakukan di JavaScript dengan reduce, ekuivalen dengan:
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

// Ringkasan nutrisi harian (protein, karbo, lemak) berdasarkan relasi ke tabel makanan
// Catatan: butuh foreign key food_logs.food_id -> makanan.id di Supabase agar join ini bekerja.
/**
 * Mengambil ringkasan nutrisi harian (protein, karbohidrat, lemak) berdasarkan relasi ke tabel `makanan`.
 *
 * Fungsi ini mengandalkan foreign key `food_logs.food_id -> makanan.id` di Supabase
 * untuk melakukan join dan menjumlahkan nilai nutrisi dari makanan yang dikonsumsi.
 *
 * @async
 * @function getDailyNutritionSummary
 * @param {string} userId - ID pengguna.
 * @param {string} date - Tanggal dalam format `YYYY-MM-DD`.
 * @returns {Promise<{protein: number, carbs: number, fat: number}>} Promise yang berisi objek ringkasan nutrisi.
 *
 * PostgreSQL (kira-kira ekuivalen query dasarnya):
 * ```sql
 * SELECT
 *   fl.calories,
 *   m.proteins,
 *   m.fat,
 *   m.carbohydrate
 * FROM food_logs AS fl
 * JOIN makanan AS m ON fl.food_id = m.id
 * WHERE fl.user_id = $1
 *   AND fl.date = $2;
 * ```
 *
 * Agregasi protein, karbohidrat, dan lemak dilakukan di JavaScript dengan loop,
 * ekuivalen kira-kira dengan:
 * ```sql
 * SELECT
 *   COALESCE(SUM(m.proteins), 0)     AS protein,
 *   COALESCE(SUM(m.carbohydrate), 0) AS carbs,
 *   COALESCE(SUM(m.fat), 0)          AS fat
 * FROM food_logs AS fl
 * JOIN makanan AS m ON fl.food_id = m.id
 * WHERE fl.user_id = $1
 *   AND fl.date = $2;
 * ```
 */
export async function getDailyNutritionSummary(userId, date) {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_nutrition', {
        p_user_id: userId,
        p_date: date,
      })

    if (error) {
      console.error('Supabase error getDailyNutritionSummary (rpc):', error)
      return { protein: 0, carbs: 0, fat: 0 }
    }

    // Fungsi get_daily_nutrition mengembalikan satu baris
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { protein: 0, carbs: 0, fat: 0 }
    }

    return {
      protein: Number(row.total_protein || 0),
      carbs: Number(row.total_carbs || 0),
      fat: Number(row.total_fat || 0),
      // total_calories tersedia sebagai row.total_calories jika ingin dipakai nanti
    }
  } catch (err) {
    console.error('Unexpected error getDailyNutritionSummary (rpc):', err)
    return { protein: 0, carbs: 0, fat: 0 }
  }
}