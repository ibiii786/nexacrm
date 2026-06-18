import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Singleton Prisma client instance
// Prisma middleware for soft deletes added below

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Soft delete middleware using Prisma Extensions (Prisma 6+)
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        }
        return query(args);
      },
      async findFirst({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        }
        return query(args);
      },
      async findUnique({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        }
        return query(args);
      },
      async count({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        }
        return query(args);
      },
      async delete({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          return basePrisma[model.toLowerCase() as any].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async deleteMany({ model, operation, args, query }) {
        if (['Order', 'User'].includes(model)) {
          return basePrisma[model.toLowerCase() as any].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient; // Cast to avoid complex type issues in global usage

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

export default prisma;
