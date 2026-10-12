import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const modules = db.getCustomModules(projectId);
    return NextResponse.json({ success: true, data: modules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newModule = db.createCustomModule(body);
    return NextResponse.json({ success: true, data: newModule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
