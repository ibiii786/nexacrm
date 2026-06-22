// Vercel Serverless Entry Point for NexaCRM API
// This file is used instead of src/index.ts when deployed to Vercel.
// It exports the Express app directly — Vercel's runtime handles the HTTP server.
// Background workers (BullMQ) are NOT started here because Vercel's serverless
// environment does not support persistent background processes.

let loadError: any = null;
let appInstance: any;

try {
  require('../src/config/env');
  const prisma = require('../src/config/database').default;
  appInstance = require('../src/app').default;
  prisma.$connect().catch((err: any) => console.error("Prisma connect error", err));
} catch (err: any) {
  console.error("FATAL BOOT ERROR", err);
  loadError = err;
}

export default function handler(req: any, res: any) {
  if (loadError) {
    return res.status(500).json({ 
      error: "Fatal Boot Error", 
      message: loadError.message, 
      stack: loadError.stack 
    });
  }
  return appInstance(req, res);
}
