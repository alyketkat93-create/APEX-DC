// APEX DC — Server Database & Persistence Engine with Transactional Numbering
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Project, Drawing, DrawingRevision, ReviewStatus, TechnicalSubmittal, InspectionRequest, 
  MaterialInspectionRequest, QualityRecord, Correspondence, 
  Rfi, Transmittal, Meeting, SiteInstruction, HandoverItem, 
  Task, CustomModuleDefinition, CustomRecord, User, AuditEvent, NotificationItem,
  DocumentLink, LinkedApexRecord, DateCorrectionLog, DocumentLifecycleDates, ApexRecordType
} from '@/types';
import { 
  initialProjects, initialDrawings, initialSubmittals, 
  initialInspectionRequests, initialMaterialInspections, 
  initialQualityRecords, initialCorrespondence, initialRfis, 
  initialTransmittals, initialMeetings, initialSiteInstructions, 
  initialHandoverItems, initialTasks, initialCustomModules, 
  initialCustomRecords, initialUsers, initialAuditEvents, initialNotifications 
} from '@/data/seedData';

function resolveStorageDir(): string {
  // If running in Vercel or Serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
    const tmpStorage = path.join('/tmp', 'apex-storage');
    try {
      if (!fs.existsSync(tmpStorage)) {
        fs.mkdirSync(tmpStorage, { recursive: true });
      }
      return tmpStorage;
    } catch {
      return '/tmp';
    }
  }

  // Local or container environments
  const defaultDir = path.join(process.cwd(), 'data', 'storage');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(defaultDir, '.write-test');
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    return defaultDir;
  } catch {
    // If process.cwd() is read-only (as on serverless without env set), fallback to /tmp
    const tmpStorage = path.join('/tmp', 'apex-storage');
    try {
      if (!fs.existsSync(tmpStorage)) {
        fs.mkdirSync(tmpStorage, { recursive: true });
      }
      return tmpStorage;
    } catch {
      return '/tmp';
    }
  }
}

const STORAGE_DIR = resolveStorageDir();

function getFilePath(collection: string): string {
  return path.join(STORAGE_DIR, `${collection}.json`);
}

function readCollection<T>(collection: string, initialData: T[]): T[] {
  const filePath = getFilePath(collection);
  // Check primary storage path
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw.trim()) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`Error reading ${filePath}, falling back to initial data:`, err);
    }
  }

  // Check bundled path if STORAGE_DIR is different from process.cwd()/data/storage
  const bundledPath = path.join(process.cwd(), 'data', 'storage', `${collection}.json`);
  if (bundledPath !== filePath && fs.existsSync(bundledPath)) {
    try {
      const raw = fs.readFileSync(bundledPath, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        // Try caching to STORAGE_DIR
        try {
          fs.writeFileSync(filePath, raw, 'utf-8');
        } catch {}
        return parsed;
      }
    } catch {}
  }

  // Fallback to initialData
  try {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch {}
  return initialData;
}

function writeCollection<T>(collection: string, data: T[]): void {
  try {
    const filePath = getFilePath(collection);
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.warn(`Database writeCollection warning (${collection}):`, err);
  }
}

// Global in-memory cache synchronized with disk
class DatabaseEngine {
  private projects: Project[];
  private drawings: Drawing[];
  private submittals: TechnicalSubmittal[];
  private irs: InspectionRequest[];
  private mirs: MaterialInspectionRequest[];
  private quality: QualityRecord[];
  private correspondence: Correspondence[];
  private rfis: Rfi[];
  private transmittals: Transmittal[];
  private meetings: Meeting[];
  private siteInstructions: SiteInstruction[];
  private handover: HandoverItem[];
  private tasks: Task[];
  private customModules: CustomModuleDefinition[];
  private customRecords: CustomRecord[];
  private users: User[];
  private auditEvents: AuditEvent[];
  private notifications: NotificationItem[];

  constructor() {
    this.projects = readCollection<Project>('projects', initialProjects);
    this.drawings = readCollection<Drawing>('drawings', initialDrawings);
    this.submittals = readCollection<TechnicalSubmittal>('submittals', initialSubmittals);
    this.irs = readCollection<InspectionRequest>('irs', initialInspectionRequests);
    this.mirs = readCollection<MaterialInspectionRequest>('mirs', initialMaterialInspections);
    this.quality = readCollection<QualityRecord>('quality', initialQualityRecords);
    this.correspondence = readCollection<Correspondence>('correspondence', initialCorrespondence);
    this.rfis = readCollection<Rfi>('rfis', initialRfis);
    this.transmittals = readCollection<Transmittal>('transmittals', initialTransmittals);
    this.meetings = readCollection<Meeting>('meetings', initialMeetings);
    this.siteInstructions = readCollection<SiteInstruction>('siteInstructions', initialSiteInstructions);
    this.handover = readCollection<HandoverItem>('handover', initialHandoverItems);
    this.tasks = readCollection<Task>('tasks', initialTasks);
    this.customModules = readCollection<CustomModuleDefinition>('customModules', initialCustomModules);
    this.customRecords = readCollection<CustomRecord>('customRecords', initialCustomRecords);
    this.users = readCollection<User>('users', initialUsers);
    this.auditEvents = readCollection<AuditEvent>('auditEvents', initialAuditEvents);
    this.notifications = readCollection<NotificationItem>('notifications', initialNotifications);
  }

