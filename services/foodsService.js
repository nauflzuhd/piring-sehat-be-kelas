import { supabase } from '../supabaseClient.js'

// Cari makanan berdasarkan nama (menggunakan ILIKE, tidak case-sensitive)
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
export async function getFirstFoodByName(query) {
  const results = await searchFoodsByName(query, 1)
  return results[0] || null
}

// Ambil semua makanan (untuk rekomendasi)
export async function getAllFoods(limit = 10) {
  const { data, error } = await supabase
    .from('makanan')
    .select('*')
    .limit(limit)

  if (error) throw error
  return data || []
}
