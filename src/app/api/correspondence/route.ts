import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const items = db.getCorrespondence(projectId);
    return NextResponse.json({ success: true, data: items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = db.createCorrespondence(body);
    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = db.updateCorrespondence(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Correspondence not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
