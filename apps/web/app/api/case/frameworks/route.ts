import { NextResponse } from 'next/server';
import { exportAllCaseFrameworks } from '@credbridge/standards-case';

export async function GET() {
  const frameworks = exportAllCaseFrameworks();
  return NextResponse.json({
    frameworks,
    standard: 'CASE 1.1',
    supportedLanguages: ['en', 'ar'],
  });
}
