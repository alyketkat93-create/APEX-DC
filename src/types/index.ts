// APEX DC — Core TypeScript Type Definitions

export type Discipline = 
  | 'Architectural'
  | 'Structural'
  | 'MEP-HVAC'
  | 'MEP-Plumbing'
  | 'MEP-Firefighting'
  | 'MEP-Electrical'
  | 'MEP-ELV'
  | 'Infrastructure'
  | 'Builder Works'
  | 'QA/QC'
  | 'General';

export type ReviewStatus = 
  | 'Draft'
  | 'Internal Review'
  | 'Submitted to Consultant'
  | 'Under Review'
  | 'Code A - Approved'
  | 'Code B - Approved as Noted'
  | 'Code C - Revise and Resubmit'
  | 'Code D - Rejected'
  | 'As-Built Accepted'
  | 'Closed';

export type UserRole =
  | 'Super Administrator'
  | 'Project Director'
  | 'Project Manager'
  | 'Document Control Manager'
  | 'Document Controller'
  | 'Technical Office Engineer'
  | 'MEP Construction Manager'
  | 'QA/QC Manager'
  | 'QA/QC Engineer'
  | 'Site Engineer'
  | 'Consultant Reviewer'
  | 'Client Representative'
  | 'Auditor';

export interface User {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  role: UserRole;
  company: string;
  phone?: string;
  avatar?: string;
  active: boolean;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  client: string;
  consultant: string;
  mainContractor: string;
  subcontractors: string[];
  projectManager: string;
  projectEngineer: string;
  documentController: string;
  qaQcManager: string;
  location: string;
  contractNumber: string;
  contractValue: number;
  currency: string;
  startDate: string;
  plannedCompletionDate: string;
  actualCompletionDate?: string;
  status: 'Tendering' | 'Active' | 'Under Handover' | 'Substantially Completed' | 'Closed' | 'Suspended';
  projectType: 'Commercial Complex' | 'Hospital & Healthcare' | 'Luxury Resort' | 'Infrastructure & Metro' | 'Residential Compound' | 'Industrial';
  description: string;
  logo?: string;
  numberingFormat: string;
  reviewDurationDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingRevision {
  id: string;
  drawingId: string;
  revisionNumber: string; // e.g. 'P01', 'P02', 'C01', '0'
  submissionDate: string;
  status: ReviewStatus;
  approvalCode?: 'A' | 'B' | 'C' | 'D';
  comments?: string;
  reviewer?: string;
  fileName?: string;
  fileUrl?: string;
  transmittalNumber?: string;
  createdAt: string;
}

export interface Drawing {
  id: string;
  projectId: string;
  drawingNumber: string;
  title: string;
  titleAr?: string;
  discipline: Discipline;
  system: string;
  buildingZone: string;
  floorLevel: string;
  drawingType: 
    | 'Design Drawing'
    | 'IFC (Issued for Construction)'
    | 'Shop Drawing'
    | 'Coordination Drawing'
    | 'Combined Services Drawing (CSD)'
    | 'Builder Work Drawing (BWD)'
    | 'Schematic Drawing'
    | 'As-Built Drawing'
    | 'Redline Drawing';
  originator: string;
  contractorRef?: string;
  consultantRef?: string;
  currentRevision: string;
  revisionDate: string;
  submissionDate?: string;
  reviewStatus: ReviewStatus;
  approvalCode?: 'A' | 'B' | 'C' | 'D';
  reviewer?: string;
  reviewComments?: string;
  approvalDate?: string;
  plannedSubmissionDate?: string;
  requiredResponseDate?: string;
  actualResponseDate?: string;
  relatedRfiId?: string;
  relatedSubmittalId?: string;
  relatedTransmittalId?: string;
  supersededDrawingRef?: string;
  cadFileRef?: string;
  bimModelRef?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  revisions: DrawingRevision[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalSubmittal {
  id: string;
  projectId: string;
  submittalNumber: string;
  title: string;
  titleAr?: string;
  type: 
    | 'Material Submittal'
    | 'Material Approval Request (MAR)'
    | 'Product Data Sheet'
    | 'Manufacturer Catalogue'
    | 'Compliance Statement'
    | 'Method Statement'
    | 'Technical Calculations'
    | 'Equipment Submittal'
    | 'Alternative Material Request'
    | 'Value Engineering';
  discipline: Discipline;
  system: string;
  specSection: string;
  boqRef?: string;
  manufacturer: string;
  supplier: string;
  countryOfOrigin: string;
  modelNumber?: string;
  materialDescription: string;
  complianceStatus: 'Fully Compliant' | 'Compliant with Deviations' | 'Alternative Proposed';
  submittedBy: string;
  preparedBy: string;
  checkedBy: string;
  submissionDate: string;
  requiredApprovalDate: string;
  actualApprovalDate?: string;
  reviewStatus: ReviewStatus;
  revisionNumber: string;
  consultantComments?: string;
  relatedDrawingIds?: string[];
  relatedMirIds?: string[];
  relatedPoRef?: string;
  relatedRfiIds?: string[];
  warrantyYears?: number;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionRequest {
  id: string;
  projectId: string;
  irNumber: string;
  discipline: Discipline;
  system: string;
  buildingZone: string;
  floorLocation: string;
  inspectionType: string;
  workDescription: string;
  specRef?: string;
  approvedDrawingRef: string;
  drawingRevision?: string;
  approvedMethodStatement?: string;
  approvedItpRef?: string;
  checklistRef?: string;
  relatedMaterialApproval?: string;
  relatedMirId?: string;
  contractorRequestDate: string;
  requestedDateTime: string;
  submittedBy: string;
  siteEngineer: string;
  qaQcEngineer: string;
  consultantInspector?: string;
  result: 'Draft' | 'Submitted' | 'Scheduled' | 'Accepted' | 'Accepted with Comments' | 'Rejected' | 'Closed';
  consultantComments?: string;
  reinspectionIrId?: string;
  originalIrId?: string;
  correctiveActionRequired?: string;
  correctiveActionSubmitted?: string;
  closureDate?: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialInspectionRequest {
  id: string;
  projectId: string;
  mirNumber: string;
  materialCategory: string;
  materialDescription: string;
  manufacturer: string;
  supplier: string;
  modelPartNumber?: string;
  approvedSubmittalRef: string;
  poRef?: string;
  deliveryNoteNumber: string;
  deliveryDate: string;
  deliveryLocation: string;
  storageLocation: string;
  quantityDelivered: number;
  unitOfMeasure: string;
  quantityInspected: number;
  quantityAccepted: number;
  quantityRejected: number;
  quantityPending: number;
  batchLotNumber?: string;
  serialNumbers?: string;
  countryOfOrigin: string;
  mtcReferences?: string;
  inspectionDate?: string;
  inspector: string;
  consultantRep?: string;
  result: 'Draft' | 'Under Inspection' | 'Accepted' | 'Partially Accepted' | 'Rejected' | 'Closed';
  ncrRef?: string;
  remarks?: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface QualityRecord {
  id: string;
  projectId: string;
  recordType: 
    | 'NCR (Non-Conformance Report)'
    | 'CAR (Corrective Action Request)'
    | 'Site Observation Report'
    | 'ITP (Inspection & Test Plan)'
    | 'Pressure Test Report'
    | 'Flushing & Cleaning Report'
    | 'Punch List / Snag'
    | 'Quality Audit';
  recordNumber: string;
  title: string;
  discipline: Discipline;
  location: string;
  responsibleParty: string;
  issueDate: string;
  dueDate: string;
  severity: 'Minor' | 'Major' | 'Critical';
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  status: 'Open' | 'Assigned' | 'Corrective Action Submitted' | 'Under Verification' | 'Accepted' | 'Rejected' | 'Closed';
  verifiedBy?: string;
  closureDate?: string;
  closureEvidence?: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Correspondence {
  id: string;
  projectId: string;
  correspondenceNumber: string;
  direction: 'Incoming' | 'Outgoing';
  letterRef: string;
  letterDate: string;
  receivedDispatchedDate: string;
  sender: string;
  recipient: string;
  ccList?: string;
  subject: string;
  discipline: Discipline;
  contractClauseRef?: string;
  relatedDrawingId?: string;
  relatedRfiId?: string;
  actionRequired?: string;
  responsiblePerson: string;
  responseDeadline?: string;
  responseRef?: string;
  status: 'Draft' | 'Dispatched' | 'Received' | 'Action Pending' | 'Responded' | 'Closed';
  confidentiality: 'Normal' | 'Confidential' | 'Restricted';
  letterBody: string;
  attachments?: { name: string; url: string }[];
  proofOfDispatchReceipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rfi {
  id: string;
  projectId: string;
  rfiNumber: string;
  subject: string;
  technicalQuestion: string;
  discipline: Discipline;
  location: string;
  drawingRefs?: string;
  specRefs?: string;
  relatedSubmittalId?: string;
  originator: string;
  recipient: string;
  dateRaised: string;
  requiredResponseDate: string;
  actualResponseDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  potentialCostImpact: boolean;
  potentialScheduleImpact: boolean;
  consultantResponse?: string;
  status: 'Open' | 'Under Review' | 'Answered' | 'Closed';
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TransmittalItem {
  docNumber: string;
  docTitle: string;
  revision: string;
  docType: string;
  copies?: number;
  format?: 'PDF' | 'CAD' | 'Hardcopy' | 'Sample';
  notes?: string;
}

export interface Transmittal {
  id: string;
  projectId: string;
  transmittalNumber: string;
  category: 'Shop Drawings' | 'As-Built Drawings' | 'Technical Submittals' | 'Quality Records' | 'General';
  sender: string;
  recipient: string;
  submissionDate: string;
  purpose: 'For Approval' | 'For Information' | 'For Construction' | 'For Review & Comment' | 'As-Built Records';
  documentList: TransmittalItem[];
  requiredAction: string;
  deliveryMethod: 'Hand Delivery' | 'Email / Portal' | 'Courier' | 'System Transmittal';
  dispatchRef?: string;
  receiptAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: string;
  remarks?: string;
  status: 'Draft' | 'Issued / Dispatched' | 'Acknowledged' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  projectId: string;
  itemNumber: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Carried Forward';
  carriedFromMeetingNumber?: string;
  completedDate?: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  meetingNumber: string;
  meetingType: 'Technical Coordination' | 'Progress Meeting' | 'QA/QC Meeting' | 'Consultant Review' | 'Client Meeting' | 'Internal';
  title: string;
  dateTime: string;
  location: string;
  attendees: { name: string; role: string; company: string; present: boolean }[];
  agenda: string;
  discussionPoints: string;
  decisions: string;
  actionItems: MeetingActionItem[];
  minutesPreparedBy: string;
  status: 'Draft' | 'Minutes Issued' | 'Approved';
  createdAt: string;
  updatedAt: string;
}

export interface SiteInstruction {
  id: string;
  projectId: string;
  instructionNumber: string;
  instructionType: 'Site Instruction (SI)' | "Engineer's Instruction (EI)" | 'Variation Order (VO)' | 'Change Request' | 'Potential Claim';
  originator: string;
  dateReceived: string;
  description: string;
  reasonForChange: string;
  contractClauseRef?: string;
  relatedRfiId?: string;
  relatedDrawingId?: string;
  potentialCostImpact?: number;
  potentialTimeImpactDays?: number;
  responsibleDept: string;
  status: 'Proposed' | 'Instructed' | 'Submitted' | 'Approved' | 'Rejected' | 'Implemented';
  approvedAmount?: number;
  approvedDays?: number;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface HandoverItem {
  id: string;
  projectId: string;
  itemNumber: string;
  category: 
    | 'As-Built Drawing'
    | 'O&M Manual'
    | 'Warranty Certificate'
    | 'Testing & Commissioning Report'
    | 'TAB Report (Testing Adjusting Balancing)'
    | 'Fire Alarm & Fighting Certification'
    | 'Electrical Megger/Load Test'
    | 'Spare Parts & Tools'
    | 'Civil Defense / Municipality Approval'
    | 'Authority Handover Certificate';
  title: string;
  discipline: Discipline;
  system: string;
  buildingZone: string;
  originalDocRef?: string;
  latestRevision: string;
  siteVerificationStatus: 'Pending' | 'Verified on Site' | 'Snags Identified';
  qaQcVerificationStatus: 'Pending' | 'Verified' | 'Deficiencies Noted';
  consultantReviewStatus: 'Pending' | 'Approved' | 'Comments Pending' | 'Rejected';
  approvalStatus: 'Pending' | 'Approved' | 'Handed Over';
  handoverPackageRef: string;
  completionPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  taskNumber: string;
  title: string;
  description: string;
  relatedDocumentType?: string;
  relatedDocumentId?: string;
  relatedDocumentNumber?: string;
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  startDate: string;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'Under Review' | 'Completed' | 'Cancelled';
  checklist: { id: string; text: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldDef {
  id: string;
  name: string;
  label: string;
  labelAr: string;
  type: 
    | 'text'
    | 'longtext'
    | 'number'
    | 'decimal'
    | 'date'
    | 'time'
    | 'datetime'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'yesno'
    | 'user'
    | 'project'
    | 'docnum'
    | 'file'
    | 'table';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select / multiselect
  placeholder?: string;
}

export interface CustomModuleDefinition {
  id: string;
  key: string;
  name: string;
  nameAr: string;
  icon: string;
  category: string;
  recordType: string;
  numberingPrefix: string;
  workflowStatuses: { code: string; label: string; labelAr: string; color: string; isClosed: boolean }[];
  fields: CustomFieldDef[];
  active: boolean;
  projectIds?: string[]; // if empty, company-wide
  createdAt: string;
  updatedAt: string;
}

export interface CustomRecord {
  id: string;
  moduleId: string;
  projectId: string;
  recordNumber: string;
  status: string;
  data: Record<string, any>;
  attachments?: { name: string; url: string }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  projectId?: string;
  moduleId: string;
  recordId: string;
  recordRef: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'DISPATCH' | 'REVISE' | 'IMPORT' | 'EXPORT';
  userId: string;
  userName: string;
  previousValue?: string;
  newValue?: string;
  comment?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  projectId: string;
  documentType: string;
  documentNumber: string;
  isRead: boolean;
  createdAt: string;
}
