export type AuditAction =
  | 'CREDENTIAL_ISSUED'
  | 'CREDENTIAL_REVOKED'
  | 'CREDIT_RESERVED'
  | 'CREDIT_CONSUMED'
  | 'CREDIT_RELEASED'
  | 'LTI_LAUNCH'
  | 'SIMULATION_WEBHOOK';

export type AuditEvent = {
  id: string;
  tenantId: string;
  action: AuditAction | string;
  actorId: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

const SECRET_KEYS = new Set([
  'token',
  'authorization',
  'jwt',
  'apikey',
  'secret',
  'password',
  'privatekey',
  'email',
  'phone',
  'ssn',
]);

export function redact(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SECRET_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redact(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === 'object' ? redact(item as Record<string, unknown>) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class AuditLogger {
  private events: AuditEvent[] = [];

  log(event: Omit<AuditEvent, 'id' | 'createdAt'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      metadata: redact(event.metadata),
    };
    this.events.push(fullEvent);
    return fullEvent;
  }

  getEvents(filter?: { tenantId?: string; action?: string; limit?: number }): AuditEvent[] {
    let result = this.events;
    if (filter?.tenantId) {
      result = result.filter((e) => e.tenantId === filter.tenantId);
    }
    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action);
    }
    result = [...result].reverse();
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  clear(): void {
    this.events = [];
  }
}

export const globalAuditLogger = new AuditLogger();
