import { createHmac, timingSafeEqual } from 'node:crypto';

export type IssueRequest = {
  tenantId: string;
  credentialId: string;
  learnerId: string;
  templateId: string;
};

export type IssueResponse = {
  externalId: string;
  previewUrl: string;
  walletUrl: string;
};

export interface CredentialIssuerPort {
  issueCredential(request: IssueRequest): Promise<IssueResponse>;
  revokeCredential(externalId: string): Promise<void>;
  getCredentialStatus(externalId: string): Promise<'issued' | 'revoked'>;
}

export class DeterministicMockAccredibleAdapter implements CredentialIssuerPort {
  private readonly statuses = new Map<string, 'issued' | 'revoked'>();

  async issueCredential(request: IssueRequest): Promise<IssueResponse> {
    const externalId = `acc_cred_${request.credentialId}`;
    this.statuses.set(externalId, 'issued');
    return {
      externalId,
      previewUrl: `https://mock.accredible.example/credential/${externalId}`,
      walletUrl: `https://mock.accredible.example/wallet/${externalId}`,
    };
  }

  async revokeCredential(externalId: string): Promise<void> {
    this.statuses.set(externalId, 'revoked');
  }

  async getCredentialStatus(externalId: string): Promise<'issued' | 'revoked'> {
    return this.statuses.get(externalId) ?? 'revoked';
  }
}

export class LiveAccredibleHttpAdapter implements CredentialIssuerPort {
  private failures = 0;
  private openedUntil = 0;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetcher = fetch
  ) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (Date.now() < this.openedUntil) throw new Error('Accredible circuit open');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.fetcher(`${this.baseUrl}${path}`, {
          ...init,
          headers: {
            'content-type': 'application/json',
            authorization: `Token token=${this.token}`,
            ...init.headers,
          },
        });
        if (response.ok) {
          this.failures = 0;
          return response;
        }
        if (response.status === 422) throw new Error('Accredible permanent validation failure');
        throw new Error(`Accredible upstream ${response.status}`);
      } catch (error) {
        this.failures++;
        if (this.failures >= 5) this.openedUntil = Date.now() + 30_000;
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    throw new Error('Unreachable');
  }

  async issueCredential(request: IssueRequest): Promise<IssueResponse> {
    const response = await this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    const data = (await response.json()) as {
      id: string;
      preview_url?: string;
      wallet_url?: string;
    };
    return {
      externalId: data.id,
      previewUrl: data.preview_url ?? '',
      walletUrl: data.wallet_url ?? '',
    };
  }

  async revokeCredential(externalId: string): Promise<void> {
    await this.request(`/credentials/${encodeURIComponent(externalId)}`, {
      method: 'DELETE',
    });
  }

  async getCredentialStatus(externalId: string): Promise<'issued' | 'revoked'> {
    const response = await this.request(`/credentials/${encodeURIComponent(externalId)}`);
    const data = (await response.json()) as { status: string };
    return data.status === 'revoked' ? 'revoked' : 'issued';
  }
}

// Accredible Webhook Ingestion & Verification
export interface AccredibleWebhookEvent {
  event: 'credential.issued' | 'credential.revoked' | 'credential.updated';
  credential: {
    id: string | number;
    recipient?: { name?: string; email?: string };
    group_id?: string | number;
    issued_on?: string;
    expired_on?: string | null;
    status?: string;
  };
}

export function verifyAccredibleWebhook(
  payloadString: string,
  signatureHeader: string,
  signingSecret: string
): boolean {
  if (!signatureHeader || !signingSecret) return false;
  const hmac = createHmac('sha256', signingSecret).update(payloadString).digest('hex');
  const cleanSig = signatureHeader.replace(/^sha256=/, '');
  const a = Buffer.from(cleanSig);
  const b = Buffer.from(hmac);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function processAccredibleWebhook(
  rawBody: string,
  signature: string,
  secret: string,
  callbacks: {
    onIssued?: (event: AccredibleWebhookEvent) => Promise<void> | void;
    onRevoked?: (event: AccredibleWebhookEvent) => Promise<void> | void;
  }
): Promise<{ success: boolean; event?: string }> {
  if (!verifyAccredibleWebhook(rawBody, signature, secret)) {
    throw new Error('Invalid Accredible webhook signature');
  }

  const event = JSON.parse(rawBody) as AccredibleWebhookEvent;
  if (event.event === 'credential.issued' && callbacks.onIssued) {
    await callbacks.onIssued(event);
  } else if (event.event === 'credential.revoked' && callbacks.onRevoked) {
    await callbacks.onRevoked(event);
  }

  return { success: true, event: event.event };
}
