import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');
    const projectId = searchParams.get('projectId') || undefined;
    if (!moduleId) {
      return NextResponse.json({ success: false, error: 'moduleId is required' }, { status: 400 });
    }
    const records = db.getCustomRecords(moduleId, projectId);
    return NextResponse.json({ success: true, data: records });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = db.createCustomRecord(body);
    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
