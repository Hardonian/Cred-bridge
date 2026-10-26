import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  decodeLtiClaims,
  mapLtiRole,
  verifyHmac,
  buildAgsLineItem,
  buildScorePublishPayload,
  parseNrpsMembership,
  buildDeepLinkingResponse,
  verifySimulationWebhook,
  parseSimulationEvent,
} from './index';

describe('standards-lti', () => {
  it('maps LTI roles correctly', () => {
    expect(
      mapLtiRole(['http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator'])
    ).toBe('platform-admin');
    expect(
      mapLtiRole(['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'])
    ).toBe('faculty');
    expect(
      mapLtiRole(['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'])
    ).toBe('learner');
  });

  it('verifies HMAC signatures and rejects tampering', () => {
    const payload = JSON.stringify({ milestone: 'complete', score: 95 });
    const secret = 'shared-secret-123456';
    const sig = createHmac('sha256', secret).update(payload).digest('hex');

    expect(verifyHmac(payload, sig, secret)).toBe(true);
    expect(verifyHmac(payload, 'deadbeef', secret)).toBe(false);
    expect(verifyHmac(payload + 'tampered', sig, secret)).toBe(false);
  });

  it('builds AGS line items and score publishing payloads', () => {
    const lineItem = buildAgsLineItem({
      label: 'Workplace Readiness Simulation',
      scoreMaximum: 100,
      resourceId: 'res-sim-1',
    });
    expect(lineItem.label).toBe('Workplace Readiness Simulation');
    expect(lineItem.scoreMaximum).toBe(100);
    expect(lineItem.tag).toBe('credbridge-outcome');

    const score = buildScorePublishPayload({
      userId: 'learner-101',
      scoreGiven: 94.5,
      scoreMaximum: 100,
      comment: 'Exemplary workplace communication demonstrated',
    });
    expect(score.userId).toBe('learner-101');
    expect(score.scoreGiven).toBe(94.5);
    expect(score.gradingProgress).toBe('FullyGraded');
    expect(score.activityProgress).toBe('Completed');
  });

  it('parses NRps membership rosters with role translation', () => {
    const roster = parseNrpsMembership({
      members: [
        {
          user_id: 'u-1',
          roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator'],
          name: 'Dean Alice',
        },
        {
          user_id: 'u-2',
          roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'],
          name: 'Prof Bob',
        },
        {
          user_id: 'u-3',
          roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
          name: 'Learner Charlie',
        },
      ],
    });

    expect(roster).toHaveLength(3);
    expect(roster[0]?.role).toBe('platform-admin');
    expect(roster[1]?.role).toBe('faculty');
    expect(roster[2]?.role).toBe('learner');
  });

  it('builds valid Deep Linking responses', () => {
    const dl = buildDeepLinkingResponse({
      deploymentId: 'dep-9988',
      data: 'state-session-123',
      contentItems: [
        {
          type: 'ltiResourceLink',
          title: 'CredBridge Venture Validation Badge',
          url: 'https://credbridge.example/lti/venture',
          lineItem: { scoreMaximum: 100 },
        },
      ],
    });

    expect(dl['https://purl.imsglobal.org/spec/lti/claim/message_type']).toBe(
      'LtiDeepLinkingResponse'
    );
    expect(dl['https://purl.imsglobal.org/spec/lti/claim/deployment_id']).toBe('dep-9988');
    expect(dl['https://purl.imsglobal.org/spec/lti-dl/claim/content_items']).toHaveLength(1);
  });

  it('verifies simulation webhooks and parses events', () => {
    const secret = 'sim-secret-key-42';
    const rawPayload = JSON.stringify({
      event: 'milestone.completed',
      tenantId: 'emirates-polytechnic',
      learnerId: 'learner-eap-44',
      achievementId: 'wil-comm',
      score: 98,
      timestamp: new Date().toISOString(),
      evidenceRef: 'sim-run-9901',
    });

    const sig = createHmac('sha256', secret).update(rawPayload).digest('hex');
    expect(verifySimulationWebhook(rawPayload, `sha256=${sig}`, secret)).toBe(true);
    expect(verifySimulationWebhook(rawPayload, sig, secret)).toBe(true);
    expect(verifySimulationWebhook(rawPayload, 'wrong-sig', secret)).toBe(false);

    const parsed = parseSimulationEvent(rawPayload);
    expect(parsed.event).toBe('milestone.completed');
    expect(parsed.tenantId).toBe('emirates-polytechnic');
    expect(parsed.score).toBe(98);
  });
});
