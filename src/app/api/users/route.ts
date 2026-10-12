import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET() {
  try {
    const users = db.getUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
