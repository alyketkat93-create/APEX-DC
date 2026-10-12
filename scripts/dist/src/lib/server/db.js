"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// APEX DC — Server Database & Persistence Engine with Transactional Numbering
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const seedData_1 = require("@/data/seedData");
const STORAGE_DIR = path_1.default.join(process.cwd(), 'data', 'storage');
// Ensure storage directory exists
if (!fs_1.default.existsSync(STORAGE_DIR)) {
    fs_1.default.mkdirSync(STORAGE_DIR, { recursive: true });
}
function getFilePath(collection) {
    return path_1.default.join(STORAGE_DIR, `${collection}.json`);
}
function readCollection(collection, initialData) {
    const filePath = getFilePath(collection);
    if (!fs_1.default.existsSync(filePath)) {
        fs_1.default.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const raw = fs_1.default.readFileSync(filePath, 'utf-8');
        if (!raw.trim()) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        return JSON.parse(raw);
    }
    catch (err) {
        console.error(`Error reading ${collection}.json, re-initializing:`, err);
        fs_1.default.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
}
function writeCollection(collection, data) {
    const filePath = getFilePath(collection);
    const tempPath = `${filePath}.tmp`;
    fs_1.default.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs_1.default.renameSync(tempPath, filePath);
}
// Global in-memory cache synchronized with disk
class DatabaseEngine {
    projects;
    drawings;
    submittals;
    irs;
    mirs;
    quality;
    correspondence;
    rfis;
    transmittals;
    meetings;
    siteInstructions;
    handover;
    tasks;
    customModules;
    customRecords;
    users;
    auditEvents;
    notifications;
    constructor() {
        this.projects = readCollection('projects', seedData_1.initialProjects);
        this.drawings = readCollection('drawings', seedData_1.initialDrawings);
        this.submittals = readCollection('submittals', seedData_1.initialSubmittals);
        this.irs = readCollection('irs', seedData_1.initialInspectionRequests);
        this.mirs = readCollection('mirs', seedData_1.initialMaterialInspections);
        this.quality = readCollection('quality', seedData_1.initialQualityRecords);
        this.correspondence = readCollection('correspondence', seedData_1.initialCorrespondence);
        this.rfis = readCollection('rfis', seedData_1.initialRfis);
        this.transmittals = readCollection('transmittals', seedData_1.initialTransmittals);
        this.meetings = readCollection('meetings', seedData_1.initialMeetings);
        this.siteInstructions = readCollection('siteInstructions', seedData_1.initialSiteInstructions);
        this.handover = readCollection('handover', seedData_1.initialHandoverItems);
        this.tasks = readCollection('tasks', seedData_1.initialTasks);
        this.customModules = readCollection('customModules', seedData_1.initialCustomModules);
        this.customRecords = readCollection('customRecords', seedData_1.initialCustomRecords);
        this.users = readCollection('users', seedData_1.initialUsers);
        this.auditEvents = readCollection('auditEvents', seedData_1.initialAuditEvents);
        this.notifications = readCollection('notifications', seedData_1.initialNotifications);
    }
    // --- Audit Trail Logging ---
    logAudit(event) {
        const newEvent = {
            ...event,
            id: `aud-${(0, uuid_1.v4)()}`,
            timestamp: new Date().toISOString(),
        };
        this.auditEvents.unshift(newEvent);
        writeCollection('auditEvents', this.auditEvents);
        return newEvent;
    }
    getAuditEvents(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.auditEvents;
        return this.auditEvents.filter(a => a.projectId === projectId);
    }
    // --- Document Numbering Engine ---
    generateDocumentNumber(projectId, docType, discipline = 'GEN', zone, customPrefix) {
        const project = this.projects.find(p => p.id === projectId);
        const prjCode = project ? project.code : 'APX-PRJ';
        // Discipline abbreviations
        const discMap = {
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
        }
        else if (docType === 'SUB') {
            count = this.submittals.filter(s => s.projectId === projectId).length + 1;
        }
        else if (docType === 'IR') {
            count = this.irs.filter(i => i.projectId === projectId).length + 1;
        }
        else if (docType === 'MIR') {
            count = this.mirs.filter(m => m.projectId === projectId).length + 1;
        }
        else if (docType === 'NCR') {
            count = this.quality.filter(q => q.projectId === projectId && q.recordType.includes('NCR')).length + 1;
        }
        else if (docType === 'COR') {
            count = this.correspondence.filter(c => c.projectId === projectId).length + 1;
        }
        else if (docType === 'RFI') {
            count = this.rfis.filter(r => r.projectId === projectId).length + 1;
        }
        else if (docType === 'TR') {
            count = this.transmittals.filter(t => t.projectId === projectId).length + 1;
        }
        else if (docType === 'MOM') {
            count = this.meetings.filter(m => m.projectId === projectId).length + 1;
        }
        else if (docType === 'SI') {
            count = this.siteInstructions.filter(s => s.projectId === projectId).length + 1;
        }
        else if (docType === 'HO') {
            count = this.handover.filter(h => h.projectId === projectId).length + 1;
        }
        else if (customPrefix) {
            count = this.customRecords.filter(r => r.projectId === projectId && r.recordNumber.includes(customPrefix)).length + 1;
        }
        const seqPadded = String(count).padStart(4, '0');
        const typeCode = customPrefix || docType;
        return `${prjCode}-${discCode}-${typeCode}-${seqPadded}`;
    }
    // --- Projects ---
    getProjects() {
        return this.projects;
    }
    getProjectById(id) {
        return this.projects.find(p => p.id === id);
    }
    createProject(project, userId = 'usr-1', userName = 'Admin') {
        const newProject = {
            ...project,
            id: `prj-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateProject(id, updates, userId = 'usr-1', userName = 'Admin') {
        const index = this.projects.findIndex(p => p.id === id);
        if (index === -1)
            return null;
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
    getDrawings(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.drawings;
        return this.drawings.filter(d => d.projectId === projectId);
    }
    getDrawingById(id) {
        return this.drawings.find(d => d.id === id);
    }
    createDrawing(drawing, userId = 'usr-1', userName = 'Admin') {
        const newDrawing = {
            ...drawing,
            id: `drw-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateDrawing(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.drawings.findIndex(d => d.id === id);
        if (idx === -1)
            return null;
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
    addDrawingRevision(id, revisionData, userId = 'usr-1', userName = 'Admin') {
        const idx = this.drawings.findIndex(d => d.id === id);
        if (idx === -1)
            return null;
        const drawing = this.drawings[idx];
        const newRev = {
            id: `drw-rev-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    getSubmittals(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.submittals;
        return this.submittals.filter(s => s.projectId === projectId);
    }
    getSubmittalById(id) {
        return this.submittals.find(s => s.id === id);
    }
    createSubmittal(submittal, userId = 'usr-1', userName = 'Admin') {
        const newSub = {
            ...submittal,
            id: `sub-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateSubmittal(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.submittals.findIndex(s => s.id === id);
        if (idx === -1)
            return null;
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
    getInspectionRequests(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.irs;
        return this.irs.filter(i => i.projectId === projectId);
    }
    getInspectionRequestById(id) {
        return this.irs.find(i => i.id === id);
    }
    createInspectionRequest(ir, userId = 'usr-1', userName = 'Admin') {
        const newIr = {
            ...ir,
            id: `ir-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateInspectionRequest(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.irs.findIndex(i => i.id === id);
        if (idx === -1)
            return null;
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
    getMaterialInspections(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.mirs;
        return this.mirs.filter(m => m.projectId === projectId);
    }
    getMaterialInspectionById(id) {
        return this.mirs.find(m => m.id === id);
    }
    createMaterialInspection(mir, userId = 'usr-1', userName = 'Admin') {
        const newMir = {
            ...mir,
            id: `mir-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateMaterialInspection(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.mirs.findIndex(m => m.id === id);
        if (idx === -1)
            return null;
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
    getQualityRecords(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.quality;
        return this.quality.filter(q => q.projectId === projectId);
    }
    getQualityRecordById(id) {
        return this.quality.find(q => q.id === id);
    }
    createQualityRecord(record, userId = 'usr-1', userName = 'Admin') {
        const newRec = {
            ...record,
            id: `rec-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateQualityRecord(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.quality.findIndex(q => q.id === id);
        if (idx === -1)
            return null;
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
    getCorrespondence(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.correspondence;
        return this.correspondence.filter(c => c.projectId === projectId);
    }
    getCorrespondenceById(id) {
        return this.correspondence.find(c => c.id === id);
    }
    createCorrespondence(cor, userId = 'usr-1', userName = 'Admin') {
        const newCor = {
            ...cor,
            id: `cor-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateCorrespondence(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.correspondence.findIndex(c => c.id === id);
        if (idx === -1)
            return null;
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
    getRfis(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.rfis;
        return this.rfis.filter(r => r.projectId === projectId);
    }
    getRfiById(id) {
        return this.rfis.find(r => r.id === id);
    }
    createRfi(rfi, userId = 'usr-1', userName = 'Admin') {
        const newRfi = {
            ...rfi,
            id: `rfi-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateRfi(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.rfis.findIndex(r => r.id === id);
        if (idx === -1)
            return null;
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
    getTransmittals(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.transmittals;
        return this.transmittals.filter(t => t.projectId === projectId);
    }
    getTransmittalById(id) {
        return this.transmittals.find(t => t.id === id);
    }
    createTransmittal(transmittal, userId = 'usr-1', userName = 'Admin') {
        const newTr = {
            ...transmittal,
            id: `trn-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateTransmittal(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.transmittals.findIndex(t => t.id === id);
        if (idx === -1)
            return null;
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
    getMeetings(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.meetings;
        return this.meetings.filter(m => m.projectId === projectId);
    }
    getMeetingById(id) {
        return this.meetings.find(m => m.id === id);
    }
    createMeeting(meeting, userId = 'usr-1', userName = 'Admin') {
        const newMtg = {
            ...meeting,
            id: `mtg-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateMeeting(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.meetings.findIndex(m => m.id === id);
        if (idx === -1)
            return null;
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
    getSiteInstructions(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.siteInstructions;
        return this.siteInstructions.filter(s => s.projectId === projectId);
    }
    createSiteInstruction(si, userId = 'usr-1', userName = 'Admin') {
        const newSi = {
            ...si,
            id: `si-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    getHandoverItems(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.handover;
        return this.handover.filter(h => h.projectId === projectId);
    }
    createHandoverItem(item, userId = 'usr-1', userName = 'Admin') {
        const newItem = {
            ...item,
            id: `ho-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    getTasks(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.tasks;
        return this.tasks.filter(t => t.projectId === projectId);
    }
    createTask(task, userId = 'usr-1', userName = 'Admin') {
        const newTask = {
            ...task,
            id: `tsk-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    updateTask(id, updates, userId = 'usr-1', userName = 'Admin') {
        const idx = this.tasks.findIndex(t => t.id === id);
        if (idx === -1)
            return null;
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
    getCustomModules(projectId) {
        return this.customModules.filter(m => m.active);
    }
    getCustomModuleById(idOrKey) {
        return this.customModules.find(m => m.id === idOrKey || m.key === idOrKey);
    }
    createCustomModule(mod, userId = 'usr-1', userName = 'Admin') {
        const newMod = {
            ...mod,
            id: `mod-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    getCustomRecords(moduleId, projectId) {
        return this.customRecords.filter(r => {
            const matchMod = r.moduleId === moduleId;
            const matchPrj = !projectId || projectId === 'ALL' || r.projectId === projectId;
            return matchMod && matchPrj;
        });
    }
    createCustomRecord(rec, userId = 'usr-1', userName = 'Admin') {
        const newRec = {
            ...rec,
            id: `crec-${(0, uuid_1.v4)().substring(0, 8)}`,
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
    getNotifications(projectId) {
        if (!projectId || projectId === 'ALL')
            return this.notifications;
        return this.notifications.filter(n => n.projectId === projectId);
    }
    markNotificationRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.isRead = true;
            writeCollection('notifications', this.notifications);
        }
    }
    // --- Users ---
    getUsers() {
        return this.users;
    }
}
// Singleton database instance
exports.db = new DatabaseEngine();
