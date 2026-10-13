'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Correspondence, Discipline, DocumentLifecycleDates } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Mail, Plus, Search, Download, Upload, Printer, 
  Send, Inbox, FileText, CheckCircle2, Clock, ShieldAlert, ArrowUpRight, Eye, X
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function CorrespondenceView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [letters, setLetters] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Correspondence | null>(null);

  // Form State
  const [newDirection, setNewDirection] = useState<'Outgoing' | 'Incoming'>('Outgoing');
  const [newSubject, setNewSubject] = useState('');
  const [newRecipient, setNewRecipient] = useState('Dar Al-Handasah Consultants');
  const [newSender, setNewSender] = useState('APEX Engineering & Construction JV');
  const [newClause, setNewClause] = useState('FIDIC Cl. 1.9 (Delayed Instructions)');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newBody, setNewBody] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');
  const [newDates, setNewDates] = useState<DocumentLifecycleDates>({
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

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/correspondence?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLetters(json.data);
      }
    } catch (e) {
      console.error('Error fetching correspondence', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentProjectId]);

  const generateNumber = async (dir: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'COR',
          discipline: dir === 'Outgoing' ? 'OUT' : 'INC',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating letter number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber(newDirection);
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

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const res = await fetch('/api/correspondence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          correspondenceNumber: generatedDocNum,
          direction: newDirection,
          letterRef: `${generatedDocNum}/2026`,
          letterDate: newDates.submissionDate || todayIso(),
          receivedDispatchedDate: newDates.submissionDate || todayIso(),
          sender: newSender,
          recipient: newRecipient,
          subject: newSubject,
          discipline: newDiscipline,
          contractClauseRef: newClause,
          responsiblePerson: 'Eng. Aly Ketkat',
          responseDeadline: newDates.requiredApprovalDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Dispatched',
          confidentiality: 'Normal',
          letterBody: newBody || 'Please find enclosed formal technical communication regarding project site operations.',
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewSubject('');
        setNewBody('');
        fetchLetters();
      }
    } catch (err) {
      alert('Error recording letter');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredLetters.map((l, index) => {
      const sla = calculateSlaStatus(l, currentProject?.reviewDurationDays || 7);
      return {
        '#': index + 1,
        'Number': l.correspondenceNumber,
        'Direction': l.direction,
        'Date': l.letterDate,
        'Sender': l.sender,
        'Recipient': l.recipient,
        'Subject': l.subject,
        'Clause': l.contractClauseRef || 'N/A',
        'Status': l.status,
        'SLA Turnaround': sla.label,
        'Preparation Date': l.preparationDate || 'N/A',
        'Submission Date': l.submissionDate || 'N/A',
        'Consultant Response Date': l.consultantResponseDate || 'N/A',
        'Closure Date': l.closureDate || 'N/A',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Correspondence_Log');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_CORRESPONDENCE_LOG.xlsx`);
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = searchQuery === '' || 
      l.correspondenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDir = directionFilter === 'ALL' || l.direction === directionFilter;

    let matchSla = true;
    const sla = calculateSlaStatus(l, currentProject?.reviewDurationDays || 7);
    if (slaFilter === 'AWAITING') matchSla = sla.category === 'AWAITING_SUBMISSION';
    else if (slaFilter === 'PENDING') matchSla = sla.category === 'PENDING_REVIEW';
    else if (slaFilter === 'OVERDUE') matchSla = sla.category === 'OVERDUE';
    else if (slaFilter === 'APPROVED') matchSla = sla.category === 'APPROVED';

    let matchDate = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDate = !l.submissionDate || !l.preparationDate || (l.status === 'Closed' && !l.closureDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDate = !!l.hasDateCorrections || (!!l.dateCorrectionHistory && l.dateCorrectionHistory.length > 0);
    } else if (dateFilter === 'WITH_LINKS') {
      matchDate = (!!l.documentLinks && l.documentLinks.length > 0) || (!!l.linkedApexRecords && l.linkedApexRecords.length > 0);
    }

    return matchSearch && matchDir && matchSla && matchDate;
  });

  const slaStats = {
    total: letters.length,
    awaiting: letters.filter(l => calculateSlaStatus(l, currentProject?.reviewDurationDays || 7).category === 'AWAITING_SUBMISSION').length,
    pending: letters.filter(l => calculateSlaStatus(l, currentProject?.reviewDurationDays || 7).category === 'PENDING_REVIEW').length,
    overdue: letters.filter(l => calculateSlaStatus(l, currentProject?.reviewDurationDays || 7).category === 'OVERDUE').length,
    approved: letters.filter(l => calculateSlaStatus(l, currentProject?.reviewDurationDays || 7).category === 'APPROVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل الخطابات والمراسلات الفنية الرسمية' : 'Technical Correspondence & Official Letters'}
            </h2>
            <span className="font-mono text-xs font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
              {filteredLetters.length} Letters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming & outgoing contractual communications, notices, FIDIC clauses & 8-point SLA turnaround
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إنشاء خطاب جديد' : 'New Letter'}</span>
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
          {language === 'ar' ? 'بانتظار الرد' : 'Pending Response'} ({slaStats.pending})
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
          ✓ {language === 'ar' ? 'تم الرد / مغلق' : 'Replied / Closed'} ({slaStats.approved})
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
            placeholder="Search letters by number, subject, sender, or recipient..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Directions</option>
          <option value="Outgoing">Outgoing (صادر)</option>
          <option value="Incoming">Incoming (وارد)</option>
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
                <th className="py-3 px-3">Letter Number</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Subject & Scope</th>
                <th className="py-3 px-3">Sender & Recipient</th>
                <th className="py-3 px-3">Sent / Response Dates</th>
                <th className="py-3 px-3">Contract Clause</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Turnaround SLA</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No correspondence records found.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLetter(l);
                          setDrawerOpen(true);
                        }}
                        className="hover:text-sky-700 hover:underline text-left"
                      >
                        {l.correspondenceNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        l.direction === 'Outgoing' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {l.direction === 'Outgoing' ? <Send className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
                        <span>{l.direction}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{l.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{l.discipline} • Ref: {l.letterRef}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <div className="font-semibold text-slate-800">{l.recipient}</div>
                      <div className="text-[10px] text-slate-400">From: {l.sender}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-slate-700">Sent: <b>{formatDateSafe(l.submissionDate || l.letterDate)}</b></span>
                        <span className="text-slate-400 text-[10px]">Due: {formatDateSafe(l.requiredApprovalDate || l.responseDeadline)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {l.contractClauseRef || 'General Terms'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        l.status === 'Responded' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>

                    {/* Turnaround SLA */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <DateStatusBadge dates={l} reviewDurationDays={currentProject?.reviewDurationDays || 7} />
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedLetter(l);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="View 8-Point Dates Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLetter(l);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Print Letterhead"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Drawer for Selected Letter */}
      {drawerOpen && selectedLetter && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-sky-400">
                    {selectedLetter.correspondenceNumber}
                  </div>
                  <h2 className="text-sm font-bold truncate max-w-md mt-0.5">
                    {selectedLetter.subject}
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
                  dates={selectedLetter} 
                  reviewDurationDays={currentProject?.reviewDurationDays || 7}
                  moduleId="correspondence"
                  recordId={selectedLetter.id}
                  recordRef={selectedLetter.correspondenceNumber}
                  onDatesUpdated={(updated) => {
                    setSelectedLetter(updated);
                    fetchLetters();
                  }}
                  language={language}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="correspondence"
                  recordId={selectedLetter.id}
                  recordRef={selectedLetter.correspondenceNumber}
                  documentLinks={selectedLetter.documentLinks || []}
                  linkedApexRecords={selectedLetter.linkedApexRecords || []}
                  legacyAttachments={selectedLetter.attachments || []}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedLetter(updated);
                    fetchLetters();
                  }}
                  language={language}
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                    Letter Particulars
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sender</span>
                      <span className="font-semibold text-slate-800">{selectedLetter.sender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recipient</span>
                      <span className="font-semibold text-slate-800">{selectedLetter.recipient}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contract Clause</span>
                      <span className="font-semibold text-slate-800">{selectedLetter.contractClauseRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Direction</span>
                      <span className="font-bold text-slate-800">{selectedLetter.direction}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Letter Content</span>
                    <p className="text-slate-800 mt-1 leading-relaxed bg-white p-3 rounded border border-slate-200">
                      {selectedLetter.letterBody}
                    </p>
                  </div>
                </div>

                {/* Immutable Audit Trail for this Letter */}
                <RecordAuditHistory
                  recordId={selectedLetter.id}
                  recordRef={selectedLetter.correspondenceNumber}
                  projectId={currentProjectId}
                  language={language}
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setPrintModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Print Letter
                </button>
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
                <h3 className="font-bold text-sm">Create Technical Correspondence Letter</h3>
                <div className="text-[11px] text-slate-300">Contractual communication & 8-point date tracking</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLetter} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Direction</label>
                  <select
                    value={newDirection}
                    onChange={(e) => {
                      const dir = e.target.value as any;
                      setNewDirection(dir);
                      generateNumber(dir);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Outgoing">Outgoing (صادر المقاول)</option>
                    <option value="Incoming">Incoming (وارد الاستشاري/المالك)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generated Letter Number</label>
                  <input
                    type="text"
                    value={generatedDocNum}
                    onChange={(e) => setGeneratedDocNum(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Letter Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Formal Notification Regarding Impact of Delayed Consultant Inspection at Zone B3"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient</label>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Clause Reference</label>
                  <input
                    type="text"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Letter Body</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Enter detailed formal letter narrative..."
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  rows={3}
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
                  className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Record & Issue Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Letterhead Modal */}
      <PrintableDocumentModal
        docType="LETTER_HEAD"
        title="FORMAL CONTRACTUAL CORRESPONDENCE LETTER"
        data={selectedLetter}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
