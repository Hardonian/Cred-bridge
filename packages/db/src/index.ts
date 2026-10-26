import { MemoryDatabaseRepository } from './memory-repository';
import { PrismaDatabaseRepository, type MinimalPrismaClient } from './prisma-repository';
import type { IDatabaseRepository } from './repository';

export * from './types';
export * from './repository';
export * from './memory-repository';
export * from './prisma-repository';

export type DatabaseMode = 'in-memory-reference' | 'postgresql-prisma';

let globalRepository: IDatabaseRepository | null = null;

export function createDatabaseRepository(
  mode: 'memory' | 'postgres' | 'auto' = 'auto',
  prismaClient?: MinimalPrismaClient
): IDatabaseRepository {
  if (mode === 'postgres' || (mode === 'auto' && prismaClient)) {
    if (!prismaClient) {
      throw new Error('PrismaClient instance required for PostgreSQL repository mode');
    }
    return new PrismaDatabaseRepository(prismaClient);
  }
  return new MemoryDatabaseRepository();
}

export function getDatabaseRepository(): IDatabaseRepository {
  if (!globalRepository) {
    globalRepository = createDatabaseRepository('memory');
  }
  return globalRepository;
}

export const databaseMode: DatabaseMode = process.env.DATABASE_URL
  ? 'postgresql-prisma'
  : 'in-memory-reference';