  // --- Audit Trail Logging ---
  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    const newEvent: AuditEvent = {
      ...event,
      id: `aud-${uuidv4()}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.unshift(newEvent);
    writeCollection('auditEvents', this.auditEvents);
    return newEvent;
  }

  public getAuditEvents(projectId?: string): AuditEvent[] {
    if (!projectId || projectId === 'ALL') return this.auditEvents;
    return this.auditEvents.filter(a => a.projectId === projectId);
  }

  // --- Document Numbering Engine ---
  public generateDocumentNumber(
    projectId: string, 
    docType: 'DWG' | 'SUB' | 'IR' | 'MIR' | 'NCR' | 'COR' | 'RFI' | 'TR' | 'MOM' | 'SI' | 'HO' | string,
    discipline: string = 'GEN',
    zone?: string,
    customPrefix?: string
  ): string {
    const project = this.projects.find(p => p.id === projectId);
    const prjCode = project ? project.code : 'APX-PRJ';
    
    // Discipline abbreviations
    const discMap: Record<string, string> = {
      'Architectural': 'ARC',
      'Structural': 'STR',
      'MEP-HVAC': 'MEP-HVAC',
      'MEP-Plumbing': 'MEP-PLM',
      'MEP-Firefighting': 'MEP-FF',
      'MEP-Electrical': 'MEP-ELE',
      'MEP-ELV': 'MEP-ELV',
      'Infrastructure': 'INF',
      'Builder Works': 'BWD',
      'QA/QC': 'QAQC',
      'General': 'GEN'
    };
    const discCode = discMap[discipline] || (discipline.length > 5 ? discipline.substring(0, 4).toUpperCase() : discipline);

    // Count existing records of this type in the project to determine sequence
    let count = 1;
    if (docType === 'DWG') {
      count = this.drawings.filter(d => d.projectId === projectId).length + 1;
    } else if (docType === 'SUB') {
      count = this.submittals.filter(s => s.projectId === projectId).length + 1;
    } else if (docType === 'IR') {
      count = this.irs.filter(i => i.projectId === projectId).length + 1;
    } else if (docType === 'MIR') {
      count = this.mirs.filter(m => m.projectId === projectId).length + 1;
    } else if (docType === 'NCR') {
      count = this.quality.filter(q => q.projectId === projectId && q.recordType.includes('NCR')).length + 1;
    } else if (docType === 'COR') {
      count = this.correspondence.filter(c => c.projectId === projectId).length + 1;
    } else if (docType === 'RFI') {
      count = this.rfis.filter(r => r.projectId === projectId).length + 1;
    } else if (docType === 'TR') {
      count = this.transmittals.filter(t => t.projectId === projectId).length + 1;
    } else if (docType === 'MOM') {
      count = this.meetings.filter(m => m.projectId === projectId).length + 1;
    } else if (docType === 'SI') {
      count = this.siteInstructions.filter(s => s.projectId === projectId).length + 1;
    } else if (docType === 'HO') {
      count = this.handover.filter(h => h.projectId === projectId).length + 1;
    } else if (customPrefix) {
      count = this.customRecords.filter(r => r.projectId === projectId && r.recordNumber.includes(customPrefix)).length + 1;
    }

    const seqPadded = String(count).padStart(4, '0');
    const typeCode = customPrefix || docType;
    return `${prjCode}-${discCode}-${typeCode}-${seqPadded}`;
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private calculateDeadline(dateStr?: string, days: number = 14): string | undefined {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return undefined;
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return this.projects;
  }

  public getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  public createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Project {
    const newProject: Project = {
      ...project,
      id: `prj-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(newProject);
    writeCollection('projects', this.projects);

    this.logAudit({
      projectId: newProject.id,
      moduleId: 'projects',
      recordId: newProject.id,
      recordRef: newProject.code,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created project: ${newProject.name} (${newProject.code})`,
      comment: 'Initial project setup'
    });

    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>, userId: string = 'usr-1', userName: string = 'Admin'): Project | null {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    const old = this.projects[index];
    this.projects[index] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('projects', this.projects);

    this.logAudit({
      projectId: id,
      moduleId: 'projects',
      recordId: id,
      recordRef: old.code,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: JSON.stringify(old),
      newValue: JSON.stringify(this.projects[index]),
      comment: 'Project details updated'
    });

    return this.projects[index];
  }

  // --- Drawings ---
  public getDrawings(projectId?: string): Drawing[] {
    if (!projectId || projectId === 'ALL') return this.drawings;
    return this.drawings.filter(d => d.projectId === projectId);
  }

  public getDrawingById(id: string): Drawing | undefined {
    return this.drawings.find(d => d.id === id);
  }

  public createDrawing(drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Drawing {
    const today = this.getToday();
    const project = this.getProjectById(drawing.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const prepDate = drawing.preparationDate || today;
    const revDate = drawing.revisionDate || today;
    const subDate = drawing.submissionDate;
    const reqAppDate = drawing.requiredApprovalDate || (subDate ? this.calculateDeadline(subDate, slaDays) : undefined);

    const initialRevision: DrawingRevision = {
      id: `drw-rev-${uuidv4().substring(0, 8)}`,
      drawingId: '',
      revisionNumber: drawing.currentRevision || 'P01',
      preparationDate: prepDate,
      internalReviewDate: drawing.internalReviewDate,
      submissionDate: subDate || today,
      plannedSubmissionDate: drawing.plannedSubmissionDate,
      consultantReceiptDate: drawing.consultantReceiptDate,
      requiredApprovalDate: reqAppDate,
      consultantResponseDate: drawing.consultantResponseDate,
      approvalDate: drawing.approvalDate,
      revisionDate: revDate,
      closureDate: drawing.closureDate,
      status: drawing.reviewStatus || 'Submitted to Consultant',
      approvalCode: drawing.approvalCode,
      comments: drawing.reviewComments || 'Initial revision created',
      reviewer: drawing.reviewer,
      createdAt: new Date().toISOString(),
    };

    const newDrawing: Drawing = {
      ...drawing,
      id: `drw-${uuidv4().substring(0, 8)}`,
      preparationDate: prepDate,
      revisionDate: revDate,
      submissionDate: subDate,
      requiredApprovalDate: reqAppDate,
      revisions: drawing.revisions && drawing.revisions.length > 0 ? drawing.revisions : [initialRevision],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    newDrawing.revisions[0].drawingId = newDrawing.id;

    this.drawings.unshift(newDrawing);
    writeCollection('drawings', this.drawings);

    this.logAudit({
      projectId: newDrawing.projectId,
      moduleId: 'drawings',
      recordId: newDrawing.id,
      recordRef: newDrawing.drawingNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created drawing: ${newDrawing.drawingNumber} (${newDrawing.title})`,
    });

    return newDrawing;
  }

