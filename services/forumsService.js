import { supabase } from '../supabaseClient.js'

// Service untuk operasi terkait forum (thread)

/**
 * Mengambil semua forum dari view `view_forums` terurut dari yang terbaru.
 *
 * @async
 * @function getAllForums
 * @returns {Promise<object[]>} Daftar forum, atau array kosong jika tidak ada.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM view_forums
 * ORDER BY forum_created_at DESC;
 * ```
 */
export async function getAllForums() {
  const { data, error } = await supabase
    .from('view_forums')
    .select('*')
    .order('forum_created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Mengambil satu forum dari view `view_forums` berdasarkan ID.
 *
 * @async
 * @function getForumById
 * @param {number} id - ID forum.
 * @returns {Promise<object|null>} Data forum atau null jika tidak ditemukan.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM view_forums
 * WHERE id = $1
 * LIMIT 1;
 * ```
 */
export async function getForumById(id) {
  const { data, error } = await supabase
    .from('view_forums')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Membuat forum baru di tabel `forums`.
 *
 * @async
 * @function createForum
 * @param {Object} params - Parameter pembuatan forum.
 * @param {number|string} params.userId - ID user pemilik forum.
 * @param {string} params.title - Judul forum.
 * @param {string} params.content - Konten forum.
 * @returns {Promise<object>} Baris forum yang baru dibuat.
 * @throws {Error} Melempar error dari Supabase jika insert gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * INSERT INTO forums (user_id, title, content)
 * VALUES ($1, $2, $3)
 * RETURNING *;
 * ```
 */
export async function createForum({ userId, title, content }) {
  const { data, error } = await supabase
    .from('forums')
    .insert({
      user_id: userId,
      title,
      content,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Mengambil data pemilik forum dari tabel `forums`.
 *
 * @async
 * @function getForumOwnerAndRole
 * @param {number} id - ID forum.
 * @returns {Promise<{id:number, user_id:number}|null>} Data forum atau null.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT id, user_id
 * FROM forums
 * WHERE id = $1
 * LIMIT 1;
 * ```
 */
async function getForumOwnerAndRole(id) {
  const { data, error } = await supabase
    .from('forums')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Mengupdate forum yang ada (title/content) dengan otorisasi pemilik/admin.
 *
 * @async
 * @function updateForum
 * @param {Object} params - Parameter update forum.
 * @param {number} params.forumId - ID forum yang akan diupdate.
 * @param {number|string} params.requesterId - ID user yang meminta update.
 * @param {string} params.requesterRole - Role user (`admin` atau lainnya).
 * @param {string|null} params.title - Judul baru (opsional).
 * @param {string|null} params.content - Konten baru (opsional).
 * @returns {Promise<object>} Data forum yang sudah diperbarui.
 * @throws {Error} Error dengan `statusCode` 404/403 jika tidak ditemukan / tidak berhak.
 *
 * PostgreSQL (kira-kira ekuivalen bagian updatenya):
 * ```sql
 * UPDATE forums
 * SET title = COALESCE($2, title),
 *     content = COALESCE($3, content)
 * WHERE id = $1
 * RETURNING *;
 * ```
 */
export async function updateForum({ forumId, requesterId, requesterRole, title, content }) {
  const forum = await getForumOwnerAndRole(forumId)

  if (!forum) {
    const err = new Error('Forum tidak ditemukan')
    err.statusCode = 404
    throw err
  }

  const isOwner = forum.user_id === requesterId
  const isAdmin = requesterRole === 'admin'

  if (!isOwner && !isAdmin) {
    const err = new Error('Tidak memiliki izin untuk mengedit forum ini')
    err.statusCode = 403
    throw err
  }

  const payload = {}
  if (title != null) payload.title = title
  if (content != null) payload.content = content

  const { data, error } = await supabase
    .from('forums')
    .update(payload)
    .eq('id', forumId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Menghapus forum dari tabel `forums` dengan otorisasi pemilik/admin.
 *
 * @async
 * @function deleteForum
 * @param {Object} params - Parameter penghapusan forum.
 * @param {number} params.forumId - ID forum yang akan dihapus.
 * @param {number|string} params.requesterId - ID user yang meminta penghapusan.
 * @param {string} params.requesterRole - Role user (`admin` atau lainnya).
 * @returns {Promise<void>} Promise yang selesai jika penghapusan berhasil.
 * @throws {Error} Error dengan `statusCode` 404/403 jika tidak ditemukan / tidak berhak.
 *
 * PostgreSQL (kira-kira ekuivalen bagian delete-nya):
 * ```sql
 * DELETE FROM forums
 * WHERE id = $1;
 * ```
 */
export async function deleteForum({ forumId, requesterId, requesterRole }) {
  const forum = await getForumOwnerAndRole(forumId)

  if (!forum) {
    const err = new Error('Forum tidak ditemukan')
    err.statusCode = 404
    throw err
  }

  const isOwner = forum.user_id === requesterId
  const isAdmin = requesterRole === 'admin'

  if (!isOwner && !isAdmin) {
    const err = new Error('Tidak memiliki izin untuk menghapus forum ini')
    err.statusCode = 403
    throw err
  }

  const { error } = await supabase
    .from('forums')
    .delete()
    .eq('id', forumId)

  if (error) throw error
}
