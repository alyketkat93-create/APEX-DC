import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const drawingId = params.id;
    const body = await req.json();
    const updated = db.addDrawingRevision(drawingId, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Drawing not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