  public updateDrawing(id: string, updates: Partial<Drawing>, userId: string = 'usr-1', userName: string = 'Admin'): Drawing | null {
    const idx = this.drawings.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const old = this.drawings[idx];
    const today = this.getToday();
    const project = this.getProjectById(old.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const finalUpdates = { ...updates };

    // Submission transition
    if ((updates.reviewStatus === 'Submitted to Consultant' || updates.reviewStatus === 'Under Review' || updates.reviewStatus === 'Pending Consultant Review') &&
        !updates.submissionDate && !old.submissionDate) {
      finalUpdates.submissionDate = today;
    }
    if (finalUpdates.submissionDate && !finalUpdates.requiredApprovalDate && !old.requiredApprovalDate) {
      finalUpdates.requiredApprovalDate = this.calculateDeadline(finalUpdates.submissionDate, slaDays);
    }

    // Consultant Receipt transition
    if (updates.consultantReceiptDate === undefined && updates.reviewStatus === 'Under Review' && !old.consultantReceiptDate) {
      finalUpdates.consultantReceiptDate = today;
    }

    // Approval transition
    const isApproved = updates.approvalCode === 'A' || updates.approvalCode === 'B' || 
                       updates.reviewStatus?.includes('Approved') || updates.reviewStatus === 'Code A - Approved' || updates.reviewStatus === 'Code B - Approved as Noted';
    if (isApproved) {
      if (!updates.approvalDate && !old.approvalDate) finalUpdates.approvalDate = today;
      if (!updates.consultantResponseDate && !old.consultantResponseDate) finalUpdates.consultantResponseDate = today;
    } else if (updates.approvalCode === 'C' || updates.approvalCode === 'D' || updates.reviewStatus?.includes('Rejected') || updates.reviewStatus?.includes('Revise')) {
      if (!updates.consultantResponseDate && !old.consultantResponseDate) finalUpdates.consultantResponseDate = today;
    }

    // Closure transition
    if ((updates.reviewStatus === 'Closed' || updates.reviewStatus === 'As-Built Accepted') && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.drawings[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('drawings', this.drawings);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'drawings',
      recordId: id,
      recordRef: old.drawingNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.reviewStatus}, Rev: ${old.currentRevision}`,
      newValue: `Status: ${this.drawings[idx].reviewStatus}, Rev: ${this.drawings[idx].currentRevision}`,
      comment: updates.reviewComments || 'Drawing record updated'
    });

    return this.drawings[idx];
  }

  public addDrawingRevision(
    id: string, 
    revisionData: { 
      revisionNumber: string; 
      status: any; 
      approvalCode?: any; 
      comments?: string; 
      reviewer?: string; 
      fileName?: string; 
      fileUrl?: string; 
      transmittalNumber?: string;
      preparationDate?: string;
      internalReviewDate?: string;
      submissionDate?: string;
      plannedSubmissionDate?: string;
      consultantReceiptDate?: string;
      requiredApprovalDate?: string;
      consultantResponseDate?: string;
      approvalDate?: string;
      revisionDate?: string;
      closureDate?: string;
    }, 
    userId: string = 'usr-1', 
    userName: string = 'Admin'
  ): Drawing | null {
    const idx = this.drawings.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const drawing = this.drawings[idx];
    const today = this.getToday();
    const project = this.getProjectById(drawing.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const revDate = revisionData.revisionDate || today;
    const subDate = revisionData.submissionDate || today;
    const reqAppDate = revisionData.requiredApprovalDate || this.calculateDeadline(subDate, slaDays);
    const isApproved = revisionData.approvalCode === 'A' || revisionData.approvalCode === 'B' || 
                       revisionData.status === 'Code A - Approved' || revisionData.status === 'Code B - Approved as Noted';
    const appDate = isApproved ? (revisionData.approvalDate || today) : revisionData.approvalDate;
    const respDate = isApproved || revisionData.approvalCode ? (revisionData.consultantResponseDate || today) : revisionData.consultantResponseDate;

    const newRev: DrawingRevision = {
      id: `drw-rev-${uuidv4().substring(0, 8)}`,
      drawingId: id,
      revisionNumber: revisionData.revisionNumber,
      preparationDate: revisionData.preparationDate || drawing.preparationDate || today,
      internalReviewDate: revisionData.internalReviewDate,
      submissionDate: subDate,
      plannedSubmissionDate: revisionData.plannedSubmissionDate || drawing.plannedSubmissionDate,
      consultantReceiptDate: revisionData.consultantReceiptDate,
      requiredApprovalDate: reqAppDate,
      consultantResponseDate: respDate,
      approvalDate: appDate,
      revisionDate: revDate,
      closureDate: revisionData.closureDate,
      status: revisionData.status,
      approvalCode: revisionData.approvalCode,
      comments: revisionData.comments,
      reviewer: revisionData.reviewer,
      fileName: revisionData.fileName,
      fileUrl: revisionData.fileUrl,
      transmittalNumber: revisionData.transmittalNumber,
      createdAt: new Date().toISOString(),
    };

    const revisions = [...drawing.revisions, newRev];
    this.drawings[idx] = {
      ...drawing,
      currentRevision: revisionData.revisionNumber,
      revisionDate: revDate,
      submissionDate: subDate,
      requiredApprovalDate: reqAppDate,
      consultantResponseDate: respDate,
      approvalDate: appDate,
      reviewStatus: revisionData.status,
      approvalCode: revisionData.approvalCode,
      reviewComments: revisionData.comments,
      reviewer: revisionData.reviewer || drawing.reviewer,
      relatedTransmittal: revisionData.transmittalNumber || drawing.relatedTransmittal,
      revisions,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('drawings', this.drawings);

    this.logAudit({
      projectId: drawing.projectId,
      moduleId: 'drawings',
      recordId: id,
      recordRef: drawing.drawingNumber,
      action: 'REVISE',
      userId,
      userName,
      previousValue: `Rev: ${drawing.currentRevision}`,
      newValue: `Rev: ${revisionData.revisionNumber} (Status: ${revisionData.status})`,
      comment: `New revision ${revisionData.revisionNumber} uploaded`
    });

    return this.drawings[idx];
  }

  // --- Technical Submittals ---
  public getSubmittals(projectId?: string): TechnicalSubmittal[] {
    if (!projectId || projectId === 'ALL') return this.submittals;
    return this.submittals.filter(s => s.projectId === projectId);
  }

  public getSubmittalById(id: string): TechnicalSubmittal | undefined {
    return this.submittals.find(s => s.id === id);
  }

  public createSubmittal(submittal: Omit<TechnicalSubmittal, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): TechnicalSubmittal {
    const today = this.getToday();
    const project = this.getProjectById(submittal.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const prepDate = submittal.preparationDate || today;
    const subDate = submittal.submissionDate;
    const reqAppDate = submittal.requiredApprovalDate || (subDate ? this.calculateDeadline(subDate, slaDays) : undefined);

    const newSub: TechnicalSubmittal = {
      ...submittal,
      id: `sub-${uuidv4().substring(0, 8)}`,
      preparationDate: prepDate,
      submissionDate: subDate,
      requiredApprovalDate: reqAppDate,
      revisionDate: submittal.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.submittals.unshift(newSub);
    writeCollection('submittals', this.submittals);

    this.logAudit({
      projectId: newSub.projectId,
      moduleId: 'submittals',
      recordId: newSub.id,
      recordRef: newSub.submittalNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created submittal: ${newSub.submittalNumber} (${newSub.title})`,
    });

    return newSub;
  }

  public updateSubmittal(id: string, updates: Partial<TechnicalSubmittal>, userId: string = 'usr-1', userName: string = 'Admin'): TechnicalSubmittal | null {
    const idx = this.submittals.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const old = this.submittals[idx];
    const today = this.getToday();
    const project = this.getProjectById(old.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const finalUpdates = { ...updates };

    if ((updates.reviewStatus === 'Submitted to Consultant' || updates.reviewStatus === 'Under Review' || updates.reviewStatus === 'Pending Consultant Review') && !updates.submissionDate && !old.submissionDate) {
      finalUpdates.submissionDate = today;
    }
    if (finalUpdates.submissionDate && !finalUpdates.requiredApprovalDate && !old.requiredApprovalDate) {
      finalUpdates.requiredApprovalDate = this.calculateDeadline(finalUpdates.submissionDate, slaDays);
    }

    const isApproved = updates.approvalCode === 'A' || updates.approvalCode === 'B' || updates.reviewStatus?.includes('Approved');
    if (isApproved) {
      if (!updates.approvalDate && !old.approvalDate) finalUpdates.approvalDate = today;
      if (!updates.consultantResponseDate && !old.consultantResponseDate) finalUpdates.consultantResponseDate = today;
    } else if (updates.approvalCode === 'C' || updates.approvalCode === 'D' || updates.reviewStatus?.includes('Rejected') || updates.reviewStatus?.includes('Revise')) {
      if (!updates.consultantResponseDate && !old.consultantResponseDate) finalUpdates.consultantResponseDate = today;
    }

    if (updates.reviewStatus === 'Closed' && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.submittals[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('submittals', this.submittals);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'submittals',
      recordId: id,
      recordRef: old.submittalNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.reviewStatus}`,
      newValue: `Status: ${this.submittals[idx].reviewStatus}`,
      comment: updates.consultantComments || 'Submittal updated'
    });

    return this.submittals[idx];
  }

  // --- Inspection Requests (IR / WIR) ---
  public getInspectionRequests(projectId?: string): InspectionRequest[] {
    if (!projectId || projectId === 'ALL') return this.irs;
    return this.irs.filter(i => i.projectId === projectId);
  }

  public getInspectionRequestById(id: string): InspectionRequest | undefined {
    return this.irs.find(i => i.id === id);
  }

  public createInspectionRequest(ir: Omit<InspectionRequest, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): InspectionRequest {
    const today = this.getToday();
    const project = this.getProjectById(ir.projectId);
    const slaDays = project?.reviewDurationDays || 7;
    const subDate = ir.submissionDate || ir.contractorRequestDate || today;

    const newIr: InspectionRequest = {
      ...ir,
      id: `ir-${uuidv4().substring(0, 8)}`,
      preparationDate: ir.preparationDate || today,
      submissionDate: subDate,
      requiredApprovalDate: ir.requiredApprovalDate || this.calculateDeadline(subDate, slaDays),
      revisionDate: ir.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.irs.unshift(newIr);
    writeCollection('irs', this.irs);

    this.logAudit({
      projectId: newIr.projectId,
      moduleId: 'irs',
      recordId: newIr.id,
      recordRef: newIr.irNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created IR: ${newIr.irNumber} (${newIr.workDescription})`,
    });

    return newIr;
  }

