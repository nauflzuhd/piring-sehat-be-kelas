import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Pastikan .env root ter-load (sama seperti supabaseClient)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootEnvPath = path.resolve(__dirname, '..', '.env')

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

export const adminAuth = getAuth(app)
