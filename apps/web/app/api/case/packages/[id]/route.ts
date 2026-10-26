import { NextResponse } from 'next/server';
import { exportCasePackage } from '@credbridge/standards-case';
import { competencies } from '@credbridge/contracts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Filter competencies matching requested framework or return complete package
  const matched = competencies.filter(
    (c) =>
      c.id.toLowerCase().includes(decodedId.toLowerCase()) ||
      c.framework.toLowerCase().includes(decodedId.toLowerCase())
  );

  const pkg = exportCasePackage(matched.length > 0 ? matched : competencies);
  return NextResponse.json(pkg, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
