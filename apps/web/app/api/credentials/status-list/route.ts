import { NextResponse } from 'next/server';
import { generateBitstringStatusList } from '@credbridge/standards-credentials';
import { db } from '../../../../lib/store';

export async function GET() {
  const credentials = await db.getCredentials();
  const revokedIndices: number[] = [];

  credentials.forEach((c, idx) => {
    if (c.status === 'revoked') {
      revokedIndices.push(idx);
    }
  });

  const list = generateBitstringStatusList(Math.max(1024, credentials.length + 64), revokedIndices);

  return NextResponse.json(
    {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      id: 'https://credbridge.example/credentials/status-list/1',
      type: ['StatusList2021Credential'],
      issuer: 'did:web:credbridge.example',
      issuanceDate: new Date().toISOString(),
      credentialSubject: list,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
