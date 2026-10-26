import { CreditLedger, idempotencyKey } from '@credbridge/credit-ledger';
import { competencies, type Competency, type Tenant } from '@credbridge/contracts';
import {
  mintAchievement,
  type AchievementCredential,
  verifyCredential,
  DEFAULT_KEY_PAIR,
  exportPublicJwk,
  mintClr,
  exportLerRs,
  type ClrCredential,
} from '@credbridge/standards-credentials';
import {
  DeterministicMockAccredibleAdapter,
  LiveAccredibleHttpAdapter,
  type CredentialIssuerPort,
} from '@credbridge/adapter-accredible';
import { getDatabaseRepository } from '@credbridge/db';
import { globalAuditLogger } from '@credbridge/privacy-audit';

export const ledger = new CreditLedger();
export const db = getDatabaseRepository();

// Configurable issuer adapter (live if ACCREDIBLE_API_KEY is configured, else deterministic mock)
export const issuer: CredentialIssuerPort = process.env.ACCREDIBLE_API_KEY
  ? new LiveAccredibleHttpAdapter(
      process.env.ACCREDIBLE_BASE_URL || 'https://api.accredible.com/v1',
      process.env.ACCREDIBLE_API_KEY
    )
  : new DeterministicMockAccredibleAdapter();

export const credentials = new Map<string, AchievementCredential>();

