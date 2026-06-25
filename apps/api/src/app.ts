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
app.get('/api/system/migrate', async (req, res) => {
  try {
    const prisma = require('./config/database').default;
    // Add columns directly via raw SQL if they don't exist
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN "finalPaidAmount" DECIMAL(65,3);`);
    } catch (e) {
      console.log('finalPaidAmount might already exist', e);
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN "finalPaidNote" TEXT;`);
    } catch (e) {
      console.log('finalPaidNote might already exist', e);
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN "parsed_raw_text" TEXT;`);
    } catch (e) {
      console.log('parsed_raw_text might already exist', e);
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN "final_paid_amount" DECIMAL(65,3);`);
    } catch (e) {
      console.log('final_paid_amount might already exist', e);
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN "final_paid_note" TEXT;`);
    } catch (e) {
      console.log('final_paid_note might already exist', e);
    }
    
    // Also try the official deploy if possible
    let deployOut = "Skipped prisma cli deploy to avoid timeout";
    res.json({ success: true, message: "Raw SQL executed", deployOut });
  } catch (err: any) {
    res.status(500).json({ error: String(err), stack: err.stack });
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