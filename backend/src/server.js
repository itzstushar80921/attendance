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

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint (essential for Render health check & frontend connectivity)
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

// Serve built frontend assets if dist folder exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA Catch-all: serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Catch 404 for unmatched API routes
app.use('/api', (req, res) => {
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
