import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { isSupabaseConfigured } from './config/supabase.js';
import studentRoutes from './routes/studentRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { studentController } from './controllers/studentController.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.render.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/cloud demo mode for easy cross-origin evaluation
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint (essential for Render health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'College Mobile Attendance Backend API',
    database: isSupabaseConfigured ? 'Supabase PostgreSQL (Connected)' : 'Demo In-Memory Mock Store',
    supabaseConnected: isSupabaseConfigured
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.get('/api/courses', studentController.getCourses);
app.post('/api/courses', studentController.createCourse);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Attendance Backend Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database status: ${isSupabaseConfigured ? 'Supabase Live' : 'Demo Fallback Store'}`);
  console.log('====================================================');
});

export default app;
