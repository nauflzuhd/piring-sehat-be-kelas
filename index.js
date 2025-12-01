import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';
import foodLogsRouter from './routes/foodLogs.js';
import foodsRouter from './routes/foods.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';

const app = express();
const port = 3000;

// Izinkan akses dari frontend lokal dan deployment Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'https://piring-sehat.vercel.app',
]

app.use(cors({
  origin: allowedOrigins,
}));

app.use(express.json());

// Logging sederhana untuk semua request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.get('/', (req, res) => {
  res.send('Server berjalan!');
});

// Proteksi food-logs dan users dengan Firebase Auth
app.use('/api/food-logs', requireAuth, foodLogsRouter);
app.use('/api/users', requireAuth, usersRouter);

// Foods dan auth (sync user) tidak butuh auth untuk saat ini
app.use('/api/foods', foodsRouter);
app.use('/api/auth', authRouter);

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