import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({keys:[{kty:'OKP',crv:'Ed25519',kid:'credbridge-reference-1',use:'sig',alg:'EdDSA',x:'synthetic-reference-key-not-for-production'}]});}
