import { describe, expect, it } from 'vitest';
import {
  createDatabaseRepository,
  MemoryDatabaseRepository,
  PrismaDatabaseRepository,
  type MinimalPrismaClient,
} from './index';

describe('packages/db', () => {
  it('initializes MemoryDatabaseRepository with 10,000 credit pool and 3 tenants', async () => {
    const repo = new MemoryDatabaseRepository();
    const pool = await repo.getCreditPool();
    expect(pool).toBeDefined();
    expect(pool?.poolSize).toBe(10000);
    expect(pool?.contractCents).toBe(540000);

    const tenants = await repo.getTenants();
    expect(tenants).toHaveLength(3);
    const gulf = await repo.getTenant('gulf-innovation');
    expect(gulf?.name).toBe('Gulf University of Innovation');
    expect(gulf?.allocation).toBe(3600);
  });

  it('updates tenant usage and prevents exceeding allocation', async () => {
    const repo = new MemoryDatabaseRepository();
    const updated = await repo.updateTenantUsage('gulf-innovation', 10);
    expect(updated.used).toBe(1448);

    await expect(repo.updateTenantUsage('gulf-innovation', 5000)).rejects.toThrow(
      /allocation cap exceeded/
    );
  });

  it('enforces unique idempotencyKey on ledger entries', async () => {
    const repo = new MemoryDatabaseRepository();
    const entry = await repo.createLedgerEntry({
      id: 'entry-1',
      tenantId: 'gulf-innovation',
      idempotencyKey: 'idem-key-abc',
      kind: 'HOLD',
      credits: 1,
      status: 'RESERVED',
      reference: 'ref-1',
    });
    expect(entry.idempotencyKey).toBe('idem-key-abc');

    const found = await repo.findLedgerEntryByIdempotencyKey('idem-key-abc');
    expect(found?.status).toBe('RESERVED');

    // Duplicate key throws
    await expect(
      repo.createLedgerEntry({
        id: 'entry-2',
        tenantId: 'gulf-innovation',
        idempotencyKey: 'idem-key-abc',
        kind: 'HOLD',
        credits: 1,
        status: 'RESERVED',
        reference: 'ref-2',
      })
    ).rejects.toThrow(/Unique constraint violation/);
  });

  it('rolls back state changes on transaction failure', async () => {
    const repo = new MemoryDatabaseRepository();
    const initialGulf = await repo.getTenant('gulf-innovation');
    const initialUsed = initialGulf!.used;

    await expect(
      repo.runTransaction(async (txRepo) => {
        await txRepo.updateTenantUsage('gulf-innovation', 5);
        await txRepo.createLedgerEntry({
          id: 'tx-entry',
          tenantId: 'gulf-innovation',
          idempotencyKey: 'tx-key-fail',
          kind: 'HOLD',
          credits: 1,
          status: 'RESERVED',
          reference: 'tx-ref',
        });
        // Deliberate error to trigger rollback
        throw new Error('Simulated transaction failure');
      })
    ).rejects.toThrow('Simulated transaction failure');

    // Verify rollback: used count unchanged and ledger entry absent
    const gulfAfter = await repo.getTenant('gulf-innovation');
    expect(gulfAfter!.used).toBe(initialUsed);
    const entry = await repo.findLedgerEntryByIdempotencyKey('tx-key-fail');
    expect(entry).toBeNull();
  });

  it('records and checks credential revocation status', async () => {
    const repo = new MemoryDatabaseRepository();
    expect(await repo.isCredentialRevoked('urn:credbridge:test-1')).toBe(false);

    await repo.createRevocationRecord({
      id: 'rev-1',
      credentialId: 'urn:credbridge:test-1',
      reason: 'Course requirement invalidated',
      revokedAt: new Date(),
    });

    expect(await repo.isCredentialRevoked('urn:credbridge:test-1')).toBe(true);
  });

  it('works with PrismaDatabaseRepository adapter', async () => {
    const mockPrisma: MinimalPrismaClient = {
      tenant: {
        findMany: async () => [],
        findUnique: async () => ({
          id: 'test-t',
          name: 'Prisma Tenant',
          region: 'ME',
          program: 'Applied',
          learners: 100,
          allocation: 500,
          used: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: async ({ data }) => ({
          id: 'test-t',
          name: 'Prisma Tenant',
          region: 'ME',
          program: 'Applied',
          learners: 100,
          allocation: 500,
          used: (data.used as number) ?? 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      creditPool: {
        findFirst: async () => null,
        update: async () => {
          throw new Error('not implemented');
        },
      },
      creditLedgerEntry: {
        findUnique: async () => null,
        create: async ({ data }) => ({ ...data, createdAt: new Date() }),
        update: async () => {
          throw new Error('not implemented');
        },
        findMany: async () => [],
      },
      learner: {
        findUnique: async () => null,
        create: async ({ data }) => ({ ...data, createdAt: new Date() }),
      },
      milestoneEvidence: {
        create: async ({ data }) => ({ ...data, createdAt: new Date() }),
        findUnique: async () => null,
      },
      issuedCredential: {
        create: async ({ data }) => ({ ...data, createdAt: new Date() }),
        findUnique: async () => null,
        update: async () => {
          throw new Error('not implemented');
        },
        findMany: async () => [],
      },
      auditEvent: {
        create: async ({ data }) => ({ ...data, createdAt: new Date() }),
        findMany: async () => [],
      },
      revocationRecord: {
        create: async ({ data }) => data,
        findUnique: async () => null,
      },
      $transaction: async (fn) => fn(mockPrisma),
    };

    const prismaRepo = new PrismaDatabaseRepository(mockPrisma);
    const tenant = await prismaRepo.getTenant('test-t');
    expect(tenant?.name).toBe('Prisma Tenant');

    const factoryRepo = createDatabaseRepository('postgres', mockPrisma);
    expect(factoryRepo).toBeInstanceOf(PrismaDatabaseRepository);
  });
});
