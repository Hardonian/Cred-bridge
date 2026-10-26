import { describe, expect, it } from 'vitest';
import { redact, AuditLogger } from './index';

describe('privacy-audit', () => {
  it('redacts sensitive keys including nested structures', () => {
    const raw = {
      tenantId: 't1',
      token: 'super-secret-token',
      nested: {
        email: 'learner@example.com',
        achievementId: 'wil-comm',
        apiKey: 'api-1234',
      },
      list: [{ phone: '+123456789', id: '1' }],
    };

    const sanitized = redact(raw) as {
      token: string;
      nested: { email: string; achievementId: string; apiKey: string };
      list: Array<{ phone: string; id: string }>;
    };

    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.nested.email).toBe('[REDACTED]');
    expect(sanitized.nested.apiKey).toBe('[REDACTED]');
    expect(sanitized.nested.achievementId).toBe('wil-comm');
    expect(sanitized.list[0]?.phone).toBe('[REDACTED]');
    expect(sanitized.list[0]?.id).toBe('1');
  });

  it('AuditLogger records and queries events with auto-redacted metadata', () => {
    const logger = new AuditLogger();
    logger.log({
      tenantId: 'gulf-innovation',
      action: 'CREDENTIAL_ISSUED',
      actorId: 'admin-1',
      targetType: 'credential',
      targetId: 'urn:credbridge:cred-1',
      metadata: { learnerEmail: 'test@example.com', token: 'jwt-123', credits: 1 },
    });

    logger.log({
      tenantId: 'emirates-polytechnic',
      action: 'CREDIT_RESERVED',
      actorId: 'admin-2',
      targetType: 'credit',
      targetId: 'res-1',
      metadata: { credits: 1 },
    });

    const all = logger.getEvents();
    expect(all).toHaveLength(2);
    expect(all[0]?.action).toBe('CREDIT_RESERVED'); // sorted newest first
    expect(all[1]?.metadata.token).toBe('[REDACTED]');

    const gulfOnly = logger.getEvents({ tenantId: 'gulf-innovation' });
    expect(gulfOnly).toHaveLength(1);
    expect(gulfOnly[0]?.tenantId).toBe('gulf-innovation');
  });
});
