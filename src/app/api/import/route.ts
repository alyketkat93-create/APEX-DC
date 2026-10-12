import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const { module, projectId, rows, dryRun = false } = await req.json();

    if (!module || !projectId || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, error: 'module, projectId, and rows array are required' }, { status: 400 });
    }

    const errors: { row: number; docNumber?: string; message: string }[] = [];
    const validRowsToCommit: any[] = [];

    // Existing documents check for duplicate prevention
    const existingDrawings = db.getDrawings(projectId).map(d => d.drawingNumber);
    const existingSubmittals = db.getSubmittals(projectId).map(s => s.submittalNumber);
    const existingIrs = db.getInspectionRequests(projectId).map(i => i.irNumber);

    rows.forEach((row: any, index: number) => {
      const rowNum = index + 1;

      if (module === 'drawings') {
        const docNum = row.drawingNumber || row['Drawing Number'] || row['Document Number'];
        const title = row.title || row['Drawing Title'] || row['Title'];
        const disc = row.discipline || row['Discipline'] || 'General';

        if (!docNum) {
          errors.push({ row: rowNum, message: 'Missing Drawing Number' });
          return;
        }
        if (!title) {
          errors.push({ row: rowNum, docNumber: docNum, message: 'Missing Drawing Title' });
          return;
        }
        if (existingDrawings.includes(docNum)) {
          errors.push({ row: rowNum, docNumber: docNum, message: `Duplicate Drawing Number '${docNum}' already exists in this project.` });
          return;
        }

        validRowsToCommit.push({
          projectId,
          drawingNumber: docNum,
          title,
          discipline: disc,
          system: row.system || row['System'] || 'General System',
          buildingZone: row.buildingZone || row['Building / Zone'] || 'Zone A',
          floorLevel: row.floorLevel || row['Floor / Level'] || 'Level 1',
          drawingType: row.drawingType || row['Drawing Type'] || 'Shop Drawing',
          originator: row.originator || row['Originator'] || 'Contractor Technical Office',
          currentRevision: row.currentRevision || row['Revision'] || 'P01',
          revisionDate: new Date().toISOString().split('T')[0],
          reviewStatus: 'Draft',
          revisions: [
            {
              id: `rev-imp-${index}`,
              drawingId: '',
              revisionNumber: row.currentRevision || 'P01',
              submissionDate: new Date().toISOString().split('T')[0],
              status: 'Draft',
              createdAt: new Date().toISOString()
            }
          ]
        });
      } else if (module === 'submittals') {
        const subNum = row.submittalNumber || row['Submittal Number'];
        const title = row.title || row['Submittal Title'] || row['Title'];

        if (!subNum) {
          errors.push({ row: rowNum, message: 'Missing Submittal Number' });
          return;
        }
        if (!title) {
          errors.push({ row: rowNum, docNumber: subNum, message: 'Missing Submittal Title' });
          return;
        }
        if (existingSubmittals.includes(subNum)) {
          errors.push({ row: rowNum, docNumber: subNum, message: `Duplicate Submittal Number '${subNum}' already exists.` });
          return;
        }

        validRowsToCommit.push({
          projectId,
          submittalNumber: subNum,
          title,
          type: row.type || 'Material Submittal',
          discipline: row.discipline || 'General',
          system: row.system || 'General',
          specSection: row.specSection || 'Specification Section',
          manufacturer: row.manufacturer || 'Manufacturer',
          supplier: row.supplier || 'Supplier',
          countryOfOrigin: row.countryOfOrigin || 'KSA',
          materialDescription: title,
          complianceStatus: 'Fully Compliant',
          submittedBy: 'Document Controller',
          preparedBy: 'Technical Engineer',
          checkedBy: 'Technical Manager',
          submissionDate: new Date().toISOString().split('T')[0],
          requiredApprovalDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          reviewStatus: 'Draft',
          revisionNumber: '00'
        });
      }
    });

    let committedCount = 0;
    if (!dryRun && validRowsToCommit.length > 0) {
      if (module === 'drawings') {
        validRowsToCommit.forEach(d => {
          db.createDrawing(d, 'usr-1', 'Excel Import Engine');
          committedCount++;
        });
      } else if (module === 'submittals') {
        validRowsToCommit.forEach(s => {
          db.createSubmittal(s, 'usr-1', 'Excel Import Engine');
          committedCount++;
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: rows.length,
        validRowsCount: validRowsToCommit.length,
        rejectedRowsCount: errors.length,
        committedCount,
        errors,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
