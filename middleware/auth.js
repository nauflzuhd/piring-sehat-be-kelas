import { adminAuth } from '../firebaseAdmin.js'
import { supabase } from '../supabaseClient.js'

/**
 * Middleware Express untuk memverifikasi Firebase ID token pada header Authorization.
 *
 * - Mengambil token dari header `Authorization: Bearer <token>`.
 * - Jika token tidak ada, mengembalikan HTTP 401 dengan pesan `Unauthorized: missing token`.
 * - Jika token ada, memverifikasi menggunakan Firebase Admin.
 * - Jika verifikasi berhasil, payload token disimpan di `req.firebaseUser` dan request diteruskan ke handler berikutnya.
 * - Jika verifikasi gagal, mengembalikan HTTP 401 dengan pesan `Unauthorized: invalid token`.
 *
 * @async
 * @function requireAuth
 * @param {import('express').Request} req - Objek request Express.
 * @param {import('express').Response} res - Objek response Express.
 * @param {import('express').NextFunction} next - Fungsi untuk melanjutkan ke middleware/handler berikutnya.
 * @returns {Promise<void>} Promise yang selesai ketika middleware meneruskan request atau mengembalikan respons error.
 *
 * Query ke Supabase di middleware ini secara garis besar ekuivalen dengan PostgreSQL berikut:
 * ```sql
 * SELECT id, role
 * FROM users
 * WHERE firebase_uid = $1
 * LIMIT 1;
 * ```
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing token' })
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    req.firebaseUser = decoded

    // Ambil supabaseUserId dan role dari database berdasarkan firebase_uid
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('firebase_uid', decoded.uid)
      .single()

    if (error || !data) {
      console.error('Error getting user from Supabase:', error)
      return res.status(401).json({ error: 'User tidak ditemukan di database' })
    }

    // Set req.user dengan supabaseUserId dan role
    req.user = {
      firebaseUid: decoded.uid,
      supabaseUserId: data.id,
      role: data.role,
    }

    next()
  } catch (error) {
    console.error('Error verifyIdToken:', error)
    return res.status(401).json({ error: 'Unauthorized: invalid token' })
  }
}