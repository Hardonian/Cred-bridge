import { NextResponse } from 'next/server';
import { ledger, getLedgerStats, db } from '../../../lib/store';
import { requireAuth } from '../../../lib/auth';
import { globalAuditLogger } from '@credbridge/privacy-audit';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    const stats = await getLedgerStats();
    const dbEntries = await db.getLedgerEntries(
      auth.role === 'platform-admin' ? undefined : auth.tenantId
    );
    const auditLogs = globalAuditLogger.getEvents({
      tenantId: auth.role === 'platform-admin' ? undefined : auth.tenantId,
      limit: 20,
    });

    return NextResponse.json({
      pool: stats.poolSize,
      totalUsed: stats.totalUsed,
      remaining: stats.remaining,
      utilizationRate: stats.utilizationRate,
      reservations: ledger.all,
      entries: dbEntries,
      auditLogs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
