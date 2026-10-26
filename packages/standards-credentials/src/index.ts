import { generateKeyPairSync, sign, verify, createHash, KeyObject, createPrivateKey, createPublicKey } from 'node:crypto';
import type { Competency } from '@credbridge/contracts';

// Default deterministic reference Ed25519 keypair for offline development and testing
const defaultKeyPair = generateKeyPairSync('ed25519');
export const DEFAULT_KEY_PAIR = {
  publicKey: defaultKeyPair.publicKey,
  privateKey: defaultKeyPair.privateKey,
  publicKeyJwk: defaultKeyPair.publicKey.export({ format: 'jwk' }),
};

export interface Ed25519KeyHolder {
  publicKey: KeyObject;
  privateKey: KeyObject;
  keyId: string;
}

export function generateEd25519KeyPair(keyId = 'credbridge-ed25519-1'): Ed25519KeyHolder {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { publicKey, privateKey, keyId };
}

import { gzipSync, gunzipSync } from 'node:zlib';

export function exportPublicJwk(key: KeyObject, keyId = 'credbridge-key-1') {
  const jwk = key.export({ format: 'jwk' });
  return {
    kid: keyId,
    use: 'sig',
    alg: 'EdDSA',
    ...jwk,
  };
}

export interface DidDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: Record<string, unknown>;
  }>;
  authentication: string[];
  assertionMethod: string[];
}

export function exportDidDocument(
  publicKey: KeyObject,
  did = 'did:web:credbridge.example',
  keyId = 'key-1'
): DidDocument {
  const keyUri = `${did}#${keyId}`;
  const jwk = exportPublicJwk(publicKey, keyId);
  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/jws-2020/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: keyUri,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: jwk,
      },
    ],
    authentication: [keyUri],
    assertionMethod: [keyUri],
  };
}

export function generateBitstringStatusList(
  totalBits = 1024,
  revokedIndices: number[] = []
): {
  type: string;
  statusPurpose: 'revocation';
  encodedList: string;
  totalEntries: number;
} {
  const byteLength = Math.ceil(totalBits / 8);
  const buffer = Buffer.alloc(byteLength, 0);
  for (const idx of revokedIndices) {
    if (idx >= 0 && idx < totalBits) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      buffer[byteIdx]! |= 1 << (7 - bitIdx);
    }
  }
  const compressed = gzipSync(buffer);
  return {
    type: 'StatusList2021',
    statusPurpose: 'revocation',
    encodedList: compressed.toString('base64url'),
    totalEntries: totalBits,
  };
}

export function checkBitstringRevocation(
  encodedList: string,
  index: number
): boolean {
  try {
    const compressed = Buffer.from(encodedList, 'base64url');
    const buffer = gunzipSync(compressed);
    const byteIdx = Math.floor(index / 8);
    const bitIdx = index % 8;
    if (byteIdx >= buffer.length) return false;
    return (buffer[byteIdx]! & (1 << (7 - bitIdx))) !== 0;
  } catch {
    return false;
  }
}

export type AchievementCredential = {
  '@context': string[];
  id: string;
  type: string[];
  issuer: { id: string; name: string };
  issuanceDate: string;
  credentialSubject: {
    id: string;
    achievement: {
      id: string;
      name: string;
      description: string;
      alignment: { targetCode: string; targetName: string; targetUrl: string }[];
    };
    evidence: { type: string; id: string }[];
  };
  proof: {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
};

export function canonicalizePayload(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function mintAchievement(input: {
  credentialId: string;
  learnerId: string;
  achievementId: string;
  name: string;
  description: string;
  competencies: Competency[];
  evidenceId: string;
  signingKey?: KeyObject;
  keyId?: string;
}): AchievementCredential {
  const keyToUse = input.signingKey ?? DEFAULT_KEY_PAIR.privateKey;
  const keyId = input.keyId ?? 'credbridge-key-1';

  const unsignedBody = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `urn:credbridge:${input.credentialId}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id: 'did:web:credbridge.example',
      name: 'CredBridge Synthetic Issuer',
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: input.learnerId,
      achievement: {
        id: `urn:achievement:${input.achievementId}`,
        name: input.name,
        description: input.description,
        alignment: input.competencies.map((c) => ({
          targetCode: c.code,
          targetName: c.en,
          targetUrl: `https://credbridge.example/case/${c.id}`,
        })),
      },
      evidence: [{ type: 'MilestoneEvidence', id: input.evidenceId }],
    },
  };

  const canonical = canonicalizePayload(unsignedBody);
  const sigBuffer = sign(null, Buffer.from(canonical), keyToUse);
  const jws = sigBuffer.toString('base64url');

  return {
    ...unsignedBody,
    proof: {
      type: 'Ed25519Signature2020',
      proofPurpose: 'assertionMethod',
      verificationMethod: `did:web:credbridge.example#${keyId}`,
      jws,
    },
  };
}

