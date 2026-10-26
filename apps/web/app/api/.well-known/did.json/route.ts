import { NextResponse } from 'next/server';
import { exportDidDocument, DEFAULT_KEY_PAIR } from '@credbridge/standards-credentials';

export async function GET() {
  const didDoc = exportDidDocument(DEFAULT_KEY_PAIR.publicKey, 'did:web:credbridge.example', 'key-1');
  return NextResponse.json(didDoc, {
    headers: {
      'content-type': 'application/did+ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