  public updateInspectionRequest(id: string, updates: Partial<InspectionRequest>, userId: string = 'usr-1', userName: string = 'Admin'): InspectionRequest | null {
    const idx = this.irs.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const old = this.irs[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.result === 'Accepted' || updates.result === 'Accepted with Comments') && !updates.approvalDate && !old.approvalDate) {
      finalUpdates.approvalDate = today;
      finalUpdates.consultantResponseDate = today;
    } else if (updates.result === 'Rejected' && !updates.consultantResponseDate && !old.consultantResponseDate) {
      finalUpdates.consultantResponseDate = today;
    }
    if (updates.result === 'Closed' && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.irs[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('irs', this.irs);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'irs',
      recordId: id,
      recordRef: old.irNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Result: ${old.result}`,
      newValue: `Result: ${this.irs[idx].result}`,
      comment: updates.consultantComments || 'Inspection request updated'
    });

    return this.irs[idx];
  }

  // --- Material Inspection Requests (MIR) ---
  public getMaterialInspections(projectId?: string): MaterialInspectionRequest[] {
    if (!projectId || projectId === 'ALL') return this.mirs;
    return this.mirs.filter(m => m.projectId === projectId);
  }

  public getMaterialInspectionById(id: string): MaterialInspectionRequest | undefined {
    return this.mirs.find(m => m.id === id);
  }

  public createMaterialInspection(mir: Omit<MaterialInspectionRequest, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): MaterialInspectionRequest {
    const today = this.getToday();
    const project = this.getProjectById(mir.projectId);
    const slaDays = project?.reviewDurationDays || 7;
    const subDate = mir.submissionDate || mir.deliveryDate || today;

    const newMir: MaterialInspectionRequest = {
      ...mir,
      id: `mir-${uuidv4().substring(0, 8)}`,
      preparationDate: mir.preparationDate || today,
      submissionDate: subDate,
      requiredApprovalDate: mir.requiredApprovalDate || this.calculateDeadline(subDate, slaDays),
      revisionDate: mir.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.mirs.unshift(newMir);
    writeCollection('mirs', this.mirs);

    this.logAudit({
      projectId: newMir.projectId,
      moduleId: 'mirs',
      recordId: newMir.id,
      recordRef: newMir.mirNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created MIR: ${newMir.mirNumber} (${newMir.materialDescription})`,
    });