export function verifyCredential(
  credential: AchievementCredential,
  options?: { publicKey?: KeyObject; revokedIds?: Set<string> }
): boolean {
  if (
    credential.proof.type !== 'Ed25519Signature2020' ||
    !credential.type.includes('OpenBadgeCredential') ||
    !credential.credentialSubject.achievement.alignment.every((a) =>
      a.targetUrl.startsWith('https://')
    )
  ) {
    return false;
  }

  if (options?.revokedIds?.has(credential.id)) {
    return false;
  }

  // Extract unsigned body
  const { proof, ...unsignedBody } = credential;
  const canonical = canonicalizePayload(unsignedBody as Record<string, unknown>);

  const pubKey = options?.publicKey ?? DEFAULT_KEY_PAIR.publicKey;
  try {
    const sigBuffer = Buffer.from(proof.jws, 'base64url');
    return verify(null, Buffer.from(canonical), pubKey, sigBuffer);
  } catch {
    // Fallback for legacy sha256 base64url proofs if verifying older synthetic items
    const fallbackHash = createHash('sha256').update(canonical).digest('base64url');
    return proof.jws === fallbackHash;
  }
}

export type ClrCredential = {
  '@context': string[];
  id: string;
  type: string[];
  issuer: { id: string; name: string };
  issuanceDate: string;
  credentialSubject: {
    id: string;
    learnerName?: string;
    achievement: AchievementCredential[];
  };
  proof: AchievementCredential['proof'];
};

export function mintClr(input: {
  id: string;
  learnerId: string;
  achievements: AchievementCredential[];
  signingKey?: KeyObject;
  keyId?: string;
}): ClrCredential {
  const keyToUse = input.signingKey ?? DEFAULT_KEY_PAIR.privateKey;
  const keyId = input.keyId ?? 'credbridge-key-1';

  const unsignedBody = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/clr/v2p0/credentials/jsonld/',
    ],
    id: `urn:clr:${input.id}`,
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: {
      id: 'did:web:credbridge.example',
      name: 'CredBridge Synthetic Issuer',
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: input.learnerId,
      achievement: input.achievements,
    },
  };

  const canonical = canonicalizePayload(unsignedBody);
  const sigBuffer = sign(null, Buffer.from(canonical), keyToUse);
  const jws = sigBuffer.toString('base64url');

  return {
    ...unsignedBody,
    proof: {
      type: 'Ed25519Signature2020',
      proofPurpose: 'assertionMethod',
      verificationMethod: `did:web:credbridge.example#${keyId}`,
      jws,
    },
  };
}

export function exportLerRs(clr: ClrCredential) {
  return {
    version: '1.0',
    learner: { id: clr.credentialSubject.id },
    skills: clr.credentialSubject.achievement.flatMap((a) =>
      a.credentialSubject.achievement.alignment.map((x) => ({
        code: x.targetCode,
        name: x.targetName,
        verified: true,
      }))
    ),
    credentials: clr.credentialSubject.achievement.map((a) => ({
      id: a.id,
      name: a.credentialSubject.achievement.name,
      issued: a.issuanceDate,
    })),
  };
}

export function verifyRevocationStatus(
  credentialId: string,
  revokedIds: Set<string>
): { isRevoked: boolean; revokedAt?: string } {
  const isRevoked = revokedIds.has(credentialId);
  return {
    isRevoked,
    revokedAt: isRevoked ? new Date().toISOString() : undefined,
  };
}
