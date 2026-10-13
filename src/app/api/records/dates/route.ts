import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleId, recordId, dateUpdates, reason, userId, userName } = body;

    if (!moduleId || !recordId || !dateUpdates) {
      return NextResponse.json(
        { success: false, error: 'moduleId, recordId, and dateUpdates are required.' },
        { status: 400 }
      );
    }

    const result = db.correctRecordDates(
      moduleId,
      recordId,
      dateUpdates,
      reason,
      userId || 'usr-1',
      userName || 'Document Controller'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
