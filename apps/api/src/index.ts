import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectRedis } from './config/redis';
import prisma from './config/database';

async function bootstrap() {
  try {
    // 1. Connect to Redis
    await connectRedis();

    // 2. Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // 3. Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
