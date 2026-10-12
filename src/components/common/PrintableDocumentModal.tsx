'use client';

import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: 'DRAWING_COVER' | 'SUBMITTAL_COVER' | 'IR_FORM' | 'MIR_FORM' | 'TRANSMITTAL_SLIP' | 'LETTER_HEAD' | 'NCR_FORM' | 'MOM';
  title: string;
  data: any;
}

export function PrintableDocumentModal({ isOpen, onClose, docType, title, data }: PrintableDocumentModalProps) {
  const { currentProject, language } = useProject();

  if (!isOpen || !data) return null;

  const prj = currentProject || {
    name: 'Mega Construction Project',
    code: 'APX-PRJ-01',
    client: 'Client / Employer',
    consultant: 'Lead Engineering Consultant',
    mainContractor: 'Main Contracting JV',
    location: 'Riyadh, Kingdom of Saudi Arabia',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-4xl w-full my-auto flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-navy-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">{title}</span>
            <span className="text-xs bg-navy-800 text-amber-300 px-2 py-0.5 rounded font-mono">
              {data.drawingNumber || data.submittalNumber || data.irNumber || data.mirNumber || data.transmittalNumber || data.recordNumber || data.correspondenceNumber || data.meetingNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold px-3 py-1.5 rounded text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-navy-800 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0">
          <div className="bg-white p-8 max-w-[800px] mx-auto shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-4 text-slate-900 font-sans text-xs">
            
            {/* Document Header Table */}
            <div className="border-2 border-slate-800 mb-6">
              <div className="grid grid-cols-4 border-b-2 border-slate-800 divide-x divide-slate-800">
                <div className="p-3 text-center col-span-1 flex flex-col items-center justify-center bg-slate-50">
                  <div className="font-black text-xl tracking-tighter text-navy-900">APEX DC</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">PROJECT CONTROLS</div>
                </div>
                <div className="p-3 text-center col-span-2 flex flex-col justify-center">
                  <div className="font-bold text-sm uppercase text-slate-900">{prj.name}</div>
                  <div className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">PROJECT CODE: {prj.code}</div>
                  <div className="text-[10px] text-slate-500">{prj.location}</div>
                </div>
                <div className="p-3 text-center col-span-1 flex flex-col items-center justify-center bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-600">STANDARD FORM</div>
                  <div className="text-[11px] font-mono font-bold text-amber-800 mt-0.5">{docType.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Stakeholders Bar */}
              <div className="grid grid-cols-3 divide-x divide-slate-800 text-[10px] bg-slate-100 font-semibold border-b border-slate-800">
                <div className="p-1.5 pl-3"><strong>EMPLOYER / CLIENT:</strong> {prj.client}</div>
                <div className="p-1.5 pl-3"><strong>ENGINEERING CONSULTANT:</strong> {prj.consultant}</div>
                <div className="p-1.5 pl-3"><strong>MAIN CONTRACTOR:</strong> {prj.mainContractor}</div>
              </div>

              {/* Title & Reference Bar */}
              <div className="p-3 bg-amber-500/10 text-center font-bold text-sm tracking-wide text-navy-950 border-b border-slate-800 uppercase">
                {title}
              </div>

              {/* Document Identity Fields */}
              <div className="grid grid-cols-2 divide-x divide-slate-800 text-xs">
                <div className="p-2 space-y-1">
                  <div><strong>DOCUMENT NUMBER:</strong> <span className="font-mono font-bold">{data.drawingNumber || data.submittalNumber || data.irNumber || data.mirNumber || data.transmittalNumber || data.recordNumber || data.correspondenceNumber || data.meetingNumber}</span></div>
                  <div><strong>TITLE / SUBJECT:</strong> {data.title || data.subject || data.materialDescription || data.workDescription}</div>
                  <div><strong>DISCIPLINE:</strong> {data.discipline || 'Multi-disciplinary MEP'}</div>
                  <div><strong>SYSTEM:</strong> {data.system || 'N/A'}</div>
                </div>
                <div className="p-2 space-y-1 bg-slate-50">
                  <div><strong>CURRENT REVISION:</strong> <span className="font-mono font-bold">{data.currentRevision || data.revisionNumber || data.latestRevision || '00'}</span></div>
                  <div><strong>DATE OF SUBMISSION:</strong> <span className="font-mono">{data.submissionDate || data.revisionDate || data.letterDate || data.dateTime?.split('T')[0] || new Date().toISOString().split('T')[0]}</span></div>
                  <div><strong>LOCATION / ZONE:</strong> {data.buildingZone || data.floorLevel || data.location || 'Site Wide'}</div>
                  <div><strong>STATUS / CODE:</strong> <span className="font-bold text-amber-900">{data.reviewStatus || data.result || data.status || 'Active'}</span></div>
                </div>
              </div>
            </div>

            {/* Document Specific Body Section */}
            {docType === 'DRAWING_COVER' && (
              <div className="space-y-4 mb-6">
                <div className="border border-slate-300 p-3 rounded">
                  <div className="font-bold mb-1 text-[11px] uppercase text-slate-700">Drawing Specifications & References</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Drawing Type:</strong> {data.drawingType}</div>
                    <div><strong>Originator:</strong> {data.originator}</div>
                    <div><strong>Contractor Ref:</strong> {data.contractorRef || 'N/A'}</div>
                    <div><strong>Consultant Ref:</strong> {data.consultantRef || 'N/A'}</div>
                    <div><strong>Related RFI:</strong> {data.relatedRfiId || 'None'}</div>
                    <div><strong>Related Submittal:</strong> {data.relatedSubmittalId || 'None'}</div>
                  </div>
                </div>

                {data.revisions && data.revisions.length > 0 && (
                  <div>
                    <div className="font-bold text-[11px] uppercase text-slate-700 mb-1">Historical Revision Register</div>
                    <table className="w-full border border-slate-300 divide-y divide-slate-300 text-[10px]">
                      <thead className="bg-slate-100 font-bold">
                        <tr>
                          <th className="p-1.5 text-left border-r">Rev</th>
                          <th className="p-1.5 text-left border-r">Date</th>
                          <th className="p-1.5 text-left border-r">Transmittal</th>
                          <th className="p-1.5 text-left border-r">Status</th>
                          <th className="p-1.5 text-left">Review Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {data.revisions.map((rev: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-bold font-mono border-r">{rev.revisionNumber}</td>
                            <td className="p-1.5 font-mono border-r">{rev.submissionDate}</td>
                            <td className="p-1.5 font-mono border-r">{rev.transmittalNumber || 'TR-Direct'}</td>
                            <td className="p-1.5 font-semibold border-r">{rev.status}</td>
                            <td className="p-1.5">{rev.comments || 'No comments'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {docType === 'SUBMITTAL_COVER' && (
              <div className="space-y-4 mb-6">
                <div className="border border-slate-300 p-3 rounded">
                  <div className="font-bold mb-1 text-[11px] uppercase text-slate-700">Manufacturer & Product Information</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Manufacturer:</strong> {data.manufacturer}</div>
                    <div><strong>Supplier:</strong> {data.supplier}</div>
                    <div><strong>Country of Origin:</strong> {data.countryOfOrigin}</div>
                    <div><strong>Model / Part:</strong> {data.modelNumber || 'N/A'}</div>
                    <div><strong>Spec Section:</strong> {data.specSection}</div>
                    <div><strong>BOQ Ref:</strong> {data.boqRef || 'N/A'}</div>
                    <div><strong>Compliance:</strong> {data.complianceStatus}</div>
                    <div><strong>Warranty:</strong> {data.warrantyYears ? `${data.warrantyYears} Years` : 'Standard'}</div>
                  </div>
                </div>
                <div className="border border-slate-300 p-3 rounded">
                  <div className="font-bold text-[11px] uppercase text-slate-700 mb-1">Material Technical Description</div>
                  <p className="text-[11px] leading-relaxed text-slate-700">{data.materialDescription}</p>
                </div>
              </div>
            )}

            {docType === 'TRANSMITTAL_SLIP' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-300 rounded text-[11px]">
                  <div><strong>From (Sender):</strong> {data.sender}</div>
                  <div><strong>To (Recipient):</strong> {data.recipient}</div>
                  <div><strong>Submission Purpose:</strong> {data.purpose}</div>
                  <div><strong>Delivery Method:</strong> {data.deliveryMethod}</div>
                  <div><strong>Required Action:</strong> {data.requiredAction}</div>
                  <div><strong>Receipt Acknowledged:</strong> {data.receiptAcknowledged ? `YES (${data.acknowledgedBy})` : 'PENDING'}</div>
                </div>

                <div>
                  <div className="font-bold text-[11px] uppercase text-slate-700 mb-1">Enclosed Documents List ({data.documentList?.length || 0})</div>
                  <table className="w-full border border-slate-300 divide-y divide-slate-300 text-[10px]">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-1.5 text-left border-r">Item #</th>
                        <th className="p-1.5 text-left border-r">Document Number</th>
                        <th className="p-1.5 text-left border-r">Title / Description</th>
                        <th className="p-1.5 text-center border-r">Rev</th>
                        <th className="p-1.5 text-center border-r">Type</th>
                        <th className="p-1.5 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.documentList?.map((doc: any, i: number) => (
                        <tr key={i}>
                          <td className="p-1.5 text-center font-mono border-r">{i + 1}</td>
                          <td className="p-1.5 font-bold font-mono border-r">{doc.docNumber}</td>
                          <td className="p-1.5 border-r">{doc.docTitle}</td>
                          <td className="p-1.5 text-center font-mono border-r">{doc.revision}</td>
                          <td className="p-1.5 text-center border-r">{doc.docType}</td>
                          <td className="p-1.5">{doc.notes || 'As submitted'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {docType === 'LETTER_HEAD' && (
              <div className="space-y-4 mb-6">
                <div className="border-b border-slate-300 pb-3 text-xs leading-relaxed">
                  <div><strong>Date:</strong> {data.letterDate}</div>
                  <div><strong>Our Ref:</strong> {data.letterRef}</div>
                  <div className="mt-2"><strong>To:</strong> {data.recipient}</div>
                  <div><strong>Attention:</strong> Project Director / Supervising Engineer</div>
                  <div><strong>From:</strong> {data.sender}</div>
                  <div className="mt-2"><strong>Subject:</strong> <span className="font-bold underline">{data.subject}</span></div>
                </div>
                <div className="py-4 text-xs leading-relaxed whitespace-pre-line text-slate-800">
                  {data.letterBody}
                </div>
              </div>
            )}

            {/* Consultant Review & Approval Stamp Block */}
            <div className="border-2 border-slate-800 p-4 bg-slate-50 mt-6">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>CONSULTANT REVIEW & APPROVAL CODE</span>
                <span className="text-[10px] text-slate-500 font-normal">Dar Al-Handasah / Buro Happold JV</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold mb-3">
                <div className={`p-2 border rounded ${data.approvalCode === 'A' ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                  CODE A<br/><span className="text-[9px] font-normal">APPROVED</span>
                </div>
                <div className={`p-2 border rounded ${data.approvalCode === 'B' ? 'bg-amber-500 text-navy-950 font-black ring-2 ring-amber-600' : 'bg-white border-slate-300 text-slate-500'}`}>
                  CODE B<br/><span className="text-[9px] font-normal">APPROVED AS NOTED</span>
                </div>
                <div className={`p-2 border rounded ${data.approvalCode === 'C' ? 'bg-orange-500 text-white font-black ring-2 ring-orange-600' : 'bg-white border-slate-300 text-slate-500'}`}>
                  CODE C<br/><span className="text-[9px] font-normal">REVISE & RESUBMIT</span>
                </div>
                <div className={`p-2 border rounded ${data.approvalCode === 'D' ? 'bg-red-600 text-white font-black ring-2 ring-red-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                  CODE D<br/><span className="text-[9px] font-normal">REJECTED</span>
                </div>
              </div>

              <div className="text-[11px] bg-white p-2.5 rounded border border-slate-300 mb-3 min-h-[45px]">
                <strong>Review Comments:</strong> {data.reviewComments || data.consultantComments || 'Reviewed and found compliant with contractual specifications and approved method statements.'}
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-3 divide-x divide-slate-300 border-t border-slate-300 pt-3 text-[10px]">
                <div className="pr-2">
                  <div className="font-bold text-slate-700">PREPARED BY (CONTRACTOR):</div>
                  <div className="mt-4 font-mono font-bold text-slate-800">{data.preparedBy || data.submittedBy || 'Eng. Aly Ketkat'}</div>
                  <div className="text-[9px] text-slate-400">Document Control / Technical Office</div>
                </div>
                <div className="px-2">
                  <div className="font-bold text-slate-700">CHECKED BY (MEP CM):</div>
                  <div className="mt-4 font-mono font-bold text-slate-800">{data.checkedBy || 'Eng. Hisham Al-Husseini'}</div>
                  <div className="text-[9px] text-slate-400">Construction / Quality Division</div>
                </div>
                <div className="pl-2">
                  <div className="font-bold text-slate-700">REVIEWED BY (CONSULTANT):</div>
                  <div className="mt-4 font-mono font-bold text-emerald-800">{data.reviewer || data.consultantInspector || 'Eng. Tariq Al-Mansoor'}</div>
                  <div className="text-[9px] text-slate-400">Senior Resident Engineer / Sign & Stamp</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>APEX DC GENERATED OFFICIAL DOCUMENT • ISO 9001 / ISO 19650 COMPLIANT</span>
              <span>TIMESTAMP: {new Date().toISOString()} • PAGE 1 OF 1</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
