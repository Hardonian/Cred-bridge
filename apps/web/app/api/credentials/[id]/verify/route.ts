import {NextResponse} from 'next/server';import {verify} from '../../../../../lib/store';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const result=verify(decodeURIComponent(id));return NextResponse.json(result,{status:result.found&&result.valid?200:404});}
