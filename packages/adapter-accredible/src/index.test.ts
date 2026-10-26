import { describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  DeterministicMockAccredibleAdapter,
  LiveAccredibleHttpAdapter,
  verifyAccredibleWebhook,
  processAccredibleWebhook,
} from './index';

describe('adapter-accredible', () => {
  it('issues deterministic external IDs and tracks status', async () => {
    const a = new DeterministicMockAccredibleAdapter();
    const r = await a.issueCredential({
      tenantId: 'gulf-innovation',
      credentialId: 'c1',
      learnerId: 'l1',
      templateId: 'tpl-1',
    });
    expect(r.externalId).toBe('acc_cred_c1');
    expect(r.previewUrl).toContain('mock.accredible.example');
    expect(await a.getCredentialStatus(r.externalId)).toBe('issued');

    await a.revokeCredential(r.externalId);
    expect(await a.getCredentialStatus(r.externalId)).toBe('revoked');
  });

  it('verifies Accredible webhook signatures and dispatches events', async () => {
    const secret = 'accredible-webhook-secret-99';
    const payload = JSON.stringify({
      event: 'credential.issued',
      credential: {
        id: 12345,
        recipient: { name: 'Learner Test', email: 'test@example.com' },
        status: 'issued',
      },
    });

    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyAccredibleWebhook(payload, sig, secret)).toBe(true);
    expect(verifyAccredibleWebhook(payload, `sha256=${sig}`, secret)).toBe(true);
    expect(verifyAccredibleWebhook(payload, 'invalid-sig', secret)).toBe(false);

    let issuedCalled = false;
    await processAccredibleWebhook(payload, sig, secret, {
      onIssued: (evt) => {
        issuedCalled = true;
        expect(evt.credential.id).toBe(12345);
      },
    });
    expect(issuedCalled).toBe(true);
  });

  it('LiveAccredibleHttpAdapter retries transient errors and succeeds', async () => {
    let calls = 0;
    const fakeFetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        return new Response('Internal error', { status: 500 });
      }
      return new Response(
        JSON.stringify({
          id: 'live_cred_77',
          preview_url: 'https://credential.net/77',
          wallet_url: 'https://credential.net/wallet/77',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    });

    const adapter = new LiveAccredibleHttpAdapter(
      'https://api.accredible.com/v1',
      'test-token',
      fakeFetch as unknown as typeof fetch
    );

    const res = await adapter.issueCredential({
      tenantId: 't1',
      credentialId: 'cred-77',
      learnerId: 'l77',
      templateId: 'tpl',
    });

    expect(res.externalId).toBe('live_cred_77');
    expect(calls).toBe(2);
  });
});
