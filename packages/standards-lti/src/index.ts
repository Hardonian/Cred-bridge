import { createHmac, timingSafeEqual } from 'node:crypto';

export type LtiClaims = {
  iss?: string;
  aud?: string | string[];
  nonce?: string;
  exp?: number;
  iat?: number;
  ['https://purl.imsglobal.org/spec/lti/claim/deployment_id']: string;
  ['https://purl.imsglobal.org/spec/lti/claim/context']?: { id: string; label?: string };
  ['https://purl.imsglobal.org/spec/lti/claim/roles']: string[];
  ['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint']?: {
    scope: string[];
    lineitems?: string;
    lineitem?: string;
  };
  ['https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice']?: {
    context_memberships_url: string;
    service_versions: string[];
  };
};

export function decodeLtiClaims(
  token: string,
  issuer: string,
  audience: string,
  nonce: string
): LtiClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const payload = JSON.parse(
    Buffer.from(parts[1] ?? '', 'base64url').toString()
  ) as LtiClaims;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (
    payload.iss !== issuer ||
    !audiences.includes(audience) ||
    payload.nonce !== nonce ||
    (payload.exp ?? 0) < Date.now() / 1000 ||
    !payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'] ||
    !payload['https://purl.imsglobal.org/spec/lti/claim/roles']?.length
  ) {
    throw new Error('Invalid LTI claims');
  }
  return payload;
}

export function mapLtiRole(roles: string[]) {
  if (roles.some((r) => r.endsWith('#Administrator'))) return 'platform-admin' as const;
  if (
    roles.some(
      (r) => r.endsWith('#Instructor') || r.endsWith('#TeachingAssistant')
    )
  )
    return 'faculty' as const;
  return 'learner' as const;
}

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// LTI 1.3 Advantage: Assignment & Grade Services (AGS)
export interface AgsLineItem {
  id?: string;
  label: string;
  scoreMaximum: number;
  resourceId?: string;
  tag?: string;
}

export function buildAgsLineItem(input: {
  label: string;
  scoreMaximum: number;
  resourceId?: string;
  tag?: string;
}): AgsLineItem {
  return {
    label: input.label,
    scoreMaximum: input.scoreMaximum,
    resourceId: input.resourceId,
    tag: input.tag ?? 'credbridge-outcome',
  };
}

export interface ScorePublishPayload {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  timestamp: string;
  activityProgress: 'Initialized' | 'Started' | 'InProgress' | 'Submitted' | 'Completed';
  gradingProgress: 'FullyGraded' | 'Pending' | 'PendingManual' | 'Failed' | 'NotReady';
}

export function buildScorePublishPayload(input: {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  activityProgress?: ScorePublishPayload['activityProgress'];
  gradingProgress?: ScorePublishPayload['gradingProgress'];
}): ScorePublishPayload {
  return {
    userId: input.userId,
    scoreGiven: input.scoreGiven,
    scoreMaximum: input.scoreMaximum,
    comment: input.comment ?? 'Competency milestone verified by CredBridge',
    timestamp: new Date().toISOString(),
    activityProgress: input.activityProgress ?? 'Completed',
    gradingProgress: input.gradingProgress ?? 'FullyGraded',
  };
}

// LTI 1.3 Advantage: Names and Role Provisioning Services (NRPS)
export interface NrpsMember {
  user_id: string;
  roles: string[];
  name?: string;
  email?: string;
  status?: string;
}

export function parseNrpsMembership(payload: { members: NrpsMember[] }) {
  return payload.members.map((m) => ({
    userId: m.user_id,
    role: mapLtiRole(m.roles),
    name: m.name ?? 'Anonymous Learner',
    email: m.email,
    active: m.status !== 'Inactive',
  }));
}

// LTI 1.3 Advantage: Deep Linking 2.0
export function buildDeepLinkingResponse(input: {
  deploymentId: string;
  data?: string;
  contentItems: Array<{
    type: string;
    title: string;
    url: string;
    lineItem?: { scoreMaximum: number };
  }>;
}) {
  return {
    ['https://purl.imsglobal.org/spec/lti/claim/message_type']: 'LtiDeepLinkingResponse',
    ['https://purl.imsglobal.org/spec/lti/claim/version']: '1.3.0',
    ['https://purl.imsglobal.org/spec/lti/claim/deployment_id']: input.deploymentId,
    ['https://purl.imsglobal.org/spec/lti-dl/claim/data']: input.data,
    ['https://purl.imsglobal.org/spec/lti-dl/claim/content_items']: input.contentItems,
  };
}

// Simulation Webhook Handler
export interface SimulationEvent {
  event: 'milestone.completed' | 'simulation.passed' | 'competency.assessed';
  tenantId: string;
  learnerId: string;
  achievementId: string;
  score: number;
  timestamp: string;
  evidenceRef: string;
}

export function verifySimulationWebhook(
  payloadString: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const cleanSig = signatureHeader.replace(/^sha256=/, '');
  return verifyHmac(payloadString, cleanSig, secret);
}

export function parseSimulationEvent(payloadString: string): SimulationEvent {
  const data = JSON.parse(payloadString) as SimulationEvent;
  if (!data.event || !data.tenantId || !data.learnerId || !data.achievementId) {
    throw new Error('Invalid simulation event schema');
  }
  return data;
}
