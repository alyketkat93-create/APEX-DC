import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const items = db.getSiteInstructions(projectId);
    return NextResponse.json({ success: true, data: items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = db.createSiteInstruction(body);
    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
