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
