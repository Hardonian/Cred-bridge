import { tenants as syntheticTenants } from '@credbridge/contracts';
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

export class MemoryDatabaseRepository implements IDatabaseRepository {
  private tenants = new Map<string, TenantRecord>();
  private creditPool: CreditPoolRecord;
  private ledgerEntries = new Map<string, CreditLedgerEntryRecord>();
  private learners = new Map<string, LearnerRecord>();
  private evidence = new Map<string, MilestoneEvidenceRecord>();
  private credentials = new Map<string, IssuedCredentialRecord>();
  private auditEvents: AuditEventRecord[] = [];
  private revocations = new Map<string, RevocationRecord>();

  constructor() {
    // Seed default credit pool (10,000 credits, $5,400 USD contract, 24-month term)
    this.creditPool = {
      id: 'pool-main-2026',
      poolSize: 10000,
      contractCents: 540000,
      termStart: new Date('2026-01-01T00:00:00Z'),
      termEnd: new Date('2027-12-31T23:59:59Z'),
      warningThreshold: 0.85,
      escalationThreshold: 0.95,
      hardReserveThreshold: 1.0,
      createdAt: new Date(),
    };

    // Seed synthetic tenants
    for (const t of syntheticTenants) {
      this.tenants.set(t.id, {
        id: t.id,
        name: t.name,
        region: t.region,
        program: t.program,
        learners: t.learners,
        allocation: t.allocation,
        used: t.used,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      });
    }
  }

  // Clone constructor for transaction support
  private clone(): MemoryDatabaseRepository {
    const copy = new MemoryDatabaseRepository();
    copy.tenants = new Map(Array.from(this.tenants.entries()).map(([k, v]) => [k, { ...v }]));
    copy.creditPool = { ...this.creditPool };
    copy.ledgerEntries = new Map(
      Array.from(this.ledgerEntries.entries()).map(([k, v]) => [k, { ...v }])
    );
    copy.learners = new Map(Array.from(this.learners.entries()).map(([k, v]) => [k, { ...v }]));
    copy.evidence = new Map(Array.from(this.evidence.entries()).map(([k, v]) => [k, { ...v }]));
    copy.credentials = new Map(
      Array.from(this.credentials.entries()).map(([k, v]) => [k, { ...v }])
    );
    copy.auditEvents = [...this.auditEvents.map((e) => ({ ...e }))];
    copy.revocations = new Map(
      Array.from(this.revocations.entries()).map(([k, v]) => [k, { ...v }])
    );
    return copy;
  }

  private applyFrom(other: MemoryDatabaseRepository): void {
    this.tenants = other.tenants;
    this.creditPool = other.creditPool;
    this.ledgerEntries = other.ledgerEntries;
    this.learners = other.learners;
    this.evidence = other.evidence;
    this.credentials = other.credentials;
    this.auditEvents = other.auditEvents;
    this.revocations = other.revocations;
  }

  // Tenant operations
  async getTenants(): Promise<TenantRecord[]> {
    return Array.from(this.tenants.values());
  }

  async getTenant(id: string): Promise<TenantRecord | null> {
    return this.tenants.get(id) ? { ...this.tenants.get(id)! } : null;
  }

  async updateTenantUsage(id: string, usedDelta: number): Promise<TenantRecord> {
    const tenant = this.tenants.get(id);
    if (!tenant) throw new Error(`Tenant ${id} not found`);
    const newUsed = tenant.used + usedDelta;
    if (newUsed > tenant.allocation) {
      throw new Error(`Tenant ${id} allocation cap exceeded: ${newUsed} > ${tenant.allocation}`);
    }
    tenant.used = newUsed;
    tenant.updatedAt = new Date();
    return { ...tenant };
  }

  // CreditPool operations
  async getCreditPool(): Promise<CreditPoolRecord | null> {
    return { ...this.creditPool };
  }

  async updateCreditPool(pool: Partial<CreditPoolRecord>): Promise<CreditPoolRecord> {
    this.creditPool = { ...this.creditPool, ...pool };
    return { ...this.creditPool };
  }

  // CreditLedgerEntry operations
  async findLedgerEntryByIdempotencyKey(key: string): Promise<CreditLedgerEntryRecord | null> {
    const found = this.ledgerEntries.get(key);
    return found ? { ...found } : null;
  }

