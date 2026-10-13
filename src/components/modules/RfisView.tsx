'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Rfi, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  HelpCircle, Plus, Search, Download, Clock, AlertTriangle, 
  CheckCircle2, DollarSign, Calendar, FileText, Eye, X
} from 'lucide-react';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function RfisView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRfi, setSelectedRfi] = useState<Rfi | null>(null);

  // Form State
  const [newSubject, setNewSubject] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newLocation, setNewLocation] = useState('Energy Center B3');
  const [newDwgRef, setNewDwgRef] = useState('');
  const [newPriority, setNewPriority] = useState<any>('High');
  const [newCostImpact, setNewCostImpact] = useState(false);
  const [newScheduleImpact, setNewScheduleImpact] = useState(true);
  const [generatedDocNum, setGeneratedDocNum] = useState('');
  const [newDates, setNewDates] = useState({
    preparationDate: todayIso(),
    internalReviewDate: '',
    submissionDate: todayIso(),
    plannedSubmissionDate: todayIso(),
    consultantReceiptDate: '',
    consultantResponseDate: '',
    requiredApprovalDate: '',
    approvalDate: '',
    revisionDate: todayIso(),
    closureDate: '',
  });

  // Response Form State
  const [consultantReply, setConsultantReply] = useState('');

  const fetchRfis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfis?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRfis(json.data);
      }
    } catch (e) {
      console.error('Error fetching RFIs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfis();
  }, [currentProjectId]);

  const generateNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'RFI',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating RFI number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber(newDiscipline);
    setNewDates({
      preparationDate: todayIso(),
      internalReviewDate: '',
      submissionDate: todayIso(),
      plannedSubmissionDate: todayIso(),
      consultantReceiptDate: '',
      consultantResponseDate: '',
      requiredApprovalDate: '',
      approvalDate: '',
      revisionDate: todayIso(),
      closureDate: '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateRfi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim()) return;

    try {
      const res = await fetch('/api/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          rfiNumber: generatedDocNum,
          subject: newSubject,
          technicalQuestion: newQuestion,
          discipline: newDiscipline,
          location: newLocation,
          drawingRefs: newDwgRef,
          originator: 'Eng. Hisham Al-Husseini (MEP CM)',
          recipient: 'Dar Al-Handasah Structural Lead',
          dateRaised: newDates.submissionDate || todayIso(),
          requiredResponseDate: newDates.requiredApprovalDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          priority: newPriority,
          potentialCostImpact: newCostImpact,
          potentialScheduleImpact: newScheduleImpact,
          status: 'Open',
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewSubject('');
        setNewQuestion('');
        fetchRfis();
      }
    } catch (err) {
      alert('Error creating RFI');
    }
  };

  const handleRecordResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfi) return;

    try {
      const res = await fetch('/api/rfis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRfi.id,
          consultantResponse: consultantReply,
          status: 'Answered',
          actualResponseDate: todayIso(),
          consultantResponseDate: todayIso(),
          closureDate: todayIso(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResponseModalOpen(false);
        fetchRfis();
      }
    } catch (err) {
      alert('Error recording RFI response');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRfis.map((r, index) => {
      const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 7);
      return {
        '#': index + 1,
        'RFI Number': r.rfiNumber,
        'Subject': r.subject,
        'Discipline': r.discipline,
        'Date Raised': r.dateRaised,
        'Required Date': r.requiredResponseDate,
        'Priority': r.priority,
        'Cost Impact': r.potentialCostImpact ? 'YES' : 'NO',
        'Schedule Impact': r.potentialScheduleImpact ? 'YES' : 'NO',
        'Status': r.status,
        'SLA Turnaround': sla.label,
        'Preparation Date': r.preparationDate || 'N/A',
        'Submission Date': r.submissionDate || 'N/A',
        'Consultant Response Date': r.consultantResponseDate || 'N/A',
        'Response': r.consultantResponse || 'Pending',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFI_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_RFI_REGISTER.xlsx`);
  };

  const filteredRfis = rfis.filter(r => {
    const matchSearch = searchQuery === '' || 
      r.rfiNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technicalQuestion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

    let matchSla = true;
    const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 7);
    if (slaFilter === 'AWAITING') matchSla = sla.category === 'AWAITING_SUBMISSION';
    else if (slaFilter === 'PENDING') matchSla = sla.category === 'PENDING_REVIEW';
    else if (slaFilter === 'OVERDUE') matchSla = sla.category === 'OVERDUE';
    else if (slaFilter === 'APPROVED') matchSla = sla.category === 'APPROVED';

    let matchDateFilter = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDateFilter = !r.submissionDate || (!r.approvalDate && !r.closureDate && !r.consultantResponseDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDateFilter = Boolean(r.hasDateCorrections || (r.dateCorrectionHistory && r.dateCorrectionHistory.length > 0));
    } else if (dateFilter === 'WITH_LINKS') {
      matchDateFilter = Boolean((r.documentLinks && r.documentLinks.length > 0) || (r.linkedApexRecords && r.linkedApexRecords.length > 0));
    }

    return matchSearch && matchStatus && matchSla && matchDateFilter;
  });

  const slaStats = {
    total: rfis.length,
    awaiting: rfis.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 7).category === 'AWAITING_SUBMISSION').length,
    pending: rfis.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 7).category === 'PENDING_REVIEW').length,
    overdue: rfis.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 7).category === 'OVERDUE').length,
    approved: rfis.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 7).category === 'APPROVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل طلبات الاستفسار الفني (RFI)' : 'Requests for Information (RFI) Register'}
            </h2>
            <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
              {filteredRfis.length} Queries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical queries, schedule & cost impact indicators, response aging & 8-point SLA turnaround
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'استفسار جديد' : 'Raise RFI'}</span>
          </button>
        </div>
      </div>

      {/* Quick SLA Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
          {language === 'ar' ? 'تصفية المهل والردود:' : 'SLA Filter:'}
        </span>
        <button
          onClick={() => setSlaFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ar' ? 'الكل' : 'All'} ({slaStats.total})
        </button>
        <button
          onClick={() => setSlaFilter('PENDING')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          {language === 'ar' ? 'بانتظار رد الاستشاري' : 'Pending Response'} ({slaStats.pending})
        </button>
        <button
          onClick={() => setSlaFilter('OVERDUE')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          ⚠️ {language === 'ar' ? 'متأخر الرد' : 'Overdue Response'} ({slaStats.overdue})
        </button>
        <button
          onClick={() => setSlaFilter('APPROVED')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          ✓ {language === 'ar' ? 'تمت الإجابة / مغلق' : 'Answered / Closed'} ({slaStats.approved})
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
            placeholder="Search RFI number, technical question, subject..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All RFI Statuses</option>
          <option value="Open">Open (Pending Reply)</option>
          <option value="Answered">Answered</option>
          <option value="Closed">Closed</option>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">RFI Number</th>
                <th className="py-3 px-3">Subject & Technical Query</th>
                <th className="py-3 px-3">Discipline & Location</th>
                <th className="py-3 px-3">Impact Flags</th>
                <th className="py-3 px-3">Raised / Target Dates</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Turnaround SLA</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRfis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No requests for information found.
                  </td>
                </tr>
              ) : (
                filteredRfis.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRfi(r);
                          setDrawerOpen(true);
                        }}
                        className="hover:text-indigo-700 hover:underline text-left"
                      >
                        {r.rfiNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{r.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{r.technicalQuestion}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{r.discipline}</div>
                      <div className="text-[10px] text-slate-400">{r.location}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {r.potentialCostImpact && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                            Cost
                          </span>
                        )}
                        {r.potentialScheduleImpact && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-300">
                            Time
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-slate-700">Raised: <b>{formatDateSafe(r.submissionDate || r.dateRaised)}</b></span>
                        <span className="text-slate-400 text-[10px]">Due: {formatDateSafe(r.requiredApprovalDate || r.requiredResponseDate)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        r.status === 'Answered' || r.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Turnaround SLA */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <DateStatusBadge dates={r} slaDays={currentProject?.reviewDurationDays || 7} />
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedRfi(r);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="View 8-Point Dates Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRfi(r);
                            setConsultantReply(r.consultantResponse || '');
                            setResponseModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition"
                        >
                          {r.consultantResponse ? 'Edit Reply' : 'Record Reply'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for Selected RFI */}
      {drawerOpen && selectedRfi && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-indigo-400">
                    {selectedRfi.rfiNumber}
                  </div>
                  <h2 className="text-sm font-bold truncate max-w-md mt-0.5">
                    {selectedRfi.subject}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <DateLifecycleCard 
                  dates={selectedRfi} 
                  slaDays={currentProject?.reviewDurationDays || 7} 
                  moduleId="rfis"
                  recordId={selectedRfi.id}
                  recordRef={selectedRfi.rfiNumber}
                  allowEdit={true}
                  onDatesUpdated={(updated) => {
                    setSelectedRfi(prev => prev ? { ...prev, ...updated } : null);
                    fetchRfis();
                  }}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="rfis"
                  recordId={selectedRfi.id}
                  recordRef={selectedRfi.rfiNumber}
                  documentLinks={selectedRfi.documentLinks || []}
                  linkedApexRecords={selectedRfi.linkedApexRecords || []}
                  legacyAttachments={selectedRfi.attachments}
                  legacyFileUrl={selectedRfi.fileUrl}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedRfi(updated);
                    fetchRfis();
                  }}
                  language={language}
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                    Query Specifics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Originator</span>
                      <span className="font-semibold text-slate-800">{selectedRfi.originator}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recipient</span>
                      <span className="font-semibold text-slate-800">{selectedRfi.recipient}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Location</span>
                      <span className="font-semibold text-slate-800">{selectedRfi.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Drawing Reference</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedRfi.drawingRefs || 'General'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Technical Question</span>
                    <p className="text-slate-800 mt-1 leading-relaxed bg-white p-3 rounded border border-slate-200">
                      {selectedRfi.technicalQuestion}
                    </p>
                  </div>
                  {selectedRfi.consultantResponse && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-emerald-600 font-bold block text-[10px]">Consultant Formal Response</span>
                      <p className="text-slate-800 mt-1 leading-relaxed bg-emerald-50/40 p-3 rounded border border-emerald-200">
                        {selectedRfi.consultantResponse}
                      </p>
                    </div>
                  )}
                </div>

                {/* Immutable Audit Trail for this RFI */}
                <RecordAuditHistory
                  recordId={selectedRfi.id}
                  recordRef={selectedRfi.rfiNumber}
                  projectId={currentProjectId}
                  language={language}
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-1.5 rounded bg-navy-900 text-white font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Raise Technical Request for Information (RFI)</h3>
                <div className="text-[11px] text-slate-300">Contractual clarification & 8-point date tracking</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRfi} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated RFI Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Clash between 500mm Chilled Water Pipe and Structural Transfer Beam B-12"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discipline</label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => {
                      const disc = e.target.value as Discipline;
                      setNewDiscipline(disc);
                      generateNumber(disc);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    <option value="MEP-HVAC">MEP-HVAC</option>
                    <option value="MEP-Firefighting">MEP-Firefighting</option>
                    <option value="MEP-Plumbing">MEP-Plumbing</option>
                    <option value="MEP-Electrical">MEP-Electrical</option>
                    <option value="Structural">Structural</option>
                    <option value="Architectural">Architectural</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Zone</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Question & Proposed Solution</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Describe the discrepancy, clash, or request for confirmation in detail..."
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  rows={3}
                  required
                />
              </div>

              {/* 8-Point Dates */}
              <DateInputsFormSection
                dates={newDates}
                onChange={setNewDates}
              />

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Submit RFI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Response Modal */}
      {responseModalOpen && selectedRfi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Record Consultant Response</h3>
                <div className="text-[11px] text-slate-300 font-mono">{selectedRfi.rfiNumber}</div>
              </div>
              <button onClick={() => setResponseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordResponse} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultant Response & Directions</label>
                <textarea
                  value={consultantReply}
                  onChange={(e) => setConsultantReply(e.target.value)}
                  placeholder="Enter consultant reply, sketches references, or design variance approval..."
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResponseModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save & Close RFI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
