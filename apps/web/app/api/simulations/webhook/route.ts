import { NextResponse } from 'next/server';
import { verifySimulationWebhook, parseSimulationEvent } from '@credbridge/standards-lti';
import { issue } from '../../../../lib/store';

const WEBHOOK_SECRET = process.env.SIMULATION_WEBHOOK_SECRET || 'simulation-default-secret-2026';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-simulation-signature') || '';
    const rawBody = await request.text();

    if (!verifySimulationWebhook(rawBody, signature, WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = parseSimulationEvent(rawBody);

    if (event.event === 'milestone.completed' || event.event === 'simulation.passed') {
      const credential = await issue({
        tenantId: event.tenantId,
        learnerId: event.learnerId,
        achievementId: event.achievementId,
        milestoneVersion: '1.0',
        name: `Simulation Outcome: ${event.achievementId}`,
        actorId: 'simulation-engine',
      });

      return NextResponse.json({
        success: true,
        event: event.event,
        credentialId: credential.id,
        score: event.score,
      });
    }

    return NextResponse.json({ success: true, event: event.event, ignored: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing error' },
      { status: 400 }
    );
  }
}
