import { describe, expect, it } from 'vitest';
import {
  mintAchievement,
  verifyCredential,
  generateEd25519KeyPair,
  exportPublicJwk,
  mintClr,
  exportLerRs,
  verifyRevocationStatus,
} from './index';
import { competencies } from '@credbridge/contracts';

describe('standards-credentials', () => {
  it('mints and verifies an OB3-shaped credential with default Ed25519 key', () => {
    const c = mintAchievement({
      credentialId: 'demo-1',
      learnerId: 'learner-1',
      achievementId: 'venture',
      name: 'Venture Validation',
      description: 'Synthetic milestone',
      competencies,
      evidenceId: 'evidence-1',
    });
    expect(c.type).toContain('OpenBadgeCredential');
    expect(c.proof.type).toBe('Ed25519Signature2020');
    expect(c.proof.jws).toBeDefined();
    expect(verifyCredential(c)).toBe(true);
  });

  it('mints and verifies with a custom generated Ed25519 keypair', () => {
    const keyPair = generateEd25519KeyPair('custom-inst-key-99');
    const c = mintAchievement({
      credentialId: 'custom-1',
      learnerId: 'learner-custom',
      achievementId: 'wil-comm',
      name: 'Workplace Comm',
      description: 'Custom key test',
      competencies,
      evidenceId: 'ev-99',
      signingKey: keyPair.privateKey,
      keyId: keyPair.keyId,
    });
    expect(c.proof.verificationMethod).toBe('did:web:credbridge.example#custom-inst-key-99');
    expect(verifyCredential(c, { publicKey: keyPair.publicKey })).toBe(true);
  });

  it('exports valid JWK matching Ed25519 public key', () => {
    const keyPair = generateEd25519KeyPair('jwk-key-1');
    const jwk = exportPublicJwk(keyPair.publicKey, keyPair.keyId);
    expect(jwk.kid).toBe('jwk-key-1');
    expect(jwk.kty).toBe('OKP');
    expect(jwk.crv).toBe('Ed25519');
    expect(jwk.alg).toBe('EdDSA');
    expect(jwk.use).toBe('sig');
    expect(typeof jwk.x).toBe('string');
  });

  it('mints a CLR 2.0 credential and exports LER-RS', () => {
    const c1 = mintAchievement({
      credentialId: 'ach-1',
      learnerId: 'learner-clr',
      achievementId: 'wil-comm',
      name: 'Workplace Comm',
      description: 'WIL skill',
      competencies: [competencies[0]!],
      evidenceId: 'ev-1',
    });
    const c2 = mintAchievement({
      credentialId: 'ach-2',
      learnerId: 'learner-clr',
      achievementId: 'ent-val',
      name: 'Venture Validation',
      description: 'Entrepreneurship skill',
      competencies: [competencies[1]!],
      evidenceId: 'ev-2',
    });

    const clr = mintClr({
      id: 'clr-bundle-1',
      learnerId: 'learner-clr',
      achievements: [c1, c2],
    });

    expect(clr.type).toContain('ClrCredential');
    expect(clr.credentialSubject.achievement).toHaveLength(2);
    expect(clr.proof.type).toBe('Ed25519Signature2020');

    const lerRs = exportLerRs(clr);
    expect(lerRs.version).toBe('1.0');
    expect(lerRs.learner.id).toBe('learner-clr');
    expect(lerRs.skills).toHaveLength(2);
    expect(lerRs.credentials).toHaveLength(2);
  });

  it('enforces revocation rejection during verification', () => {
    const c = mintAchievement({
      credentialId: 'revoked-test',
      learnerId: 'learner-rev',
      achievementId: 'wil-comm',
      name: 'Workplace Comm',
      description: 'Revocation test',
      competencies,
      evidenceId: 'ev-rev',
    });

    const revokedSet = new Set<string>([c.id]);
    expect(verifyCredential(c, { revokedIds: revokedSet })).toBe(false);

    const status = verifyRevocationStatus(c.id, revokedSet);
    expect(status.isRevoked).toBe(true);
    expect(status.revokedAt).toBeDefined();

    const activeStatus = verifyRevocationStatus('urn:credbridge:active-cred', revokedSet);
    expect(activeStatus.isRevoked).toBe(false);
  });
});
