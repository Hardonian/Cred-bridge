import type { IDatabaseRepository } from './repository';
import type {
  TenantRecord,
  CreditPoolRecord,
  CreditLedgerEntryRecord,
  LearnerRecord,
  MilestoneEvidenceRecord,
  IssuedCredentialRecord,
  AuditEventRecord,
  RevocationRecord,
} from './types';

// Generic PrismaClient interface matching schema.prisma generated models
export interface MinimalPrismaClient {
  tenant: {
    findMany(): Promise<TenantRecord[]>;
    findUnique(args: { where: { id: string } }): Promise<TenantRecord | null>;
    update(args: { where: { id: string }; data: Partial<TenantRecord> }): Promise<TenantRecord>;
  };
  creditPool: {
    findFirst(): Promise<CreditPoolRecord | null>;
    update(args: { where: { id: string }; data: Partial<CreditPoolRecord> }): Promise<CreditPoolRecord>;
  };
  creditLedgerEntry: {
    findUnique(args: { where: { idempotencyKey: string } }): Promise<CreditLedgerEntryRecord | null>;
    create(args: { data: Omit<CreditLedgerEntryRecord, 'createdAt'> }): Promise<CreditLedgerEntryRecord>;
    update(args: { where: { idempotencyKey: string }; data: { status: CreditLedgerEntryRecord['status'] } }): Promise<CreditLedgerEntryRecord>;
    findMany(args?: { where?: { tenantId?: string }; orderBy?: { createdAt: 'desc' | 'asc' } }): Promise<CreditLedgerEntryRecord[]>;
  };
  learner: {
    findUnique(args: { where: { tenantId_externalRefHash: { tenantId: string; externalRefHash: string } } }): Promise<LearnerRecord | null>;
    create(args: { data: Omit<LearnerRecord, 'createdAt'> }): Promise<LearnerRecord>;
  };
  milestoneEvidence: {
    create(args: { data: Omit<MilestoneEvidenceRecord, 'createdAt'> }): Promise<MilestoneEvidenceRecord>;
    findUnique(args: { where: { id: string } }): Promise<MilestoneEvidenceRecord | null>;
  };
  issuedCredential: {
    create(args: { data: Omit<IssuedCredentialRecord, 'createdAt'> }): Promise<IssuedCredentialRecord>;
    findUnique(args: { where: { id: string } }): Promise<IssuedCredentialRecord | null>;
    update(args: { where: { id: string }; data: Partial<IssuedCredentialRecord> }): Promise<IssuedCredentialRecord>;
    findMany(args?: { where?: { tenantId?: string }; orderBy?: { createdAt: 'desc' | 'asc' } }): Promise<IssuedCredentialRecord[]>;
  };
  auditEvent: {
    create(args: { data: Omit<AuditEventRecord, 'createdAt'> }): Promise<AuditEventRecord>;
    findMany(args?: { where?: { tenantId?: string }; orderBy?: { createdAt: 'desc' | 'asc' } }): Promise<AuditEventRecord[]>;
  };
  revocationRecord: {
    create(args: { data: RevocationRecord }): Promise<RevocationRecord>;
    findUnique(args: { where: { credentialId: string } }): Promise<RevocationRecord | null>;
  };
  $transaction<T>(fn: (tx: MinimalPrismaClient) => Promise<T>): Promise<T>;
}

export class PrismaDatabaseRepository implements IDatabaseRepository {
  constructor(private readonly prisma: MinimalPrismaClient) {}

  async getTenants(): Promise<TenantRecord[]> {
    return this.prisma.tenant.findMany();
  }

  async getTenant(id: string): Promise<TenantRecord | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async updateTenantUsage(id: string, usedDelta: number): Promise<TenantRecord> {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new Error(`Tenant ${id} not found`);
    const newUsed = existing.used + usedDelta;
    if (newUsed > existing.allocation) {
      throw new Error(`Tenant allocation exceeded: ${newUsed} > ${existing.allocation}`);
    }
    return this.prisma.tenant.update({
      where: { id },
      data: { used: newUsed },
    });
  }

