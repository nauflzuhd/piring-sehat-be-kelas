import { supabase } from '../supabaseClient.js'

// Service untuk operasi komentar di forum

/**
 * Mengambil daftar komentar dari view `view_forum_comments` untuk satu forum.
 *
 * @async
 * @function getCommentsByForumId
 * @param {number} forumId - ID forum.
 * @returns {Promise<object[]>} Daftar komentar terurut berdasarkan waktu.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT *
 * FROM view_forum_comments
 * WHERE forum_id = $1
 * ORDER BY comment_created_at ASC;
 * ```
 */
export async function getCommentsByForumId(forumId) {
  const { data, error } = await supabase
    .from('view_forum_comments')
    .select('*')
    .eq('forum_id', forumId)
    .order('comment_created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Membuat komentar baru di tabel `forum_comments`.
 *
 * @async
 * @function createComment
 * @param {Object} params - Parameter komentar.
 * @param {number} params.forumId - ID forum.
 * @param {number|string} params.userId - ID user pembuat komentar.
 * @param {string} params.content - Isi komentar.
 * @param {number|null} [params.parentCommentId=null] - ID komentar induk (reply) jika ada.
 * @returns {Promise<object>} Komentar yang baru dibuat.
 * @throws {Error} Melempar error dari Supabase jika insert gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * INSERT INTO forum_comments (forum_id, user_id, content, parent_comment_id)
 * VALUES ($1, $2, $3, $4)
 * RETURNING *;
 * ```
 */
export async function createComment({ forumId, userId, content, parentCommentId = null }) {
  const { data, error } = await supabase
    .from('forum_comments')
    .insert({
      forum_id: forumId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Mengambil komentar beserta pemiliknya dari tabel `forum_comments`.
 *
 * @async
 * @function getCommentWithOwner
 * @param {number} commentId - ID komentar.
 * @returns {Promise<{id:number,user_id:number}|null>} Data komentar atau null.
 * @throws {Error} Melempar error dari Supabase jika query gagal.
 *
 * PostgreSQL (kira-kira ekuivalen):
 * ```sql
 * SELECT id, user_id
 * FROM forum_comments
 * WHERE id = $1
 * LIMIT 1;
 * ```
 */
async function getCommentWithOwner(commentId) {
  const { data, error } = await supabase
    .from('forum_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Mengupdate isi komentar dengan otorisasi pemilik/admin.
 *
 * @async
 * @function updateComment
 * @param {Object} params - Parameter update komentar.
 * @param {number} params.commentId - ID komentar.
 * @param {number|string} params.requesterId - ID user yang meminta update.
 * @param {string} params.requesterRole - Role user (`admin` atau lainnya).
 * @param {string} params.content - Isi komentar baru.
 * @returns {Promise<object>} Komentar yang sudah diperbarui.
 * @throws {Error} Error dengan `statusCode` 404/403 jika tidak ditemukan / tidak berhak.
 *
 * PostgreSQL (kira-kira ekuivalen bagian updatenya):
 * ```sql
 * UPDATE forum_comments
 * SET content = $2
 * WHERE id = $1
 * RETURNING *;
 * ```
 */
export async function updateComment({ commentId, requesterId, requesterRole, content }) {
  const comment = await getCommentWithOwner(commentId)

  if (!comment) {
    const err = new Error('Komentar tidak ditemukan')
    err.statusCode = 404
    throw err
  }

  const isOwner = comment.user_id === requesterId
  const isAdmin = requesterRole === 'admin'

  if (!isOwner && !isAdmin) {
    const err = new Error('Tidak memiliki izin untuk mengedit komentar ini')
    err.statusCode = 403
    throw err
  }

  const { data, error } = await supabase
    .from('forum_comments')
    .update({ content })
    .eq('id', commentId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Menghapus komentar dari tabel `forum_comments` dengan otorisasi pemilik/admin.
 *
 * @async
 * @function deleteComment
 * @param {Object} params - Parameter penghapusan komentar.
 * @param {number} params.commentId - ID komentar.
 * @param {number|string} params.requesterId - ID user yang meminta penghapusan.
 * @param {string} params.requesterRole - Role user (`admin` atau lainnya).
 * @returns {Promise<void>} Promise yang selesai jika penghapusan berhasil.
 * @throws {Error} Error dengan `statusCode` 404/403 jika tidak ditemukan / tidak berhak.
 *
 * PostgreSQL (kira-kira ekuivalen bagian delete-nya):
 * ```sql
 * DELETE FROM forum_comments
 * WHERE id = $1;
 * ```
 */
export async function deleteComment({ commentId, requesterId, requesterRole }) {
  const comment = await getCommentWithOwner(commentId)

  if (!comment) {
    const err = new Error('Komentar tidak ditemukan')
    err.statusCode = 404
    throw err
  }

  const isOwner = comment.user_id === requesterId
  const isAdmin = requesterRole === 'admin'

  if (!isOwner && !isAdmin) {
    const err = new Error('Tidak memiliki izin untuk menghapus komentar ini')
    err.statusCode = 403
    throw err
  }

  const { error } = await supabase
    .from('forum_comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}
