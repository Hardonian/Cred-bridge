import { NextResponse } from 'next/server';
import { getLerRsForLearner } from '../../../../../lib/store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const lerRs = await getLerRsForLearner(decodedId);
  return NextResponse.json(lerRs);
}
