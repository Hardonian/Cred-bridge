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

export interface IDatabaseRepository {
  // Tenant
  getTenants(): Promise<TenantRecord[]>;
  getTenant(id: string): Promise<TenantRecord | null>;
  updateTenantUsage(id: string, usedDelta: number): Promise<TenantRecord>;

  // CreditPool
  getCreditPool(): Promise<CreditPoolRecord | null>;
  updateCreditPool(pool: Partial<CreditPoolRecord>): Promise<CreditPoolRecord>;

  // CreditLedgerEntry
  findLedgerEntryByIdempotencyKey(key: string): Promise<CreditLedgerEntryRecord | null>;
  createLedgerEntry(entry: Omit<CreditLedgerEntryRecord, 'createdAt'>): Promise<CreditLedgerEntryRecord>;
  updateLedgerEntryStatus(key: string, status: CreditLedgerEntryRecord['status']): Promise<CreditLedgerEntryRecord>;
  getLedgerEntries(tenantId?: string): Promise<CreditLedgerEntryRecord[]>;

  // Learner
  getLearner(tenantId: string, externalRefHash: string): Promise<LearnerRecord | null>;
  createLearner(learner: Omit<LearnerRecord, 'createdAt'>): Promise<LearnerRecord>;

  // MilestoneEvidence
  createMilestoneEvidence(evidence: Omit<MilestoneEvidenceRecord, 'createdAt'>): Promise<MilestoneEvidenceRecord>;
  getMilestoneEvidence(id: string): Promise<MilestoneEvidenceRecord | null>;

  // IssuedCredential
  createIssuedCredential(cred: Omit<IssuedCredentialRecord, 'createdAt'>): Promise<IssuedCredentialRecord>;
  getIssuedCredential(id: string): Promise<IssuedCredentialRecord | null>;
  updateCredentialStatus(id: string, status: 'issued' | 'revoked', revokedAt?: Date): Promise<IssuedCredentialRecord>;
  getCredentials(tenantId?: string): Promise<IssuedCredentialRecord[]>;

  // AuditEvent
  createAuditEvent(event: Omit<AuditEventRecord, 'createdAt'>): Promise<AuditEventRecord>;
  getAuditEvents(tenantId?: string): Promise<AuditEventRecord[]>;

  // Revocation
  createRevocationRecord(record: RevocationRecord): Promise<RevocationRecord>;
  isCredentialRevoked(credentialId: string): Promise<boolean>;

  // Transactions
  runTransaction<T>(operation: (repo: IDatabaseRepository) => Promise<T>): Promise<T>;
}