  async createLedgerEntry(
    entry: Omit<CreditLedgerEntryRecord, 'createdAt'>
  ): Promise<CreditLedgerEntryRecord> {
    if (this.ledgerEntries.has(entry.idempotencyKey)) {
      throw new Error(`Unique constraint violation: idempotencyKey ${entry.idempotencyKey}`);
    }
    const record: CreditLedgerEntryRecord = {
      ...entry,
      createdAt: new Date(),
    };
    this.ledgerEntries.set(entry.idempotencyKey, record);
    return { ...record };
  }

  async updateLedgerEntryStatus(
    key: string,
    status: CreditLedgerEntryRecord['status']
  ): Promise<CreditLedgerEntryRecord> {
    const entry = this.ledgerEntries.get(key);
    if (!entry) throw new Error(`Ledger entry ${key} not found`);
    entry.status = status;
    return { ...entry };
  }

  async getLedgerEntries(tenantId?: string): Promise<CreditLedgerEntryRecord[]> {
    const all = Array.from(this.ledgerEntries.values());
    if (tenantId) return all.filter((e) => e.tenantId === tenantId);
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Learner operations
  async getLearner(tenantId: string, externalRefHash: string): Promise<LearnerRecord | null> {
    const key = `${tenantId}:${externalRefHash}`;
    const found = this.learners.get(key);
    return found ? { ...found } : null;
  }

  async createLearner(learner: Omit<LearnerRecord, 'createdAt'>): Promise<LearnerRecord> {
    const key = `${learner.tenantId}:${learner.externalRefHash}`;
    if (this.learners.has(key)) {
      return { ...this.learners.get(key)! };
    }
    const record: LearnerRecord = {
      ...learner,
      createdAt: new Date(),
    };
    this.learners.set(key, record);
    return { ...record };
  }

  // MilestoneEvidence operations
  async createMilestoneEvidence(
    evidence: Omit<MilestoneEvidenceRecord, 'createdAt'>
  ): Promise<MilestoneEvidenceRecord> {
    const record: MilestoneEvidenceRecord = {
      ...evidence,
      createdAt: new Date(),
    };
    this.evidence.set(evidence.id, record);
    return { ...record };
  }

  async getMilestoneEvidence(id: string): Promise<MilestoneEvidenceRecord | null> {
    const found = this.evidence.get(id);
    return found ? { ...found } : null;
  }

  // IssuedCredential operations
  async createIssuedCredential(
    cred: Omit<IssuedCredentialRecord, 'createdAt'>
  ): Promise<IssuedCredentialRecord> {
    const record: IssuedCredentialRecord = {
      ...cred,
      createdAt: new Date(),
    };
    this.credentials.set(cred.id, record);
    return { ...record };
  }

  async getIssuedCredential(id: string): Promise<IssuedCredentialRecord | null> {
    const found = this.credentials.get(id);
    return found ? { ...found } : null;
  }

  async updateCredentialStatus(
    id: string,
    status: 'issued' | 'revoked',
    revokedAt?: Date
  ): Promise<IssuedCredentialRecord> {
    const cred = this.credentials.get(id);
    if (!cred) throw new Error(`Credential ${id} not found`);
    cred.status = status;
    if (status === 'revoked') {
      cred.revokedAt = revokedAt ?? new Date();
    }
    return { ...cred };
  }

  async getCredentials(tenantId?: string): Promise<IssuedCredentialRecord[]> {
    const all = Array.from(this.credentials.values());
    if (tenantId) return all.filter((c) => c.tenantId === tenantId);
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // AuditEvent operations
  async createAuditEvent(event: Omit<AuditEventRecord, 'createdAt'>): Promise<AuditEventRecord> {
    const record: AuditEventRecord = {
      ...event,
      createdAt: new Date(),
    };
    this.auditEvents.push(record);
    return { ...record };
  }

  async getAuditEvents(tenantId?: string): Promise<AuditEventRecord[]> {
    if (tenantId) return this.auditEvents.filter((e) => e.tenantId === tenantId);
    return [...this.auditEvents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Revocation operations
  async createRevocationRecord(record: RevocationRecord): Promise<RevocationRecord> {
    this.revocations.set(record.credentialId, record);
    return { ...record };
  }

  async isCredentialRevoked(credentialId: string): Promise<boolean> {
    return this.revocations.has(credentialId);
  }

  // Transaction support
  async runTransaction<T>(operation: (repo: IDatabaseRepository) => Promise<T>): Promise<T> {
    const snapshot = this.clone();
    try {
      const result = await operation(snapshot);
      this.applyFrom(snapshot);
      return result;
    } catch (error) {
      // Rollback: snapshot discarded
      throw error;
    }
  }
}
