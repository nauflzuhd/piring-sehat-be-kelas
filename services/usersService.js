import { supabase } from '../supabaseClient.js'

export async function syncFirebaseUser({ firebase_uid, email, username }) {
  if (!firebase_uid) throw new Error('firebase_uid is required')

  const effectiveUsername = username || (email ? email.split('@')[0] : null)

  // Cek apakah user sudah ada
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', firebase_uid)
    .maybeSingle()

  if (selectError) {
    console.error('Gagal cek user di Supabase (backend):', selectError)
    throw selectError
  }

  if (existing) {
    return existing.id
  }

  // Jika belum ada, insert baru
  const { data, error: insertError } = await supabase
    .from('users')
    .insert({
      firebase_uid,
      email,
      username: effectiveUsername,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Gagal insert user ke Supabase (backend):', insertError)
    throw insertError
  }

  return data.id
}

export async function getUserDailyCalorieTarget(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('daily_calorie_target')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.daily_calorie_target ?? null
}

export async function updateUserDailyCalorieTarget(userId, target) {
  const value = target == null ? null : Number(target)

  const { error } = await supabase
    .from('users')
    .update({ daily_calorie_target: value })
    .eq('id', userId)

  if (error) throw error
  return value
}
