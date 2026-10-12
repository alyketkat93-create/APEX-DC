// APEX DC — Server Database & Persistence Engine with Transactional Numbering
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Project, Drawing, TechnicalSubmittal, InspectionRequest, 
  MaterialInspectionRequest, QualityRecord, Correspondence, 
  Rfi, Transmittal, Meeting, SiteInstruction, HandoverItem, 
  Task, CustomModuleDefinition, CustomRecord, User, AuditEvent, NotificationItem 
} from '@/types';
import { 
  initialProjects, initialDrawings, initialSubmittals, 
  initialInspectionRequests, initialMaterialInspections, 
  initialQualityRecords, initialCorrespondence, initialRfis, 
  initialTransmittals, initialMeetings, initialSiteInstructions, 
  initialHandoverItems, initialTasks, initialCustomModules, 
  initialCustomRecords, initialUsers, initialAuditEvents, initialNotifications 
} from '@/data/seedData';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function getFilePath(collection: string): string {
  return path.join(STORAGE_DIR, `${collection}.json`);
}

function readCollection<T>(collection: string, initialData: T[]): T[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) {
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${collection}.json, re-initializing:`, err);
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function writeCollection<T>(collection: string, data: T[]): void {
  const filePath = getFilePath(collection);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
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
    const newDrawing: Drawing = {
      ...drawing,
      id: `drw-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
    this.drawings[idx] = {
      ...old,
      ...updates,
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

  public addDrawingRevision(id: string, revisionData: { revisionNumber: string; status: any; approvalCode?: any; comments?: string; reviewer?: string; fileName?: string; fileUrl?: string; transmittalNumber?: string }, userId: string = 'usr-1', userName: string = 'Admin'): Drawing | null {
    const idx = this.drawings.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const drawing = this.drawings[idx];

    const newRev = {
      id: `drw-rev-${uuidv4().substring(0, 8)}`,
      drawingId: id,
      revisionNumber: revisionData.revisionNumber,
      submissionDate: new Date().toISOString().split('T')[0],
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
      revisionDate: new Date().toISOString().split('T')[0],
      reviewStatus: revisionData.status,
      approvalCode: revisionData.approvalCode,
      reviewComments: revisionData.comments,
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
    const newSub: TechnicalSubmittal = {
      ...submittal,
      id: `sub-${uuidv4().substring(0, 8)}`,
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
    this.submittals[idx] = {
      ...old,
      ...updates,
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
    const newIr: InspectionRequest = {
      ...ir,
      id: `ir-${uuidv4().substring(0, 8)}`,
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
    this.irs[idx] = {
      ...old,
      ...updates,
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
    const newMir: MaterialInspectionRequest = {
      ...mir,
      id: `mir-${uuidv4().substring(0, 8)}`,
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
    this.mirs[idx] = {
      ...old,
      ...updates,
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
    const newRec: QualityRecord = {
      ...record,
      id: `rec-${uuidv4().substring(0, 8)}`,
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
    this.quality[idx] = {
      ...old,
      ...updates,
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
    const newCor: Correspondence = {
      ...cor,
      id: `cor-${uuidv4().substring(0, 8)}`,
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
    this.correspondence[idx] = {
      ...old,
      ...updates,
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
    const newRfi: Rfi = {
      ...rfi,
      id: `rfi-${uuidv4().substring(0, 8)}`,
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
    this.rfis[idx] = {
      ...old,
      ...updates,
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
    const newTr: Transmittal = {
      ...transmittal,
      id: `trn-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transmittals.unshift(newTr);
    writeCollection('transmittals', this.transmittals);

    this.logAudit({
      projectId: newTr.projectId,
      moduleId: 'transmittals',
      recordId: newTr.id,
      recordRef: newTr.transmittalNumber,
      action: 'CREATE',
      userId,
      userName,
      newValue: `Created Transmittal: ${newTr.transmittalNumber} (${newTr.documentList.length} documents)`,
    });

    return newTr;
  }

  public updateTransmittal(id: string, updates: Partial<Transmittal>, userId: string = 'usr-1', userName: string = 'Admin'): Transmittal | null {
    const idx = this.transmittals.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = this.transmittals[idx];
    this.transmittals[idx] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeCollection('transmittals', this.transmittals);

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
    const newItem: HandoverItem = {
      ...item,
      id: `ho-${uuidv4().substring(0, 8)}`,
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
}

// Singleton database instance
export const db = new DatabaseEngine();
