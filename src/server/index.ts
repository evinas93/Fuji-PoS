// Fuji Restaurant POS System - Main Server Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

// Import middleware and routes
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateEnv } from './config/env';
import { supabase } from './config/supabase';

// Route imports
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import analyticsRoutes from './routes/analytics';
import inventoryRoutes from './routes/inventory';
import systemRoutes from './routes/system';

// Validate environment variables
const env = validateEnv();

const app = express();
const PORT = env.PORT || 3001;

// =============================================
// MIDDLEWARE SETUP
// =============================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    env.NEXT_PUBLIC_APP_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// =============================================
// HEALTH CHECK ROUTES
// =============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('key', 'restaurant_name')
      .single();

    if (error) throw error;

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      restaurant: data?.value || 'Unknown',
      services: {
        supabase: 'connected',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Service unavailable',
    });
  }
});

// =============================================
// API ROUTES
// =============================================

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/menu', authMiddleware, menuRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/system', authMiddleware, systemRoutes);

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// =============================================
// SERVER STARTUP
// =============================================

const server = app.listen(PORT, () => {
  console.log(`
🍣 Fuji Restaurant POS API Server
┌─────────────────────────────────────┐
│  Server running on port ${PORT}      │
│  Environment: ${process.env.NODE_ENV?.padEnd(11) || 'development'.padEnd(11)} │
│  Health check: /health              │
│  API Health: /api/health            │
└─────────────────────────────────────┘
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close server after 30 seconds
  setTimeout(() => {
    console.log('Force closing server after 30 seconds...');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;

