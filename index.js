import express from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/auth.js'
import foodLogsRouter from './routes/foodLogs.js'
import foodsRouter from './routes/foods.js'
import usersRouter from './routes/users.js'
import authRouter from './routes/auth.js'
import { testimonialsRouter } from './routes/testimonials.js'
import forumsRouter from './routes/forums.js'
import forumCommentsRouter from './routes/forumComments.js'

/**
 * Entrypoint utama server Express untuk backend Piring Sehat.
 *
 * @description
 * Server Express yang menangani:
 * - CORS configuration untuk frontend lokal dan production
 * - Middleware authentication dengan Firebase
 * - Routing untuk food logs, users, auth, dan testimonials
 * - Error handling dan logging
 */

const app = express()
const port = process.env.PORT || 3000

// Konfigurasi CORS: izinkan origin dari environment variable atau default
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://piring-sehat.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`)
  })
  next()
})

// Health check endpoint
app.get('/', (req, res) => res.send('Server berjalan!'))
app.get('/api/test', (req, res) => res.json({ message: 'Server berjalan dengan baik!' }))

// Protected routes dengan Firebase Auth
app.use('/api/food-logs', requireAuth, foodLogsRouter)
app.use('/api/users', requireAuth, usersRouter)
app.use('/api/forums', requireAuth, forumsRouter)
app.use('/api/forums', requireAuth, forumCommentsRouter)

// Testimonials: GET tanpa auth, POST dengan auth
app.use('/api/testimonials', (req, res, next) => {
  if (req.method === 'GET') return next()
  requireAuth(req, res, next)
}, testimonialsRouter)

// Foods dan auth (sync user) tidak butuh auth untuk saat ini
app.use('/api/foods', foodsRouter)
app.use('/api/auth', authRouter)

// 404 handler untuk route yang tidak dikenal
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  }
  next();
});

// Error handler global
// Pastikan semua error yang tidak tertangani tetap mengirim respon JSON standar
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Terjadi kesalahan di server' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});