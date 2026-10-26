import { describe, expect, it } from 'vitest';
import { POST as issuePost } from './credentials/issue/route';
import { GET as verifyGet } from './credentials/[id]/verify/route';
import { POST as revokePost } from './credentials/[id]/revoke/route';
import { GET as statusGet } from './credentials/[id]/status/route';
import { GET as jwksGet } from './.well-known/jwks.json/route';
import { GET as healthGet } from './health/route';
import { GET as ledgerGet } from './ledger/route';
import { GET as clrGet } from './learners/[id]/clr/route';
import { GET as lerRsGet } from './learners/[id]/ler-rs/route';
import { POST as simulationWebhookPost } from './simulations/webhook/route';
import { createHmac } from 'node:crypto';

describe('Web API Routes Integration', () => {
  it('GET /api/health returns healthy service status', async () => {
    const res = await healthGet();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('credbridge-web');
  });

  it('GET /api/.well-known/jwks.json returns Ed25519 public keys', async () => {
    const res = await jwksGet();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].kty).toBe('OKP');
    expect(data.keys[0].crv).toBe('Ed25519');
    expect(data.keys[0].alg).toBe('EdDSA');
  });

  it('Full issuance, verification, status, CLR, and revocation lifecycle', async () => {
    const req = new Request('http://localhost/api/credentials/issue', {
      method: 'POST',
      headers: {
        'x-credbridge-actor': 'admin-super',
        'x-credbridge-tenant': 'gulf-innovation',
        'x-credbridge-role': 'platform-admin',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: 'gulf-innovation',
        learnerId: 'learner-integ-1',
        achievementId: 'venture-integ',
        milestoneVersion: '1.0',
        name: 'Venture Incubation Award',
      }),
    });

    const issueRes = await issuePost(req);
    expect(issueRes.status).toBe(200);
    const issueData = await issueRes.json();
    expect(issueData.credential).toBeDefined();
    const credId = issueData.credential.id;

    // Verify
    const verifyRes = await verifyGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: encodeURIComponent(credId) }),
    });
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.found).toBe(true);
    expect(verifyData.valid).toBe(true);
    expect(verifyData.revoked).toBe(false);

    // Status
    const statusRes = await statusGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: encodeURIComponent(credId) }),
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.status).toBe('issued');

    // CLR bundle for learner
    const clrRes = await clrGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'learner-integ-1' }),
    });
    expect(clrRes.status).toBe(200);
    const clrData = await clrRes.json();
    expect(clrData.type).toContain('ClrCredential');
    expect(clrData.credentialSubject.id).toBe('learner-integ-1');

    // LER-RS skills bundle
    const lerRes = await lerRsGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'learner-integ-1' }),
    });
    expect(lerRes.status).toBe(200);
    const lerData = await lerRes.json();
    expect(lerData.version).toBe('1.0');
    expect(lerData.skills.length).toBeGreaterThan(0);

    // Revoke
    const revokeReq = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'x-credbridge-actor': 'admin-super',
        'x-credbridge-tenant': 'gulf-innovation',
        'x-credbridge-role': 'platform-admin',
      },
      body: JSON.stringify({ reason: 'Audit revocation test' }),
    });
    const revokeRes = await revokePost(revokeReq, {
      params: Promise.resolve({ id: encodeURIComponent(credId) }),
    });
    expect(revokeRes.status).toBe(200);

    // Status after revocation
    const statusAfter = await statusGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: encodeURIComponent(credId) }),
    });
    const statusAfterData = await statusAfter.json();
    expect(statusAfterData.status).toBe('revoked');
  });

  it('Simulation webhook receives event, verifies signature, and issues badge', async () => {
    const secret = 'simulation-default-secret-2026';
    const payload = JSON.stringify({
      event: 'milestone.completed',
      tenantId: 'emirates-polytechnic',
      learnerId: 'learner-sim-88',
      achievementId: 'wil-comm',
      score: 99,
      timestamp: new Date().toISOString(),
      evidenceRef: 'ev-sim-88',
    });

    const sig = createHmac('sha256', secret).update(payload).digest('hex');

    const req = new Request('http://localhost/api/simulations/webhook', {
      method: 'POST',
      headers: {
        'x-simulation-signature': `sha256=${sig}`,
        'content-type': 'application/json',
      },
      body: payload,
    });

    const res = await simulationWebhookPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.event).toBe('milestone.completed');
    expect(data.credentialId).toBeDefined();
  });

  it('GET /api/ledger returns ledger entries and pool stats for authorized user', async () => {
    const req = new Request('http://localhost/api/ledger', {
      headers: {
        'x-credbridge-actor': 'admin-1',
        'x-credbridge-tenant': 'gulf-innovation',
        'x-credbridge-role': 'platform-admin',
      },
    });

    const res = await ledgerGet(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.pool).toBe(10000);
    expect(data.remaining).toBeDefined();
    expect(Array.isArray(data.entries)).toBe(true);
  });
});
