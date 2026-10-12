import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const { projectId, docType, discipline, zone, customPrefix } = await req.json();
    if (!projectId || !docType) {
      return NextResponse.json({ success: false, error: 'projectId and docType are required' }, { status: 400 });
    }
    const docNumber = db.generateDocumentNumber(projectId, docType, discipline, zone, customPrefix);
    return NextResponse.json({ success: true, docNumber });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
