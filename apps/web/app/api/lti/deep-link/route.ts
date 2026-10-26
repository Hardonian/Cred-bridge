import { NextResponse } from 'next/server';
import { buildDeepLinkingResponse } from '@credbridge/standards-lti';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const deploymentId = typeof body.deploymentId === 'string' ? body.deploymentId : 'dep-credbridge';
    const data = typeof body.data === 'string' ? body.data : undefined;

    const response = buildDeepLinkingResponse({
      deploymentId,
      data,
      contentItems: [
        {
          type: 'ltiResourceLink',
          title: 'CredBridge Verified Milestone: Workplace Communication',
          url: 'https://credbridge.example/badges/wil-comm',
          lineItem: { scoreMaximum: 100 },
        },
        {
          type: 'ltiResourceLink',
          title: 'CredBridge Verified Milestone: Customer Discovery',
          url: 'https://credbridge.example/badges/ent-val',
          lineItem: { scoreMaximum: 100 },
        },
      ],
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deep linking error' },
      { status: 400 }
    );
  }
}
