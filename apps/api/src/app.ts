import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import routes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", env.FRONTEND_URL, 'https://*.vercel.app'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Allowed origins: configured FRONTEND_URL + any Vercel deployment under this project
const VERCEL_URL_REGEX = /^https:\/\/(nexacrm|web|dist)[\w-]*\.vercel\.app$/;

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost port in development
      if (/^https?:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      // Allow FRONTEND_URL from environment
      if (env.FRONTEND_URL && origin === env.FRONTEND_URL) {
        return callback(null, true);
      }
      // Allow any Vercel deployment URL for this project
      if (VERCEL_URL_REGEX.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TEMPORARY MIGRATION ROUTE
app.get('/api/system/migrate', (req, res) => {
  try {
    const { execSync } = require('child_process');
    const out1 = execSync('npx prisma migrate deploy', { encoding: 'utf-8' });
    const out2 = execSync('npx prisma db seed', { encoding: 'utf-8' });
    res.json({ success: true, migrate: out1, seed: out2 });
  } catch (err: any) {
    res.status(500).json({ error: String(err), stdout: err.stdout?.toString(), stderr: err.stderr?.toString() });
  }
});

// API routes
app.use('/api', routes);

// Static file serving for uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Global error handler must be last
app.use(errorHandler);

export default app;