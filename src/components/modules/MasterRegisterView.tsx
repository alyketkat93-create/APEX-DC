'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Search, Download, Filter, Eye, 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Layers,
  Calendar, ShieldCheck, X, ExternalLink
} from 'lucide-react';
import { DateStatusBadge, DateLifecycleCard } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe } from '@/lib/dateUtils';

interface MasterRegisterViewProps {
  onNavigateModule: (mod: string) => void;
}

export function MasterRegisterView({ onNavigateModule }: MasterRegisterViewProps) {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [masterRecords, setMasterRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Saved Views
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED' | 'CLOSED'>('ALL');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Drawer / Selection
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMasterRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-register?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMasterRecords(json.data);
      }
    } catch (e) {
      console.error('Error fetching master document register', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterRegister();
  }, [currentProjectId]);

  const exportToExcel = () => {
    const exportData = filteredRecords.map((r, index) => {
      const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 14);
      return {
        '#': index + 1,
        'Module': r.module,
        'Document Number': r.docNumber,
        'Title': r.title,
        'Discipline': r.discipline,
        'Type': r.type,
        'Revision': r.currentRevision,
        'Review Status': r.status,
        'SLA Turnaround': sla.label,
        'Originator': r.originator,
        'Recipient': r.recipient,
        'Preparation Date': r.preparationDate || 'N/A',
        'Internal Review Date': r.internalReviewDate || 'N/A',
        'Submission Date': r.submissionDate || 'N/A',
        'Consultant Receipt Date': r.consultantReceiptDate || 'N/A',
        'Consultant Response Date': r.consultantResponseDate || 'N/A',
        'Approval Date': r.approvalDate || 'N/A',
        'Revision Date': r.revisionDate || 'N/A',
        'Closure Date': r.closureDate || 'N/A',
        'Linked Transmittal': r.relatedTransmittalId || 'N/A',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Document_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_MDR_CONSOLIDATED_REGISTER.xlsx`);
  };

  const filteredRecords = masterRecords.filter(r => {
    const matchSearch = searchQuery === '' ||
      r.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.originator && r.originator.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiscipline = disciplineFilter === 'ALL' || r.discipline === disciplineFilter;
    const matchModule = moduleFilter === 'ALL' || r.moduleKey === moduleFilter;

    const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 14);
    let matchView = true;
    if (activeView === 'AWAITING') {
      matchView = sla.status === 'AWAITING_SUBMISSION';
    } else if (activeView === 'PENDING') {
      matchView = sla.status === 'PENDING_REVIEW';
    } else if (activeView === 'APPROVED') {
      matchView = sla.status === 'APPROVED' || r.status.includes('Approved') || r.status === 'Accepted';
    } else if (activeView === 'OVERDUE') {
      matchView = sla.status === 'OVERDUE';
    } else if (activeView === 'CLOSED') {
      matchView = sla.status === 'CLOSED' || r.status === 'Closed' || r.status === 'Handed Over';
    }

    let matchDateFilter = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDateFilter = !r.submissionDate || (!r.approvalDate && !r.closureDate && !r.consultantResponseDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDateFilter = Boolean(r.hasDateCorrections || (r.dateCorrectionHistory && r.dateCorrectionHistory.length > 0));
    } else if (dateFilter === 'WITH_LINKS') {
      matchDateFilter = Boolean((r.documentLinks && r.documentLinks.length > 0) || (r.linkedApexRecords && r.linkedApexRecords.length > 0));
    }

    return matchSearch && matchDiscipline && matchModule && matchView && matchDateFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'السجل العام للمستندات (Master Document Register - MDR)' : 'Master Document Register (MDR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredRecords.length} / {masterRecords.length} Records Consolidated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single unified source of truth consolidating drawings, transmittals, submittals, IRs, MIRs, correspondence, quality, and handover records with mandatory 8-point date tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Master Register</span>
          </button>
        </div>
      </div>

      {/* Saved Views Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveView('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'ALL' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'جميع الوثائق' : 'All Project Records'} ({masterRecords.length})
        </button>
        <button
          onClick={() => setActiveView('AWAITING')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'AWAITING' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'في انتظار الإرسال' : 'Awaiting Submission'}
        </button>
        <button
          onClick={() => setActiveView('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'PENDING' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'قيد مراجعة الاستشاري' : 'Pending Consultant Review'}
        </button>
        <button
          onClick={() => setActiveView('OVERDUE')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'OVERDUE' ? 'bg-red-700 text-white font-bold' : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'}`}
        >
          {language === 'ar' ? '⚠️ تجاوز المدة المحددة (Overdue)' : '⚠️ Overdue Response SLA'}
        </button>
        <button
          onClick={() => setActiveView('APPROVED')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'APPROVED' ? 'bg-emerald-700 text-white font-bold' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'}`}
        >
          {language === 'ar' ? '✓ معتمدة (كود A و B)' : '✓ Approved / Accepted'}
        </button>
        <button
          onClick={() => setActiveView('CLOSED')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'CLOSED' ? 'bg-slate-800 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'مغلقة ومسلمة' : 'Closed / Handed Over'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master register by document number, title, or originator..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Modules</option>
          <option value="drawings">Drawings & Submissions</option>
          <option value="submittals">Technical Submittals</option>
          <option value="irs">Inspection Requests (IR)</option>
          <option value="mirs">Material Inspections (MIR)</option>
          <option value="rfis">RFIs</option>
          <option value="correspondence">Official Letters</option>
          <option value="quality">Quality & NCRs</option>
          <option value="handover">Handover & As-Built</option>
        </select>

        <select
          value={disciplineFilter}
          onChange={(e) => setDisciplineFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Disciplines</option>
          <option value="MEP-HVAC">HVAC</option>
          <option value="MEP-Plumbing">Plumbing</option>
          <option value="MEP-Firefighting">Firefighting</option>
          <option value="MEP-Electrical">Electrical</option>
          <option value="MEP-LowCurrent">Low Current</option>
          <option value="Architectural">Architectural</option>
          <option value="Structural">Structural</option>
          <option value="QA/QC">QA/QC</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Date Records</option>
          <option value="MISSING_DATES">Missing Critical Dates</option>
          <option value="CORRECTED_DATES">Historical Date Corrections</option>
          <option value="WITH_LINKS">With External Links / Records</option>
        </select>
      </div>

      {/* Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Document Number</th>
                <th className="py-3 px-3">Document Title</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3 text-center">Rev</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Approval Date</th>
                <th className="py-3 px-3">Turnaround / SLA</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No documents found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => {
                  const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 14);
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition group">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                          {r.module}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.docNumber}
                      </td>

                      <td className="py-3 px-3 max-w-xs font-semibold text-slate-800 line-clamp-1">
                        {r.title}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                        {r.discipline}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                        {r.currentRevision || '00'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status.includes('Approved') || r.status === 'Accepted' || r.status === 'Handed Over' ? 'bg-emerald-100 text-emerald-800' :
                          r.status.includes('Review') || r.status.includes('Submitted') || r.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                          r.status.includes('Rejected') ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                        {r.submissionDate ? formatDateSafe(r.submissionDate) : '—'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                        {r.approvalDate ? formatDateSafe(r.approvalDate) : '—'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <DateStatusBadge sla={sla} />
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => { setSelectedRecord(r); setDrawerOpen(true); }}
                          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[11px] transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dates</span>
                        </button>
                        <button
                          onClick={() => onNavigateModule(r.moduleKey)}
                          className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded text-[11px] transition"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer for 8 Dates & Document Traceability */}
      {drawerOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="bg-[#0F2744] text-white p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded font-bold">
                      {selectedRecord.docNumber}
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded font-semibold">
                      {selectedRecord.module}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-2">{selectedRecord.title}</h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* 8-Point Mandatory Date Lifecycle Card */}
                <DateLifecycleCard 
                  dates={selectedRecord} 
                  slaDays={currentProject?.reviewDurationDays || 14} 
                  moduleId={selectedRecord.moduleKey}
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.docNumber}
                  allowEdit={true}
                  onDatesUpdated={(updated) => {
                    setSelectedRecord((prev: any) => prev ? { ...prev, ...updated } : null);
                    fetchMasterRegister();
                  }}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId={selectedRecord.moduleKey}
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.docNumber}
                  documentLinks={selectedRecord.documentLinks || []}
                  linkedApexRecords={selectedRecord.linkedApexRecords || []}
                  legacyAttachments={selectedRecord.attachments}
                  legacyFileUrl={selectedRecord.fileUrl}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedRecord((prev: any) => ({ ...prev, ...updated }));
                    fetchMasterRegister();
                  }}
                  language={language}
                />

                {/* Metadata & Originator Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Document Metadata & Stakeholder Routing</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Discipline</span>
                      <span className="font-semibold">{selectedRecord.discipline}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Document Type</span>
                      <span className="font-semibold">{selectedRecord.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Originator</span>
                      <span className="font-semibold">{selectedRecord.originator || 'APEX Technical Office'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Reviewer / Recipient</span>
                      <span className="font-semibold">{selectedRecord.recipient || 'Consultant'}</span>
                    </div>
                    {selectedRecord.relatedTransmittalId && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Formal Transmittal</span>
                        <span className="font-mono font-bold text-emerald-700">{selectedRecord.relatedTransmittalId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Immutable Audit Trail for this Record */}
                <RecordAuditHistory
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.docNumber}
                  projectId={currentProjectId}
                  language={language}
                />

                {/* Action button to open dedicated screen */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onNavigateModule(selectedRecord.moduleKey);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-lg transition shadow-xs"
                  >
                    <span>Open in Dedicated {selectedRecord.module} Screen</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
