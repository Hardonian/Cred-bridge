import { describe, expect, it } from 'vitest';
import { POST as issuePost } from './credentials/issue/route';
import { GET as verifyGet } from './credentials/[id]/verify/route';
import { POST as revokePost } from './credentials/[id]/revoke/route';
import { GET as statusGet } from './credentials/[id]/status/route';
import { GET as jwksGet } from './.well-known/jwks.json/route';
import { GET as didGet } from './.well-known/did.json/route';
import { GET as statusListGet } from './credentials/status-list/route';
import { GET as healthGet } from './health/route';
import { GET as ledgerGet } from './ledger/route';
import { GET as clrGet } from './learners/[id]/clr/route';
import { GET as lerRsGet } from './learners/[id]/ler-rs/route';
import { POST as simulationWebhookPost } from './simulations/webhook/route';
import { GET as caseFrameworksGet } from './case/frameworks/route';
import { GET as casePackageGet } from './case/packages/[id]/route';
import { GET as ltiLoginGet } from './lti/login/route';
import { POST as ltiDeepLinkPost } from './lti/deep-link/route';
import { POST as forecastPost } from './ledger/forecast/route';
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

  it('GET /api/.well-known/did.json returns W3C did:web document', async () => {
    const res = await didGet();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe('did:web:credbridge.example');
    expect(data.verificationMethod).toHaveLength(1);
    expect(data.assertionMethod).toContain('did:web:credbridge.example#key-1');
  });

  it('GET /api/credentials/status-list returns W3C StatusList2021 bitstring', async () => {
    const res = await statusListGet();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.type).toContain('StatusList2021Credential');
    expect(data.credentialSubject.type).toBe('StatusList2021');
    expect(typeof data.credentialSubject.encodedList).toBe('string');
  });

  it('GET /api/case/frameworks and /api/case/packages/[id] return CASE 1.1 packages', async () => {
    const listRes = await caseFrameworksGet();
    const listData = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listData.standard).toBe('CASE 1.1');
    expect(listData.frameworks.length).toBeGreaterThanOrEqual(3);

    const pkgRes = await casePackageGet(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'wil-workplace' }),
    });
    const pkgData = await pkgRes.json();
    expect(pkgRes.status).toBe(200);
    expect(pkgData.CFDocument.identifier).toBe('credbridge.case.1');
    expect(pkgData.CFItems.length).toBeGreaterThan(0);
  });

  it('LTI 1.3 endpoints: GET /api/lti/login and POST /api/lti/deep-link', async () => {
    const loginReq = new Request(
      'http://localhost/api/lti/login?iss=https://canvas.example.edu&login_hint=user-42'
    );
    const loginRes = await ltiLoginGet(loginReq);
    expect(loginRes.status).toBe(302);
    const location = loginRes.headers.get('location') || '';
    expect(location).toContain('https://canvas.example.edu/api/lti/authorize');
    expect(location).toContain('login_hint=user-42');

    const dlReq = new Request('http://localhost/api/lti/deep-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deploymentId: 'dep-canvas-99' }),
    });
    const dlRes = await ltiDeepLinkPost(dlReq);
    expect(dlRes.status).toBe(200);
    const dlData = await dlRes.json();
    expect(dlData['https://purl.imsglobal.org/spec/lti/claim/message_type']).toBe(
      'LtiDeepLinkingResponse'
    );
  });

  it('POST /api/ledger/forecast models multi-month contract and margin projections', async () => {
    const req = new Request('http://localhost/api/ledger/forecast', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        months: 12,
        initialMonthlyLearners: 500,
        licensePricePerLearner: 60,
      }),
    });
    const res = await forecastPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.forecast.points).toHaveLength(12);
    expect(data.forecast.totalRevenue).toBeGreaterThan(0);
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
