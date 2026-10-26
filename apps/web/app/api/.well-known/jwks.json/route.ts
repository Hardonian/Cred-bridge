import { NextResponse } from 'next/server';
import { getPublicJwks } from '../../../../lib/store';

export async function GET() {
  const jwks = getPublicJwks();
  return NextResponse.json(jwks, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
