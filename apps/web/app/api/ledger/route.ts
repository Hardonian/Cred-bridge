import {NextResponse} from 'next/server';import {ledger} from '../../../lib/store';import {requireAuth} from '../../../lib/auth';
export async function GET(request:Request){try{requireAuth(request);return NextResponse.json({pool:ledger.pool,reservations:ledger.all});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unauthorized'},{status:401});}}
