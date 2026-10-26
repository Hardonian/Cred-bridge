import { NextResponse } from 'next/server';
import { getClrForLearner } from '../../../../../lib/store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const clr = await getClrForLearner(decodedId);
  return NextResponse.json(clr);
}
