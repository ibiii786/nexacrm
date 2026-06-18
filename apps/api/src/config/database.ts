import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Singleton Prisma client instance
// Prisma middleware for soft deletes added below

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Soft delete middleware — automatically filters deletedAt: null on find queries
// Per Section 12, point 3
prisma.$use(async (params, next) => {
  // Models that support soft delete
  const softDeleteModels = ['Order', 'User'];

  if (softDeleteModels.includes(params.model ?? '')) {
    // Find operations: filter out soft-deleted records
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Change to findFirst to add deletedAt filter
      params.action = 'findFirst';
      params.args.where = {
        ...params.args.where,
        deletedAt: params.args.where?.deletedAt ?? null,
      };
    }

    if (params.action === 'findMany') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      // Only add deletedAt filter if not explicitly set
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    // Count operations
    if (params.action === 'count') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    // Delete operations: convert to soft delete
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }
  }

  return next(params);
});

export default prisma;
