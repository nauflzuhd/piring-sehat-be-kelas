import { supabase } from '../supabaseClient.js'

/**
 * Menambahkan testimoni baru dari seorang pengguna.
 *
 * @async
 * @function addTestimoni
 * @param {Object} params - Parameter testimoni.
 * @param {number} params.userId - ID user di tabel `users` (wajib).
 * @param {string} params.username - Username pengguna (wajib).
 * @param {string} params.job - Pekerjaan/profesi pengguna (wajib).
 * @param {string} params.message - Pesan testimoni (wajib).
 * @returns {Promise<Object>} Promise yang berisi data testimoni yang baru dibuat.
 * @throws {Error} Melempar error jika parameter tidak lengkap atau operasi Supabase gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * INSERT INTO testimonials (user_id, username, job, message, created_at)
 * VALUES ($1, $2, $3, $4, $5)
 * RETURNING *;
 * ```
 */
export async function addTestimoni({ userId, username, job, message }) {
  if (!userId || !username || !job || !message) {
    throw new Error('userId, username, job, dan message wajib diisi')
  }

  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      user_id: userId,
      username,
      job,
      message,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Gagal menambahkan testimoni:', error)
    throw error
  }

  return data
}

/**
 * Mengambil semua testimoni dari database.
 *
 * @async
 * @function getAllTestimonials
 * @returns {Promise<Array>} Promise yang berisi array testimoni.
 * @throws {Error} Melempar error jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM testimonials
 * ORDER BY created_at DESC;
 * ```
 */
export async function getAllTestimonials() {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      // Return empty array jika tabel tidak ada atau error
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error getAllTestimonials:', {
      message: err.message,
      stack: err.stack,
    })
    return []
  }
}

/**
 * Mengambil testimoni berdasarkan ID user.
 *
 * @async
 * @function getTestimonialsByUserId
 * @param {number} userId - ID user di tabel `users`.
 * @returns {Promise<Array>} Promise yang berisi array testimoni dari user tersebut.
 * @throws {Error} Melempar error jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM testimonials
 * WHERE user_id = $1
 * ORDER BY created_at DESC;
 * ```
 */
export async function getTestimonialsByUserId(userId) {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Gagal mengambil testimoni user:', error)
    throw error
  }

  return data || []
}