    return newMir;
  }

  public updateMaterialInspection(id: string, updates: Partial<MaterialInspectionRequest>, userId: string = 'usr-1', userName: string = 'Admin'): MaterialInspectionRequest | null {
    const idx = this.mirs.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const old = this.mirs[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.result === 'Accepted' || updates.result === 'Partially Accepted') && !updates.approvalDate && !old.approvalDate) {
      finalUpdates.approvalDate = today;
      finalUpdates.consultantResponseDate = today;
    } else if (updates.result === 'Rejected' && !updates.consultantResponseDate && !old.consultantResponseDate) {
      finalUpdates.consultantResponseDate = today;
    }
    if (updates.result === 'Closed' && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.mirs[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('mirs', this.mirs);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'mirs',
      recordId: id,
      recordRef: old.mirNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Result: ${old.result}, Accepted: ${old.quantityAccepted}, Rejected: ${old.quantityRejected}`,
      newValue: `Result: ${this.mirs[idx].result}, Accepted: ${this.mirs[idx].quantityAccepted}, Rejected: ${this.mirs[idx].quantityRejected}`,
      comment: updates.remarks || 'MIR inspection result updated'
    });

    return this.mirs[idx];
  }

  // --- Quality Records (NCR / CAR / ITP) ---
  public getQualityRecords(projectId?: string): QualityRecord[] {
    if (!projectId || projectId === 'ALL') return this.quality;
    return this.quality.filter(q => q.projectId === projectId);
  }

  public getQualityRecordById(id: string): QualityRecord | undefined {
    return this.quality.find(q => q.id === id);
  }

  public createQualityRecord(record: Omit<QualityRecord, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): QualityRecord {
    const today = this.getToday();
    const subDate = record.submissionDate || record.issueDate || today;

    const newRec: QualityRecord = {
      ...record,
      id: `rec-${uuidv4().substring(0, 8)}`,
      preparationDate: record.preparationDate || today,
      submissionDate: subDate,
      revisionDate: record.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quality.unshift(newRec);
    writeCollection('quality', this.quality);

    this.logAudit({
      projectId: newRec.projectId,
      moduleId: 'quality',
      recordId: newRec.id,
      recordRef: newRec.recordNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created ${newRec.recordType}: ${newRec.recordNumber}`,
    });

    return newRec;
  }

  public updateQualityRecord(id: string, updates: Partial<QualityRecord>, userId: string = 'usr-1', userName: string = 'Admin'): QualityRecord | null {
    const idx = this.quality.findIndex(q => q.id === id);
    if (idx === -1) return null;
    const old = this.quality[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.status === 'Closed' || updates.status === 'Accepted') && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.quality[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('quality', this.quality);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'quality',
      recordId: id,
      recordRef: old.recordNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.status}`,
      newValue: `Status: ${this.quality[idx].status}`,
      comment: updates.correctiveAction || 'Quality record updated'
    });

    return this.quality[idx];
  }

  // --- Correspondence ---
  public getCorrespondence(projectId?: string): Correspondence[] {
    if (!projectId || projectId === 'ALL') return this.correspondence;
    return this.correspondence.filter(c => c.projectId === projectId);
  }

  public getCorrespondenceById(id: string): Correspondence | undefined {
    return this.correspondence.find(c => c.id === id);
  }

  public createCorrespondence(cor: Omit<Correspondence, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Correspondence {
    const today = this.getToday();
    const subDate = cor.submissionDate || cor.letterDate || today;

    const newCor: Correspondence = {
      ...cor,
      id: `cor-${uuidv4().substring(0, 8)}`,
      preparationDate: cor.preparationDate || today,
      submissionDate: subDate,
      revisionDate: cor.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.correspondence.unshift(newCor);
    writeCollection('correspondence', this.correspondence);

    this.logAudit({
      projectId: newCor.projectId,
      moduleId: 'correspondence',
      recordId: newCor.id,
      recordRef: newCor.correspondenceNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Correspondence: ${newCor.correspondenceNumber} (${newCor.subject})`,
    });

    return newCor;
  }

  public updateCorrespondence(id: string, updates: Partial<Correspondence>, userId: string = 'usr-1', userName: string = 'Admin'): Correspondence | null {
    const idx = this.correspondence.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const old = this.correspondence[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.status === 'Responded' || updates.status === 'Closed') && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
      if (!updates.consultantResponseDate && !old.consultantResponseDate) {
        finalUpdates.consultantResponseDate = today;
      }
    }

    this.correspondence[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('correspondence', this.correspondence);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'correspondence',
      recordId: id,
      recordRef: old.correspondenceNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.status}`,
      newValue: `Status: ${this.correspondence[idx].status}`,
    });

    return this.correspondence[idx];
  }

  // --- RFIs ---
  public getRfis(projectId?: string): Rfi[] {
    if (!projectId || projectId === 'ALL') return this.rfis;
    return this.rfis.filter(r => r.projectId === projectId);
  }

  public getRfiById(id: string): Rfi | undefined {
    return this.rfis.find(r => r.id === id);
  }

  public createRfi(rfi: Omit<Rfi, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Rfi {
    const today = this.getToday();
    const project = this.getProjectById(rfi.projectId);
    const slaDays = project?.reviewDurationDays || 7;
    const subDate = rfi.submissionDate || rfi.dateRaised || today;

    const newRfi: Rfi = {
      ...rfi,
      id: `rfi-${uuidv4().substring(0, 8)}`,
      preparationDate: rfi.preparationDate || today,
      submissionDate: subDate,
      requiredApprovalDate: rfi.requiredApprovalDate || rfi.requiredResponseDate || this.calculateDeadline(subDate, slaDays),
      revisionDate: rfi.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rfis.unshift(newRfi);
    writeCollection('rfis', this.rfis);

    this.logAudit({
      projectId: newRfi.projectId,
      moduleId: 'rfis',
      recordId: newRfi.id,
      recordRef: newRfi.rfiNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created RFI: ${newRfi.rfiNumber} (${newRfi.subject})`,
    });

    return newRfi;
  }

  public updateRfi(id: string, updates: Partial<Rfi>, userId: string = 'usr-1', userName: string = 'Admin'): Rfi | null {
    const idx = this.rfis.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const old = this.rfis[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.status === 'Answered' || updates.consultantResponse) && !updates.consultantResponseDate && !old.consultantResponseDate) {
      finalUpdates.consultantResponseDate = today;
    }
    if (updates.status === 'Closed' && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.rfis[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('rfis', this.rfis);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'rfis',
      recordId: id,
      recordRef: old.rfiNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.status}`,
      newValue: `Status: ${this.rfis[idx].status}`,
      comment: updates.consultantResponse || 'RFI response updated'
    });

    return this.rfis[idx];
  }

  // --- Transmittals ---
  public getTransmittals(projectId?: string): Transmittal[] {
    if (!projectId || projectId === 'ALL') return this.transmittals;
    return this.transmittals.filter(t => t.projectId === projectId);
  }

  public getTransmittalById(id: string): Transmittal | undefined {
    return this.transmittals.find(t => t.id === id);
  }

  public createTransmittal(transmittal: Omit<Transmittal, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Transmittal {
    const today = this.getToday();
    const project = this.getProjectById(transmittal.projectId);
    const slaDays = project?.reviewDurationDays || 14;

    const subDate = transmittal.submissionDate || transmittal.transmittalDate || today;
    const reqAppDate = transmittal.requiredApprovalDate || this.calculateDeadline(subDate, slaDays);

    const newTr: Transmittal = {
      ...transmittal,
      id: `trn-${uuidv4().substring(0, 8)}`,
      preparationDate: transmittal.preparationDate || today,
      submissionDate: subDate,
      requiredApprovalDate: reqAppDate,
      revisionDate: transmittal.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transmittals.unshift(newTr);
    writeCollection('transmittals', this.transmittals);

    // Link relevant drawings & revisions from transmittal.documentList
    // MANDATORY RULE: Sending a document NEVER automatically marks it as approved.
    if (newTr.documentList && Array.isArray(newTr.documentList)) {
      let drawingsModified = false;
      for (const docItem of newTr.documentList) {
        if (!docItem.docNumber) continue;
        const dIdx = this.drawings.findIndex(d => 
          d.projectId === newTr.projectId && 
          (d.drawingNumber === docItem.docNumber || docItem.docNumber.startsWith(d.drawingNumber))
        );
        if (dIdx !== -1) {
          const drw = this.drawings[dIdx];
          // Preserve approved status if already approved, otherwise set to Pending Consultant Review
          const targetStatus = (drw.reviewStatus?.includes('Approved') || drw.approvalCode === 'A' || drw.approvalCode === 'B')
            ? drw.reviewStatus
            : 'Pending Consultant Review';

          const updatedRevisions = (drw.revisions || []).map(r => {
            if (r.revisionNumber === docItem.revision || !docItem.revision) {
              return {
                ...r,
                transmittalId: newTr.id,
                transmittalNumber: newTr.transmittalNumber,
                submissionDate: subDate,
                requiredApprovalDate: reqAppDate,
                // NEVER mark approved on transmittal send!
                status: (r.status?.includes('Approved') || r.approvalCode === 'A' || r.approvalCode === 'B') 
                  ? r.status 
                  : 'Pending Consultant Review',
              };
            }
            return r;
          });

          this.drawings[dIdx] = {
            ...drw,
            submissionDate: subDate,
            requiredApprovalDate: reqAppDate,
            relatedTransmittal: newTr.transmittalNumber,
            relatedTransmittalId: newTr.transmittalNumber,
            reviewStatus: targetStatus as ReviewStatus,
            revisions: updatedRevisions,
            updatedAt: new Date().toISOString(),
          };
          drawingsModified = true;
        }
      }
      if (drawingsModified) {
        writeCollection('drawings', this.drawings);
      }
    }

    this.logAudit({
      projectId: newTr.projectId,
      moduleId: 'transmittals',
      recordId: newTr.id,
      recordRef: newTr.transmittalNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Transmittal: ${newTr.transmittalNumber} (${newTr.documentList?.length || 0} documents) - Status: ${newTr.status}`,
    });

    return newTr;
  }

  public updateTransmittal(id: string, updates: Partial<Transmittal>, userId: string = 'usr-1', userName: string = 'Admin'): Transmittal | null {
    const idx = this.transmittals.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = this.transmittals[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    // If consultant receipt acknowledged
    if ((updates.receiptAcknowledged || updates.status === 'Received by Consultant') && !updates.consultantReceiptDate && !old.consultantReceiptDate) {
      finalUpdates.consultantReceiptDate = today;
    }
    // If consultant responded
    if ((updates.status === 'Under Review' || updates.status === 'Reviewed') && !updates.consultantResponseDate && !old.consultantResponseDate) {
      finalUpdates.consultantResponseDate = today;
    }

    this.transmittals[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('transmittals', this.transmittals);

    // Sync receipt date to linked drawings if consultant acknowledged receipt
    if (finalUpdates.consultantReceiptDate && !old.consultantReceiptDate && old.documentList) {
      let drawingsModified = false;
      for (const docItem of old.documentList) {
        const dIdx = this.drawings.findIndex(d => 
          d.projectId === old.projectId && (d.drawingNumber === docItem.docNumber || docItem.docNumber.startsWith(d.drawingNumber))
        );
        if (dIdx !== -1) {
          this.drawings[dIdx] = {
            ...this.drawings[dIdx],
            consultantReceiptDate: finalUpdates.consultantReceiptDate,
            updatedAt: new Date().toISOString(),
          };
          drawingsModified = true;
        }
      }
      if (drawingsModified) writeCollection('drawings', this.drawings);
    }

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'transmittals',
      recordId: id,
      recordRef: old.transmittalNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.status}`,
      newValue: `Status: ${this.transmittals[idx].status}`,
    });

    return this.transmittals[idx];
  }

  // --- Meetings ---
  public getMeetings(projectId?: string): Meeting[] {
    if (!projectId || projectId === 'ALL') return this.meetings;
    return this.meetings.filter(m => m.projectId === projectId);
  }

  public getMeetingById(id: string): Meeting | undefined {
    return this.meetings.find(m => m.id === id);
  }

  public createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Meeting {
    const newMtg: Meeting = {
      ...meeting,
      id: `mtg-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetings.unshift(newMtg);
    writeCollection('meetings', this.meetings);

    this.logAudit({
      projectId: newMtg.projectId,
      moduleId: 'meetings',
      recordId: newMtg.id,
      recordRef: newMtg.meetingNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created MOM: ${newMtg.meetingNumber} (${newMtg.title})`,
    });

    return newMtg;
  }

  public updateMeeting(id: string, updates: Partial<Meeting>, userId: string = 'usr-1', userName: string = 'Admin'): Meeting | null {
    const idx = this.meetings.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const old = this.meetings[idx];
    this.meetings[idx] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('meetings', this.meetings);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'meetings',
      recordId: id,
      recordRef: old.meetingNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.status}`,
      newValue: `Status: ${this.meetings[idx].status}`,
    });

    return this.meetings[idx];
  }

  // --- Site Instructions & Variations ---
  public getSiteInstructions(projectId?: string): SiteInstruction[] {
    if (!projectId || projectId === 'ALL') return this.siteInstructions;
    return this.siteInstructions.filter(s => s.projectId === projectId);
  }

  public createSiteInstruction(si: Omit<SiteInstruction, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): SiteInstruction {
    const newSi: SiteInstruction = {
      ...si,
      id: `si-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.siteInstructions.unshift(newSi);
    writeCollection('siteInstructions', this.siteInstructions);

    this.logAudit({
      projectId: newSi.projectId,
      moduleId: 'variations',
      recordId: newSi.id,
      recordRef: newSi.instructionNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created ${newSi.instructionType}: ${newSi.instructionNumber}`,
    });

    return newSi;
  }

  // --- Handover & As-Built ---
  public getHandoverItems(projectId?: string): HandoverItem[] {
    if (!projectId || projectId === 'ALL') return this.handover;
    return this.handover.filter(h => h.projectId === projectId);
  }

  public createHandoverItem(item: Omit<HandoverItem, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): HandoverItem {
    const today = this.getToday();
    const newItem: HandoverItem = {
      ...item,
      id: `ho-${uuidv4().substring(0, 8)}`,
      preparationDate: item.preparationDate || today,
      submissionDate: item.submissionDate || today,
      revisionDate: item.revisionDate || today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.handover.unshift(newItem);
    writeCollection('handover', this.handover);

    this.logAudit({
      projectId: newItem.projectId,
      moduleId: 'handover',
      recordId: newItem.id,
      recordRef: newItem.itemNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Handover item: ${newItem.itemNumber} (${newItem.title})`,
    });

    return newItem;
  }

  public updateHandoverItem(id: string, updates: Partial<HandoverItem>, userId: string = 'usr-1', userName: string = 'Admin'): HandoverItem | null {
    const idx = this.handover.findIndex(h => h.id === id);
    if (idx === -1) return null;
    const old = this.handover[idx];
    const today = this.getToday();

    const finalUpdates = { ...updates };
    if ((updates.approvalStatus === 'Approved' || updates.approvalStatus === 'Handed Over' || updates.consultantReviewStatus === 'Approved') && !updates.approvalDate && !old.approvalDate) {
      finalUpdates.approvalDate = today;
      finalUpdates.consultantResponseDate = today;
    }
    if ((updates.approvalStatus === 'Handed Over' || updates.completionPercent === 100) && !updates.closureDate && !old.closureDate) {
      finalUpdates.closureDate = today;
    }

    this.handover[idx] = {
      ...old,
      ...finalUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('handover', this.handover);

    this.logAudit({
      projectId: old.projectId,
      moduleId: 'handover',
      recordId: id,
      recordRef: old.itemNumber,
      action: 'UPDATE',
      userId,
      userName,
      previousValue: `Status: ${old.approvalStatus} (${old.completionPercent}%)`,
      newValue: `Status: ${this.handover[idx].approvalStatus} (${this.handover[idx].completionPercent}%)`,
    });

    return this.handover[idx];
  }

  // --- Tasks ---
  public getTasks(projectId?: string): Task[] {
    if (!projectId || projectId === 'ALL') return this.tasks;
    return this.tasks.filter(t => t.projectId === projectId);
  }

  public createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): Task {
    const newTask: Task = {
      ...task,
      id: `tsk-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    writeCollection('tasks', this.tasks);

    this.logAudit({
      projectId: newTask.projectId,
      moduleId: 'tasks',
      recordId: newTask.id,
      recordRef: newTask.taskNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Task: ${newTask.taskNumber} (${newTask.title})`,
    });

    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>, userId: string = 'usr-1', userName: string = 'Admin'): Task | null {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = this.tasks[idx];
    this.tasks[idx] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('tasks', this.tasks);
    return this.tasks[idx];
  }

  // --- Custom Module Builder & Records ---
  public getCustomModules(projectId?: string): CustomModuleDefinition[] {
    return this.customModules.filter(m => m.active);
  }

  public getCustomModuleById(idOrKey: string): CustomModuleDefinition | undefined {
    return this.customModules.find(m => m.id === idOrKey || m.key === idOrKey);
  }

  public createCustomModule(mod: Omit<CustomModuleDefinition, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): CustomModuleDefinition {
    const newMod: CustomModuleDefinition = {
      ...mod,
      id: `mod-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customModules.push(newMod);
    writeCollection('customModules', this.customModules);

    this.logAudit({
      moduleId: 'customModules',
      recordId: newMod.id,
      recordRef: newMod.key,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Custom Module: ${newMod.name} (${newMod.nameAr}) with ${newMod.fields.length} fields`,
    });

    return newMod;
  }

  public getCustomRecords(moduleId: string, projectId?: string): CustomRecord[] {
    return this.customRecords.filter(r => {
      const matchMod = r.moduleId === moduleId;
      const matchPrj = !projectId || projectId === 'ALL' || r.projectId === projectId;
      return matchMod && matchPrj;
    });
  }

  public createCustomRecord(rec: Omit<CustomRecord, 'id' | 'createdAt' | 'updatedAt'>, userId: string = 'usr-1', userName: string = 'Admin'): CustomRecord {
    const newRec: CustomRecord = {
      ...rec,
      id: `crec-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customRecords.unshift(newRec);
    writeCollection('customRecords', this.customRecords);

    this.logAudit({
      projectId: newRec.projectId,
      moduleId: newRec.moduleId,
      recordId: newRec.id,
      recordRef: newRec.recordNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created custom record ${newRec.recordNumber}`,
    });

    return newRec;
  }

  // --- Notifications ---
  public getNotifications(projectId?: string): NotificationItem[] {
    if (!projectId || projectId === 'ALL') return this.notifications;
    return this.notifications.filter(n => n.projectId === projectId);
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      writeCollection('notifications', this.notifications);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.users;
  }

  // --- Universal Record Lookup & Date / Link Engine ---
  public getRecordByModuleAndId(moduleId: string, id: string): { record: any; collectionName: string; ref: string; projectId?: string } | null {
    switch (moduleId) {
      case 'drawings': {
        const r = this.drawings.find(x => x.id === id || x.drawingNumber === id);
        return r ? { record: r, collectionName: 'drawings', ref: r.drawingNumber, projectId: r.projectId } : null;
      }
      case 'submittals': {
        const r = this.submittals.find(x => x.id === id || x.submittalNumber === id);
        return r ? { record: r, collectionName: 'submittals', ref: r.submittalNumber, projectId: r.projectId } : null;
      }
      case 'irs': {
        const r = this.irs.find(x => x.id === id || x.irNumber === id);
        return r ? { record: r, collectionName: 'irs', ref: r.irNumber, projectId: r.projectId } : null;
      }
      case 'mirs': {
        const r = this.mirs.find(x => x.id === id || x.mirNumber === id);
        return r ? { record: r, collectionName: 'mirs', ref: r.mirNumber, projectId: r.projectId } : null;
      }
      case 'correspondence': {
        const r = this.correspondence.find(x => x.id === id || x.correspondenceNumber === id);
        return r ? { record: r, collectionName: 'correspondence', ref: r.correspondenceNumber, projectId: r.projectId } : null;
      }
      case 'rfis': {
        const r = this.rfis.find(x => x.id === id || x.rfiNumber === id);
        return r ? { record: r, collectionName: 'rfis', ref: r.rfiNumber, projectId: r.projectId } : null;
      }
      case 'quality': {
        const r = this.quality.find(x => x.id === id || x.recordNumber === id);
        return r ? { record: r, collectionName: 'quality', ref: r.recordNumber, projectId: r.projectId } : null;
      }
      case 'transmittals': {
        const r = this.transmittals.find(x => x.id === id || x.transmittalNumber === id);
        return r ? { record: r, collectionName: 'transmittals', ref: r.transmittalNumber, projectId: r.projectId } : null;
      }
      case 'handover': {
        const r = this.handover.find(x => x.id === id || x.itemNumber === id);
        return r ? { record: r, collectionName: 'handover', ref: r.itemNumber, projectId: r.projectId } : null;
      }
      case 'siteInstructions':
      case 'variations': {
        const r = this.siteInstructions.find(x => x.id === id || x.instructionNumber === id);
        return r ? { record: r, collectionName: 'siteInstructions', ref: r.instructionNumber, projectId: r.projectId } : null;
      }
      case 'meetings': {
        const r = this.meetings.find(x => x.id === id || x.meetingNumber === id);
        return r ? { record: r, collectionName: 'meetings', ref: r.meetingNumber, projectId: r.projectId } : null;
      }
      default: {
        const r = this.customRecords.find(x => x.id === id || x.recordNumber === id);
        return r ? { record: r, collectionName: 'customRecords', ref: r.recordNumber, projectId: r.projectId } : null;
      }
    }
  }

  public saveRecordByModule(collectionName: string) {
    switch (collectionName) {
      case 'drawings': writeCollection('drawings', this.drawings); break;
      case 'submittals': writeCollection('submittals', this.submittals); break;
      case 'irs': writeCollection('irs', this.irs); break;
      case 'mirs': writeCollection('mirs', this.mirs); break;
      case 'correspondence': writeCollection('correspondence', this.correspondence); break;
      case 'rfis': writeCollection('rfis', this.rfis); break;
      case 'quality': writeCollection('quality', this.quality); break;
      case 'transmittals': writeCollection('transmittals', this.transmittals); break;
      case 'handover': writeCollection('handover', this.handover); break;
      case 'siteInstructions': writeCollection('siteInstructions', this.siteInstructions); break;
      case 'meetings': writeCollection('meetings', this.meetings); break;
      case 'customRecords': writeCollection('customRecords', this.customRecords); break;
    }
  }

  public correctRecordDates(
    moduleId: string,
    recordId: string,
    dateUpdates: Record<string, string | undefined>,
    reason: string,
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const target = this.getRecordByModuleAndId(moduleId, recordId);
    if (!target) return { success: false, error: `Record not found in module ${moduleId}` };

    const { record, collectionName, ref, projectId } = target;

    // Check if official dates are modified and require a reason
    const officialDateFields = ['submissionDate', 'consultantReceiptDate', 'consultantResponseDate', 'approvalDate', 'closureDate'];
    const modifyingOfficial = Object.keys(dateUpdates).some(k => officialDateFields.includes(k) && dateUpdates[k] !== record[k]);
    if (modifyingOfficial && (!reason || !reason.trim())) {
      return { success: false, error: 'A valid contractual/technical reason is mandatory when correcting official lifecycle dates.' };
    }

    const fieldLabels: Record<string, { en: string; ar: string }> = {
      preparationDate: { en: 'Preparation Date', ar: 'تاريخ الإعداد' },
      internalReviewDate: { en: 'Internal Review Date', ar: 'تاريخ التدقيق الداخلي' },
      submissionDate: { en: 'Submission / Sending Date', ar: 'تاريخ الإرسال / التسليم' },
      plannedSubmissionDate: { en: 'Planned Submission Date', ar: 'تاريخ التسليم المخطط' },
      consultantReceiptDate: { en: 'Consultant Receipt Date', ar: 'تاريخ استلام الاستشاري' },
      requiredApprovalDate: { en: 'Turnaround SLA Deadline', ar: 'المهلة التعاقدية للرد' },
      plannedResponseDate: { en: 'Planned Response Date', ar: 'تاريخ الرد المخطط' },
      actualResponseDate: { en: 'Actual Response Date', ar: 'تاريخ الرد الفعلي' },
      consultantResponseDate: { en: 'Consultant Response Date', ar: 'تاريخ رد الاستشاري' },
      approvalDate: { en: 'Approval Date', ar: 'تاريخ الاعتماد' },
      revisionDate: { en: 'Revision Date', ar: 'تاريخ الإصدار' },
      inspectionDate: { en: 'Inspection Date', ar: 'تاريخ الفحص' },
      dispatchDate: { en: 'Dispatch Date', ar: 'تاريخ الإرسال' },
      closureDate: { en: 'Closure Date', ar: 'تاريخ الإغلاق' },
    };

    if (!record.dateCorrectionHistory) {
      record.dateCorrectionHistory = [];
    }

    const nowIso = new Date().toISOString();

    for (const [field, newVal] of Object.entries(dateUpdates)) {
      if (newVal === undefined) continue;
      const oldVal = record[field];
      if (oldVal !== newVal) {
        // Record correction in dateCorrectionHistory
        const logEntry: DateCorrectionLog = {
          id: `dcorr-${uuidv4().substring(0, 8)}`,
          field,
          fieldLabelEn: fieldLabels[field]?.en || field,
          fieldLabelAr: fieldLabels[field]?.ar || field,
          previousDate: oldVal,
          newDate: newVal,
          reason: reason || 'Authorized historical date correction',
          correctedBy: userName,
          correctedAt: nowIso,
        };
        record.dateCorrectionHistory.unshift(logEntry);
        record.hasDateCorrections = true;
        record[field] = newVal;

        // Log audit event
        this.logAudit({
          projectId,
          moduleId,
          recordId: record.id,
          recordRef: ref,
          action: 'DATE_CORRECTION',
          userId,
          userName,
          fieldChanged: field,
          previousValue: oldVal || '(None)',
          newValue: newVal,
          reason: reason || 'Authorized historical date correction',
          comment: `Date correction for ${fieldLabels[field]?.en || field}: ${oldVal || 'None'} -> ${newVal}. Reason: ${reason}`,
        });
      }
    }

    // Changing dates NEVER automatically marks a document as approved or rejected!
    record.updatedAt = nowIso;
    this.saveRecordByModule(collectionName);

    return { success: true, data: record };
  }

  // --- Universal Document Links Engine ---
  public addDocumentLink(
    moduleId: string,
    recordId: string,
    linkData: Omit<DocumentLink, 'id' | 'addedAt'>,
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const target = this.getRecordByModuleAndId(moduleId, recordId);
    if (!target) return { success: false, error: `Record not found in module ${moduleId}` };

    const { record, collectionName, ref, projectId } = target;

    if (!linkData.url || !/^https?:\/\/.+/i.test(linkData.url.trim())) {
      return { success: false, error: 'Document URL must be a valid HTTP or HTTPS web address.' };
    }
    if (!linkData.title || !linkData.title.trim()) {
      return { success: false, error: 'Document title is required.' };
    }

    if (!record.documentLinks) {
      record.documentLinks = [];
    }

    const newLink: DocumentLink = {
      ...linkData,
      id: `doclink-${uuidv4().substring(0, 8)}`,
      title: linkData.title.trim(),
      url: linkData.url.trim(),
      category: linkData.category || 'General Reference',
      addedBy: userName,
      addedAt: new Date().toISOString(),
    };

    record.documentLinks.unshift(newLink);
    record.updatedAt = new Date().toISOString();
    this.saveRecordByModule(collectionName);

    this.logAudit({
      projectId,
      moduleId,
      recordId: record.id,
      recordRef: ref,
      action: 'LINK_ADD',
      userId,
      userName,
      fieldChanged: 'documentLinks',
      previousValue: undefined,
      newValue: `${newLink.title} (${newLink.url})`,
      comment: `Added external document link: ${newLink.title} [${newLink.category}]`,
    });

    return { success: true, data: { link: newLink, record } };
  }

  public updateDocumentLink(
    moduleId: string,
    recordId: string,
    linkId: string,
    updates: Partial<DocumentLink>,
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const target = this.getRecordByModuleAndId(moduleId, recordId);
    if (!target) return { success: false, error: `Record not found in module ${moduleId}` };

    const { record, collectionName, ref, projectId } = target;
    if (!record.documentLinks) record.documentLinks = [];

    const linkIdx = record.documentLinks.findIndex((l: DocumentLink) => l.id === linkId);
    if (linkIdx === -1) return { success: false, error: 'Document link not found' };

    const oldLink = record.documentLinks[linkIdx];

    if (updates.url && !/^https?:\/\/.+/i.test(updates.url.trim())) {
      return { success: false, error: 'Document URL must be a valid HTTP or HTTPS address.' };
    }

    const updatedLink: DocumentLink = {
      ...oldLink,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    record.documentLinks[linkIdx] = updatedLink;
    record.updatedAt = new Date().toISOString();
    this.saveRecordByModule(collectionName);

    this.logAudit({
      projectId,
      moduleId,
      recordId: record.id,
      recordRef: ref,
      action: 'LINK_UPDATE',
      userId,
      userName,
      fieldChanged: 'documentLinks',
      previousValue: `${oldLink.title} (${oldLink.url})`,
      newValue: `${updatedLink.title} (${updatedLink.url})`,
      comment: `Updated document link: ${updatedLink.title}`,
    });

    return { success: true, data: { link: updatedLink, record } };
  }

  public removeDocumentLink(
    moduleId: string,
    recordId: string,
    linkId: string,
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const target = this.getRecordByModuleAndId(moduleId, recordId);
    if (!target) return { success: false, error: `Record not found in module ${moduleId}` };

    const { record, collectionName, ref, projectId } = target;
    if (!record.documentLinks) return { success: true, data: record };

    const linkIdx = record.documentLinks.findIndex((l: DocumentLink) => l.id === linkId);
    if (linkIdx === -1) return { success: false, error: 'Document link not found' };

    const removed = record.documentLinks[linkIdx];
    record.documentLinks.splice(linkIdx, 1);
    record.updatedAt = new Date().toISOString();
    this.saveRecordByModule(collectionName);

    this.logAudit({
      projectId,
      moduleId,
      recordId: record.id,
      recordRef: ref,
      action: 'LINK_DELETE',
      userId,
      userName,
      fieldChanged: 'documentLinks',
      previousValue: `${removed.title} (${removed.url})`,
      newValue: undefined,
      comment: `Removed document link: ${removed.title}`,
    });

    return { success: true, data: record };
  }

  // --- Universal Linked APEX DC Records Engine ---
  public linkApexRecord(
    sourceModuleId: string,
    sourceRecordId: string,
    targetInfo: {
      recordType: ApexRecordType;
      recordId: string;
      relationship?: 'Referenced In' | 'Superseded By' | 'Supported By' | 'Related Action' | 'General Link';
      notes?: string;
    },
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const sourceTarget = this.getRecordByModuleAndId(sourceModuleId, sourceRecordId);
    if (!sourceTarget) return { success: false, error: `Source record not found in ${sourceModuleId}` };

    const destTarget = this.getRecordByModuleAndId(
      targetInfo.recordType === 'drawing' ? 'drawings' :
      targetInfo.recordType === 'submittal' ? 'submittals' :
      targetInfo.recordType === 'ir' ? 'irs' :
      targetInfo.recordType === 'mir' ? 'mirs' :
      targetInfo.recordType === 'correspondence' ? 'correspondence' :
      targetInfo.recordType === 'rfi' ? 'rfis' :
      targetInfo.recordType === 'quality' ? 'quality' :
      targetInfo.recordType === 'transmittal' ? 'transmittals' :
      targetInfo.recordType === 'handover' ? 'handover' :
      targetInfo.recordType === 'siteInstruction' ? 'siteInstructions' :
      targetInfo.recordType,
      targetInfo.recordId
    );

    if (!destTarget) return { success: false, error: `Target record ${targetInfo.recordId} not found` };

    const { record: srcRec, collectionName: srcCol, ref: srcRef, projectId: srcProj } = sourceTarget;
    const { record: dstRec, ref: dstRef } = destTarget;

    if (!srcRec.linkedApexRecords) srcRec.linkedApexRecords = [];

    const exists = srcRec.linkedApexRecords.some((l: LinkedApexRecord) => l.recordId === targetInfo.recordId);
    if (exists) {
      return { success: false, error: 'This record is already linked.' };
    }

    const linkedItem: LinkedApexRecord = {
      id: `lapx-${uuidv4().substring(0, 8)}`,
      recordType: targetInfo.recordType,
      recordId: targetInfo.recordId,
      recordNumber: dstRef,
      title: dstRec.title || dstRec.subject || dstRec.workDescription || dstRec.materialDescription || dstRec.description || dstRef,
      revision: dstRec.currentRevision || dstRec.revisionNumber || dstRec.latestRevision || dstRec.drawingRevision || 'N/A',
      status: dstRec.reviewStatus || dstRec.result || dstRec.status || dstRec.approvalStatus || 'N/A',
      submissionDate: dstRec.submissionDate,
      approvalDate: dstRec.approvalDate,
      relationship: targetInfo.relationship || 'Referenced In',
      notes: targetInfo.notes,
      linkedAt: new Date().toISOString(),
      linkedBy: userName,
    };

    srcRec.linkedApexRecords.unshift(linkedItem);
    srcRec.updatedAt = new Date().toISOString();
    this.saveRecordByModule(srcCol);

    this.logAudit({
      projectId: srcProj,
      moduleId: sourceModuleId,
      recordId: srcRec.id,
      recordRef: srcRef,
      action: 'RECORD_LINK',
      userId,
      userName,
      fieldChanged: 'linkedApexRecords',
      newValue: `${linkedItem.recordNumber} [${linkedItem.relationship}]`,
      comment: `Linked ${targetInfo.recordType.toUpperCase()} ${linkedItem.recordNumber} to ${srcRef}`,
    });

    return { success: true, data: { linkedRecord: linkedItem, record: srcRec } };
  }

  public unlinkApexRecord(
    sourceModuleId: string,
    sourceRecordId: string,
    linkedApexRecordId: string,
    userId: string = 'usr-1',
    userName: string = 'Admin'
  ): { success: boolean; data?: any; error?: string } {
    const sourceTarget = this.getRecordByModuleAndId(sourceModuleId, sourceRecordId);
    if (!sourceTarget) return { success: false, error: `Source record not found in ${sourceModuleId}` };

    const { record: srcRec, collectionName: srcCol, ref: srcRef, projectId: srcProj } = sourceTarget;
    if (!srcRec.linkedApexRecords) return { success: true, data: srcRec };

    const idx = srcRec.linkedApexRecords.findIndex((l: LinkedApexRecord) => l.id === linkedApexRecordId || l.recordId === linkedApexRecordId);
    if (idx === -1) return { success: false, error: 'Linked record not found' };

    const removed = srcRec.linkedApexRecords[idx];
    srcRec.linkedApexRecords.splice(idx, 1);
    srcRec.updatedAt = new Date().toISOString();
    this.saveRecordByModule(srcCol);

    this.logAudit({
      projectId: srcProj,
      moduleId: sourceModuleId,
      recordId: srcRec.id,
      recordRef: srcRef,
      action: 'RECORD_LINK',
      userId,
      userName,
      fieldChanged: 'linkedApexRecords',
      previousValue: removed.recordNumber,
      comment: `Unlinked APEX record: ${removed.recordNumber}`,
    });

    return { success: true, data: srcRec };
  }

  public getRecordAuditTrail(recordId: string, recordRef?: string): AuditEvent[] {
    return this.auditEvents.filter(a => a.recordId === recordId || (recordRef && a.recordRef === recordRef));
  }
}

// Singleton database instance
export const db = new DatabaseEngine();
