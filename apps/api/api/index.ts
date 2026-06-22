// Vercel Serverless Entry Point for NexaCRM API
// This file is used instead of src/index.ts when deployed to Vercel.
// It exports the Express app directly — Vercel's runtime handles the HTTP server.
// Background workers (BullMQ) are NOT started here because Vercel's serverless
// environment does not support persistent background processes.

import '../src/config/env'; // Validates all required env vars on cold start
import prisma from '../src/config/database'; // Prisma connects lazily on first query
import app from '../src/app';

// Warm up the Prisma connection on cold start to reduce latency on the first request.
// If it fails, requests will still work but may be slower on the first hit.
prisma.$connect().catch(() => {
  // Non-fatal: Prisma will reconnect automatically on the next query.
});

export default app;
