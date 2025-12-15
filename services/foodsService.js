import { supabase } from '../supabaseClient.js'

// Cari makanan berdasarkan nama (menggunakan ILIKE, tidak case-sensitive)
/**
 * Mencari daftar makanan berdasarkan nama menggunakan pencarian case-insensitive.
 *
 * Hanya kata pertama dari query yang digunakan untuk pencarian agar hasil lebih stabil
 * dan menghindari query yang terlalu panjang.
 *
 * @async
 * @function searchFoodsByName
 * @param {string} query - Teks pencarian nama makanan.
 * @param {number} [limit=5] - Batas maksimal jumlah hasil yang dikembalikan.
 * @returns {Promise<object[]>} Promise yang berisi array baris makanan dari tabel `makanan`.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM makanan
 * WHERE name ILIKE '%' || $1 || '%'
 * LIMIT $2;
 * ```
 */
export async function searchFoodsByName(query, limit = 5) {
  const normalized = (query || '').trim()
  if (!normalized) return []

  const firstWord = normalized.split(/\s+/)[0]

  const { data, error } = await supabase
    .from('makanan')
    .select('*')
    .ilike('name', `%${firstWord}%`)
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Membuat entri makanan baru di tabel `makanan`.
 *
 * @param {Object} payload
 * @param {string} payload.name - Nama makanan.
 * @param {number} payload.calories - Kalori (kkal).
 * @param {number} [payload.proteins] - Protein (gram).
 * @param {number} [payload.carbohydrate] - Karbohidrat (gram).
 * @param {number} [payload.fat] - Lemak (gram).
 * @param {string} [payload.image_url] - URL gambar makanan (akan disimpan ke kolom `image`).
 * @returns {Promise<object>} Satu baris makanan yang baru dibuat.
 */
export async function createFood({
  name,
  calories,
  proteins = null,
  carbohydrate = null,
  fat = null,
  image_url = null,
}) {
  // Ambil id terbesar saat ini untuk membuat id baru secara manual (karena kolom id NOT NULL dan tidak memiliki default).
  const { data: lastIdRows, error: lastIdError } = await supabase
    .from('makanan')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)

  if (lastIdError) throw lastIdError

  const lastId = Array.isArray(lastIdRows) && lastIdRows.length > 0 ? Number(lastIdRows[0].id) || 0 : 0
  const newId = lastId + 1

  const { data, error } = await supabase
    .from('makanan')
    .insert({
      id: newId,
      name,
      calories,
      proteins,
      carbohydrate,
      fat,
      image: image_url || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Ambil satu makanan dengan nama paling cocok (first match)
/**
 * Mengambil satu entri makanan pertama yang paling cocok dengan query.
 *
 * @async
 * @function getFirstFoodByName
 * @param {string} query - Teks pencarian nama makanan.
 * @returns {Promise<object|null>} Promise yang berisi satu objek makanan atau `null` jika tidak ada hasil.
 */
export async function getFirstFoodByName(query) {
  const results = await searchFoodsByName(query, 1)
  return results[0] || null
}

// Ambil semua makanan (untuk rekomendasi)
/**
 * Mengambil daftar makanan dari tabel `makanan` dengan batas tertentu.
 *
 * @async
 * @function getAllFoods
 * @param {number} [limit=10] - Batas maksimal jumlah makanan yang diambil.
 * @returns {Promise<object[]>} Promise yang berisi array makanan, atau array kosong jika tidak ada.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM makanan
 * LIMIT $1;
 * ```
 */
export async function getAllFoods(limit = 10) {
  const { data, error } = await supabase
    .from('makanan')
    .select('*')
    .limit(limit)

  if (error) throw error
  return data || []
}