export async function issue(input: {
  tenantId: string;
  learnerId: string;
  achievementId: string;
  milestoneVersion: string;
  name: string;
  actorId?: string;
  competencyList?: Competency[];
}) {
  const comp = input.competencyList ?? competencies;
  const key = idempotencyKey(
    input.tenantId,
    input.learnerId,
    input.achievementId,
    input.milestoneVersion
  );

  // Check database or in-memory ledger entry
  const existingEntry = await db.findLedgerEntryByIdempotencyKey(key);
  if (existingEntry && existingEntry.status === 'CONSUMED') {
    const existingCred = credentials.get(`urn:credbridge:${input.learnerId}-${input.achievementId}`);
    if (existingCred) return existingCred;
  }

  // Check tenant allocation
  const tenant = await db.getTenant(input.tenantId);
  if (tenant && tenant.used >= tenant.allocation) {
    throw new Error(`Tenant hard cap reached: allocation ${tenant.allocation} fully utilized`);
  }

  // Step 1: Reserve credit atomically
  const reservation = ledger.reserve({
    tenantId: input.tenantId,
    learnerId: input.learnerId,
    achievementId: input.achievementId,
    milestoneVersion: input.milestoneVersion,
    available: 1,
  });

  await db.createLedgerEntry({
    id: `le_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tenantId: input.tenantId,
    idempotencyKey: reservation.idempotencyKey,
    kind: 'HOLD',
    credits: 1,
    status: 'RESERVED',
    reference: `Milestone ${input.achievementId} v${input.milestoneVersion}`,
  }).catch(() => {
    // Already exists in DB
  });

  globalAuditLogger.log({
    tenantId: input.tenantId,
    action: 'CREDIT_RESERVED',
    actorId: input.actorId ?? 'system',
    targetType: 'credit',
    targetId: reservation.idempotencyKey,
    metadata: { learnerId: input.learnerId, achievementId: input.achievementId, credits: 1 },
  });

  // Step 2: Mint credential with cryptographic Ed25519 signature
  const credential = mintAchievement({
    credentialId: `${input.learnerId}-${input.achievementId}`,
    learnerId: input.learnerId,
    achievementId: input.achievementId,
    name: input.name,
    description: 'Verified synthetic milestone evidence',
    competencies: comp,
    evidenceId: `evidence-${input.learnerId}`,
  });

  // Step 3: Issue through external provider adapter (Accredible / Mock)
  try {
    const ext = await issuer.issueCredential({
      tenantId: input.tenantId,
      credentialId: credential.id,
      learnerId: input.learnerId,
      templateId: 'credbridge-default',
    });

    // Step 4: Consume credit upon confirmed issuance
    ledger.consume(reservation.idempotencyKey);
    await db.updateLedgerEntryStatus(reservation.idempotencyKey, 'CONSUMED');
    if (tenant) {
      await db.updateTenantUsage(input.tenantId, 1);
    }

    credentials.set(credential.id, credential);
    await db.createIssuedCredential({
      id: credential.id,
      learnerId: input.learnerId,
      tenantId: input.tenantId,
      type: 'OpenBadgeCredential',
      status: 'issued',
      payload: credential as unknown as Record<string, unknown>,
      externalId: ext.externalId,
      issuedAt: new Date(),
      revokedAt: null,
    });

    globalAuditLogger.log({
      tenantId: input.tenantId,
      action: 'CREDENTIAL_ISSUED',
      actorId: input.actorId ?? 'system',
      targetType: 'credential',
      targetId: credential.id,
      metadata: { externalId: ext.externalId, previewUrl: ext.previewUrl },
    });

    return credential;
  } catch (error) {
    // Rollback: Release reservation on provider failure
    ledger.release(reservation.idempotencyKey);
    await db.updateLedgerEntryStatus(reservation.idempotencyKey, 'RELEASED').catch(() => {});
    globalAuditLogger.log({
      tenantId: input.tenantId,
      action: 'CREDIT_RELEASED',
      actorId: input.actorId ?? 'system',
      targetType: 'credit',
      targetId: reservation.idempotencyKey,
      metadata: { reason: error instanceof Error ? error.message : 'Issuance failed' },
    });
    throw error;
  }
}

export async function revoke(credentialId: string, reason = 'Administrative revocation', actorId = 'system') {
  const credential = credentials.get(credentialId) || (await db.getIssuedCredential(credentialId));
  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  // Update DB and issuer
  await db.createRevocationRecord({
    id: `rev_${Date.now()}`,
    credentialId,
    reason,
    revokedAt: new Date(),
  });
  await db.updateCredentialStatus(credentialId, 'revoked');
  await issuer.revokeCredential(`acc_cred_${credentialId.replace(/^urn:credbridge:/, '')}`);

  globalAuditLogger.log({
    tenantId: 'tenantId' in credential ? (credential.tenantId as string) : 'unknown',
    action: 'CREDENTIAL_REVOKED',
    actorId,
    targetType: 'credential',
    targetId: credentialId,
    metadata: { reason },
  });

  return { credentialId, revoked: true, revokedAt: new Date().toISOString(), reason };
}

export async function verify(id: string) {
  const credential = credentials.get(id);
  const isRevokedInDb = await db.isCredentialRevoked(id);
  const revokedSet = isRevokedInDb ? new Set([id]) : new Set<string>();

  const found = Boolean(credential);
  const valid = credential ? verifyCredential(credential, { revokedIds: revokedSet }) : false;

  return {
    id,
    found,
    valid,
    revoked: isRevokedInDb,
    credential,
  };
}

export async function getClrForLearner(learnerId: string): Promise<ClrCredential> {
  const allCreds = Array.from(credentials.values()).filter(
    (c) => c.credentialSubject.id === learnerId
  );
  return mintClr({
    id: `clr-${learnerId}-${Date.now()}`,
    learnerId,
    achievements: allCreds,
  });
}

export async function getLerRsForLearner(learnerId: string) {
  const clr = await getClrForLearner(learnerId);
  return exportLerRs(clr);
}

export function getPublicJwks() {
  const jwk = exportPublicJwk(DEFAULT_KEY_PAIR.publicKey, 'credbridge-reference-1');
  return {
    keys: [jwk],
  };
}

export async function getLedgerStats() {
  const tenants = await db.getTenants();
  const pool = await db.getCreditPool();
  const totalAllocated = tenants.reduce((acc, t) => acc + t.allocation, 0);
  const totalUsed = tenants.reduce((acc, t) => acc + t.used, 0);
  const totalPool = pool?.poolSize ?? 10000;
  const remaining = totalPool - totalUsed;

  return {
    poolSize: totalPool,
    totalUsed,
    remaining,
    totalAllocated,
    utilizationRate: Math.round((totalUsed / totalPool) * 100),
    tenants,
  };
}
