import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const recordId = searchParams.get('recordId') || undefined;
    const recordRef = searchParams.get('recordRef') || undefined;

    if (recordId || recordRef) {
      const events = db.getRecordAuditTrail(recordId || '', recordRef);
      return NextResponse.json({ success: true, data: events });
    }

    const events = db.getAuditEvents(projectId);
    return NextResponse.json({ success: true, data: events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