  async getCreditPool(): Promise<CreditPoolRecord | null> {
    return this.prisma.creditPool.findFirst();
  }

  async updateCreditPool(pool: Partial<CreditPoolRecord>): Promise<CreditPoolRecord> {
    const existing = await this.prisma.creditPool.findFirst();
    if (!existing) throw new Error('Credit pool not initialized');
    return this.prisma.creditPool.update({
      where: { id: existing.id },
      data: pool,
    });
  }

  async findLedgerEntryByIdempotencyKey(key: string): Promise<CreditLedgerEntryRecord | null> {
    return this.prisma.creditLedgerEntry.findUnique({ where: { idempotencyKey: key } });
  }

  async createLedgerEntry(entry: Omit<CreditLedgerEntryRecord, 'createdAt'>): Promise<CreditLedgerEntryRecord> {
    return this.prisma.creditLedgerEntry.create({ data: entry });
  }

  async updateLedgerEntryStatus(
    key: string,
    status: CreditLedgerEntryRecord['status']
  ): Promise<CreditLedgerEntryRecord> {
    return this.prisma.creditLedgerEntry.update({
      where: { idempotencyKey: key },
      data: { status },
    });
  }

  async getLedgerEntries(tenantId?: string): Promise<CreditLedgerEntryRecord[]> {
    return this.prisma.creditLedgerEntry.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLearner(tenantId: string, externalRefHash: string): Promise<LearnerRecord | null> {
    return this.prisma.learner.findUnique({
      where: { tenantId_externalRefHash: { tenantId, externalRefHash } },
    });
  }

  async createLearner(learner: Omit<LearnerRecord, 'createdAt'>): Promise<LearnerRecord> {
    return this.prisma.learner.create({ data: learner });
  }

  async createMilestoneEvidence(
    evidence: Omit<MilestoneEvidenceRecord, 'createdAt'>
  ): Promise<MilestoneEvidenceRecord> {
    return this.prisma.milestoneEvidence.create({ data: evidence });
  }

  async getMilestoneEvidence(id: string): Promise<MilestoneEvidenceRecord | null> {
    return this.prisma.milestoneEvidence.findUnique({ where: { id } });
  }

  async createIssuedCredential(
    cred: Omit<IssuedCredentialRecord, 'createdAt'>
  ): Promise<IssuedCredentialRecord> {
    return this.prisma.issuedCredential.create({ data: cred });
  }

  async getIssuedCredential(id: string): Promise<IssuedCredentialRecord | null> {
    return this.prisma.issuedCredential.findUnique({ where: { id } });
  }

  async updateCredentialStatus(
    id: string,
    status: 'issued' | 'revoked',
    revokedAt?: Date
  ): Promise<IssuedCredentialRecord> {
    return this.prisma.issuedCredential.update({
      where: { id },
      data: { status, revokedAt: status === 'revoked' ? revokedAt ?? new Date() : null },
    });
  }

  async getCredentials(tenantId?: string): Promise<IssuedCredentialRecord[]> {
    return this.prisma.issuedCredential.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAuditEvent(event: Omit<AuditEventRecord, 'createdAt'>): Promise<AuditEventRecord> {
    return this.prisma.auditEvent.create({ data: event });
  }

  async getAuditEvents(tenantId?: string): Promise<AuditEventRecord[]> {
    return this.prisma.auditEvent.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRevocationRecord(record: RevocationRecord): Promise<RevocationRecord> {
    return this.prisma.revocationRecord.create({ data: record });
  }

  async isCredentialRevoked(credentialId: string): Promise<boolean> {
    const record = await this.prisma.revocationRecord.findUnique({ where: { credentialId } });
    return record !== null;
  }

  async runTransaction<T>(operation: (repo: IDatabaseRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (txClient) => {
      const txRepo = new PrismaDatabaseRepository(txClient);
      return operation(txRepo);
    });
  }
}
