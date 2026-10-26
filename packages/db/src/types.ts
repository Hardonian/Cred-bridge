export interface TenantRecord {
  id: string;
  name: string;
  region: string;
  program: string;
  learners: number;
  allocation: number;
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPoolRecord {
  id: string;
  poolSize: number;
  contractCents: number;
  termStart: Date;
  termEnd: Date;
  warningThreshold: number;
  escalationThreshold: number;
  hardReserveThreshold: number;
  createdAt: Date;
}

export interface CreditLedgerEntryRecord {
  id: string;
  tenantId: string;
  idempotencyKey: string;
  kind: string;
  credits: number;
  status: 'RESERVED' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';
  reference: string;
  createdAt: Date;
}

export interface LearnerRecord {
  id: string;
  tenantId: string;
  externalRefHash: string;
  createdAt: Date;
}

export interface MilestoneEvidenceRecord {
  id: string;
  learnerId: string;
  achievementId: string;
  payloadHash: string;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface IssuedCredentialRecord {
  id: string;
  learnerId: string;
  tenantId: string;
  type: string;
  status: 'issued' | 'revoked';
  payload: Record<string, unknown>;
  externalId: string | null;
  issuedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface AuditEventRecord {
  id: string;
  tenantId: string;
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface RevocationRecord {
  id: string;
  credentialId: string;
  reason: string;
  revokedAt: Date;
}
