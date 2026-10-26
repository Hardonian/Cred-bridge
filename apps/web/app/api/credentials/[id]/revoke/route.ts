import { NextResponse } from 'next/server';
import { revoke } from '../../../../../lib/store';
import { requireAuth } from '../../../../../lib/auth';
import { rateLimit } from '../../../../../lib/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!['platform-admin', 'tenant-admin'].includes(auth.role)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }
    if (!rateLimit(`revoke:${auth.actorId}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const reason = typeof body.reason === 'string' ? body.reason : 'Administrative revocation';

    const result = await revoke(decodedId, reason, auth.actorId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Revocation failed' },
      { status: error instanceof Error && error.message === 'Authentication context required' ? 401 : 400 }
    );
  }
}
