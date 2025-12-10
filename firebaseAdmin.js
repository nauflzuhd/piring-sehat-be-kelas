import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

/**
 * Inisialisasi Firebase Admin SDK untuk backend.
 *
 * Modul ini:
 * - Memuat konfigurasi environment dari file `.env` di direktori backend.
 * - Membuat atau mengambil instance Firebase Admin App secara singleton.
 * - Mengekspor instance `adminAuth` untuk memverifikasi ID token Firebase di middleware.
 *
 * Environment variable yang diperlukan:
 * - `FIREBASE_PROJECT_ID`
 * - `FIREBASE_CLIENT_EMAIL`
 * - `FIREBASE_PRIVATE_KEY` (dalam bentuk string dengan `\n` sebagai pemisah baris).
 */

// Pastikan .env root ter-load (sama seperti supabaseClient)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Di backend terpisah ini, file .env berada di root project yang sama dengan file ini
const rootEnvPath = path.resolve(__dirname, '.env')

dotenv.config({ path: rootEnvPath })

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.warn('[firebaseAdmin] FIREBASE_* env vars belum lengkap, verifikasi token tidak akan berjalan.')
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // PRIVATE_KEY biasanya berisi \n yang harus di-unescape
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })

/**
 * Instance Firebase Admin Auth yang digunakan untuk memverifikasi ID token di seluruh backend.
 *
 * Dibuat dari aplikasi Firebase Admin yang telah diinisialisasi dengan kredensial service account.
 *
 * @type {import('firebase-admin/auth').Auth}
 */
export const adminAuth = getAuth(app)
