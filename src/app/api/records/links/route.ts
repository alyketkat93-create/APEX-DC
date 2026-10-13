import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleId, recordId, action, link, targetInfo, userId, userName } = body;

    if (!moduleId || !recordId) {
      return NextResponse.json(
        { success: false, error: 'moduleId and recordId are required.' },
        { status: 400 }
      );
    }

    if (action === 'linkApexRecord' || targetInfo) {
      const result = db.linkApexRecord(
        moduleId,
        recordId,
        targetInfo,
        userId || 'usr-1',
        userName || 'Document Controller'
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    // Default: Add document link
    const linkData = link || body;
    const result = db.addDocumentLink(
      moduleId,
      recordId,
      linkData,
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
  try {
    const body = await req.json();
    const { moduleId, recordId, linkId, updates, userId, userName } = body;

    if (!moduleId || !recordId || !linkId || !updates) {
      return NextResponse.json(
        { success: false, error: 'moduleId, recordId, linkId, and updates are required.' },
        { status: 400 }
      );
    }

    const result = db.updateDocumentLink(
      moduleId,
      recordId,
      linkId,
      updates,
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

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const moduleId = body.moduleId || searchParams.get('moduleId');
    const recordId = body.recordId || searchParams.get('recordId');
    const linkId = body.linkId || searchParams.get('linkId');
    const linkedApexRecordId = body.linkedApexRecordId || searchParams.get('linkedApexRecordId');
    const userId = body.userId || searchParams.get('userId') || 'usr-1';
    const userName = body.userName || searchParams.get('userName') || 'Document Controller';

    if (!moduleId || !recordId) {
      return NextResponse.json(
        { success: false, error: 'moduleId and recordId are required.' },
        { status: 400 }
      );
    }

    if (linkedApexRecordId) {
      const result = db.unlinkApexRecord(moduleId, recordId, linkedApexRecordId, userId, userName);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (linkId) {
      const result = db.removeDocumentLink(moduleId, recordId, linkId, userId, userName);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json(
      { success: false, error: 'Either linkId or linkedApexRecordId is required.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
