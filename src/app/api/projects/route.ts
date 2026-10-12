import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET() {
  try {
    const projects = db.getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProject = db.createProject(body);
    return NextResponse.json({ success: true, data: newProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
