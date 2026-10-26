import { NextResponse } from 'next/server';
import { verify } from '../../../../../lib/store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const result = await verify(decodedId);

  return NextResponse.json({
    id: decodedId,
    found: result.found,
    status: result.revoked ? 'revoked' : result.found ? 'issued' : 'not_found',
    valid: result.valid,
  });
}
