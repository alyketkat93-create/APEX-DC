'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { QualityRecord, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  ShieldAlert, Plus, Search, Download, Upload, Printer, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, FileSpreadsheet, Eye, X
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function QualityView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<QualityRecord | null>(null);

  // New NCR Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('NCR (Non-Conformance Report)');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-Firefighting');
  const [newLocation, setNewLocation] = useState('Laydown Yard 2, Warehouse 4B');
  const [newParty, setNewParty] = useState('Al-Jazira Industrial Supplies');
  const [newSeverity, setNewSeverity] = useState<'Minor' | 'Major' | 'Critical'>('Major');
  const [newDesc, setNewDesc] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newCorrective, setNewCorrective] = useState('');
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

  const fetchQuality = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quality?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data);
      }
    } catch (e) {
      console.error('Error fetching quality records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuality();
  }, [currentProjectId]);

  const generateNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'NCR',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating NCR number', e);
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

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          recordNumber: generatedDocNum,
          recordType: newType,
          title: newTitle,
          discipline: newDiscipline,
          location: newLocation,
          responsibleParty: newParty,
          severity: newSeverity,
          description: newDesc,
          rootCause: newRootCause,
          correctiveAction: newCorrective,
          status: 'Open',
          issueDate: newDates.submissionDate || todayIso(),
          dueDate: newDates.requiredApprovalDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchQuality();
      }
    } catch (err) {
      alert('Error creating QA/QC record');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map((r, index) => {
      const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 10);
      return {
        '#': index + 1,
        'Record Number': r.recordNumber,
        'Type': r.recordType,
        'Title': r.title,
        'Discipline': r.discipline,
        'Location': r.location,
        'Responsible Party': r.responsibleParty,
        'Severity': r.severity,
        'Status': r.status,
        'SLA Turnaround': sla.label,
        'Preparation Date': r.preparationDate || 'N/A',
        'Submission Date': r.submissionDate || 'N/A',
        'Consultant Response Date': r.consultantResponseDate || 'N/A',
        'Closure Date': r.closureDate || 'N/A',
        'Issue Date': r.issueDate,
        'Due Date': r.dueDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quality_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_QUALITY_REGISTER.xlsx`);
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = searchQuery === '' || 
      r.recordNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.responsibleParty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || r.recordType.includes(typeFilter);
    const matchSeverity = severityFilter === 'ALL' || r.severity === severityFilter;

    let matchSla = true;
    const sla = calculateSlaStatus(r, currentProject?.reviewDurationDays || 10);
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

    return matchSearch && matchType && matchSeverity && matchSla && matchDateFilter;
  });

  const slaStats = {
    total: records.length,
    awaiting: records.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 10).category === 'AWAITING_SUBMISSION').length,
    pending: records.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 10).category === 'PENDING_REVIEW').length,
    overdue: records.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 10).category === 'OVERDUE').length,
    approved: records.filter(r => calculateSlaStatus(r, currentProject?.reviewDurationDays || 10).category === 'APPROVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل الجودة وحالات عدم المطابقة (QA/QC & NCR)' : 'Quality Assurance & Non-Conformance (NCR / CAR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
              {filteredRecords.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            NCRs, root-cause analyses, CARs, ITPs & 8-point SLA turnaround tracking
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'تقرير عدم مطابقة جديد' : 'Raise NCR'}</span>
          </button>
        </div>
      </div>

      {/* Quick SLA Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
          {language === 'ar' ? 'تصفية المهل والاعتماد:' : 'SLA Filter:'}
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
          {language === 'ar' ? 'مفتوح قيد المعالجة' : 'Open / Pending'} ({slaStats.pending})
        </button>
        <button
          onClick={() => setSlaFilter('OVERDUE')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          ⚠️ {language === 'ar' ? 'متأخر عن الإغلاق' : 'Overdue Closeout'} ({slaStats.overdue})
        </button>
        <button
          onClick={() => setSlaFilter('APPROVED')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          ✓ {language === 'ar' ? 'مغلق ومطابق' : 'Closed & Verified'} ({slaStats.approved})
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
            placeholder="Search NCR number, title, party, or location..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Quality Record Types</option>
          <option value="NCR">NCR (Non-Conformance)</option>
          <option value="CAR">CAR (Corrective Action)</option>
          <option value="ITP">ITP (Inspection & Test Plan)</option>
          <option value="Pressure">Pressure Test Reports</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
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

      {/* Quality Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Record Number</th>
                <th className="py-3 px-3">Title & Type</th>
                <th className="py-3 px-3">Location & Party</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Issue / Due Date</th>
                <th className="py-3 px-3">Workflow Status</th>
                <th className="py-3 px-3">Turnaround SLA</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No quality records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setDrawerOpen(true);
                        }}
                        className="hover:text-red-700 hover:underline text-left"
                      >
                        {r.recordNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{r.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{r.recordType} • {r.discipline}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{r.responsibleParty}</div>
                      <div className="text-[10px] text-slate-400">{r.location}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.severity === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                        r.severity === 'Major' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {r.severity}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-slate-700">Issued: <b>{formatDateSafe(r.submissionDate || r.issueDate)}</b></span>
                        <span className="text-slate-400 text-[10px]">Due: {formatDateSafe(r.requiredApprovalDate || r.dueDate)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        r.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Open' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Turnaround SLA */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <DateStatusBadge dates={r} slaDays={currentProject?.reviewDurationDays || 10} />
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="View 8-Point Dates Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Print Formal NCR Form"
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

      {/* Drawer for Selected Quality Record */}
      {drawerOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-red-400">
                    {selectedRecord.recordNumber}
                  </div>
                  <h2 className="text-sm font-bold truncate max-w-md mt-0.5">
                    {selectedRecord.title}
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
                  dates={selectedRecord} 
                  slaDays={currentProject?.reviewDurationDays || 10} 
                  moduleId="quality"
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.recordNumber}
                  allowEdit={true}
                  onDatesUpdated={(updated) => {
                    setSelectedRecord(prev => prev ? { ...prev, ...updated } : null);
                    fetchQuality();
                  }}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="quality"
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.recordNumber}
                  documentLinks={selectedRecord.documentLinks || []}
                  linkedApexRecords={selectedRecord.linkedApexRecords || []}
                  legacyAttachments={selectedRecord.attachments}
                  legacyFileUrl={selectedRecord.fileUrl}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedRecord(updated);
                    fetchQuality();
                  }}
                  language={language}
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                    Defect & Corrective Action Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Responsible Party</span>
                      <span className="font-semibold text-slate-800">{selectedRecord.responsibleParty}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Location</span>
                      <span className="font-semibold text-slate-800">{selectedRecord.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Severity</span>
                      <span className="font-bold text-red-800">{selectedRecord.severity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Status</span>
                      <span className="font-bold text-slate-800">{selectedRecord.status}</span>
                    </div>
                  </div>
                  {selectedRecord.correctiveAction && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Corrective Action Plan</span>
                      <p className="text-slate-800 mt-1 leading-relaxed">{selectedRecord.correctiveAction}</p>
                    </div>
                  )}
                </div>

                {/* Immutable Audit Trail for this Quality Record */}
                <RecordAuditHistory
                  recordId={selectedRecord.id}
                  recordRef={selectedRecord.recordNumber}
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
                  Print NCR
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
                <h3 className="font-bold text-sm">Raise Quality Non-Conformance Report (NCR)</h3>
                <div className="text-[11px] text-slate-300">Defect documentation, root cause analysis & 8-point date tracking</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated NCR Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title of Non-Conformance</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Non-Compliant Grooved Coupling Gasket Installed on Fire Main"
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
                    <option value="MEP-Firefighting">MEP-Firefighting</option>
                    <option value="MEP-HVAC">MEP-HVAC</option>
                    <option value="MEP-Plumbing">MEP-Plumbing</option>
                    <option value="MEP-Electrical">MEP-Electrical</option>
                    <option value="Civil & Structural">Civil & Structural</option>
                    <option value="Architectural">Architectural</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Minor">Minor (Rectify without structural impact)</option>
                    <option value="Major">Major (Defect requires formal engineering CAR)</option>
                    <option value="Critical">Critical (Immediate stop-work order)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location of Defect</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsible Subcontractor / Party</label>
                  <input
                    type="text"
                    value={newParty}
                    onChange={(e) => setNewParty(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Defect Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  rows={2}
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
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Issue Formal NCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Modal */}
      <PrintableDocumentModal
        docType="NCR_FORM"
        title="NON-CONFORMANCE REPORT (NCR / CAR)"
        data={selectedRecord}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
