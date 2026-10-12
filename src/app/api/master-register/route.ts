import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;

    const drawings = db.getDrawings(projectId).map(d => ({
      id: d.id,
      module: 'Drawings',
      moduleKey: 'drawings',
      docNumber: d.drawingNumber,
      title: d.title,
      discipline: d.discipline,
      type: d.drawingType,
      currentRevision: d.currentRevision,
      status: d.reviewStatus,
      originator: d.originator,
      recipient: d.reviewer || 'Consultant',
      submissionDate: d.submissionDate || d.revisionDate,
      requiredDate: d.requiredResponseDate,
      approvalDate: d.approvalDate,
      projectId: d.projectId,
      fileUrl: d.fileUrl,
      updatedAt: d.updatedAt,
    }));

    const submittals = db.getSubmittals(projectId).map(s => ({
      id: s.id,
      module: 'Technical Submittals',
      moduleKey: 'submittals',
      docNumber: s.submittalNumber,
      title: s.title,
      discipline: s.discipline,
      type: s.type,
      currentRevision: s.revisionNumber,
      status: s.reviewStatus,
      originator: s.submittedBy,
      recipient: 'Consultant',
      submissionDate: s.submissionDate,
      requiredDate: s.requiredApprovalDate,
      approvalDate: s.actualApprovalDate,
      projectId: s.projectId,
      fileUrl: s.fileName ? `/mock/submittals/${s.fileName}` : undefined,
      updatedAt: s.updatedAt,
    }));

    const irs = db.getInspectionRequests(projectId).map(i => ({
      id: i.id,
      module: 'Inspection Requests',
      moduleKey: 'irs',
      docNumber: i.irNumber,
      title: `${i.inspectionType} - ${i.buildingZone}`,
      discipline: i.discipline,
      type: i.inspectionType,
      currentRevision: i.drawingRevision || '00',
      status: i.result,
      originator: i.submittedBy,
      recipient: i.consultantInspector || 'Consultant',
      submissionDate: i.contractorRequestDate,
      requiredDate: i.requestedDateTime.split('T')[0],
      approvalDate: i.closureDate,
      projectId: i.projectId,
      updatedAt: i.updatedAt,
    }));

    const mirs = db.getMaterialInspections(projectId).map(m => ({
      id: m.id,
      module: 'Material Inspections',
      moduleKey: 'mirs',
      docNumber: m.mirNumber,
      title: `${m.materialDescription} (${m.manufacturer})`,
      discipline: 'QA/QC',
      type: 'MIR',
      currentRevision: '00',
      status: m.result,
      originator: m.inspector,
      recipient: m.consultantRep || 'Consultant',
      submissionDate: m.deliveryDate,
      requiredDate: m.inspectionDate,
      approvalDate: m.result === 'Accepted' || m.result === 'Partially Accepted' ? m.inspectionDate : undefined,
      projectId: m.projectId,
      updatedAt: m.updatedAt,
    }));

    const rfis = db.getRfis(projectId).map(r => ({
      id: r.id,
      module: 'RFIs',
      moduleKey: 'rfis',
      docNumber: r.rfiNumber,
      title: r.subject,
      discipline: r.discipline,
      type: 'RFI',
      currentRevision: '00',
      status: r.status,
      originator: r.originator,
      recipient: r.recipient,
      submissionDate: r.dateRaised,
      requiredDate: r.requiredResponseDate,
      approvalDate: r.actualResponseDate,
      projectId: r.projectId,
      updatedAt: r.updatedAt,
    }));

    const cor = db.getCorrespondence(projectId).map(c => ({
      id: c.id,
      module: 'Correspondence',
      moduleKey: 'correspondence',
      docNumber: c.correspondenceNumber,
      title: c.subject,
      discipline: c.discipline,
      type: c.direction,
      currentRevision: '00',
      status: c.status,
      originator: c.sender,
      recipient: c.recipient,
      submissionDate: c.letterDate,
      requiredDate: c.responseDeadline,
      approvalDate: c.receivedDispatchedDate,
      projectId: c.projectId,
      updatedAt: c.updatedAt,
    }));

    const masterList = [...drawings, ...submittals, ...irs, ...mirs, ...rfis, ...cor];
    masterList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ success: true, data: masterList });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
