'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { MaterialInspectionRequest } from '@/types';
import * as XLSX from 'xlsx';
import { 
  PackageCheck, Plus, Search, Download, Upload, Printer, 
  CheckCircle2, AlertTriangle, ShieldAlert, Layers, MapPin, Eye, X
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function MaterialInspectionsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [mirs, setMirs] = useState<MaterialInspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMir, setSelectedMir] = useState<MaterialInspectionRequest | null>(null);

  // New MIR Form State
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Fire Protection Piping');
  const [newManufacturer, setNewManufacturer] = useState('Jindal Saw / Arabian Pipes');
  const [newSupplier, setNewSupplier] = useState('Al-Jazira Industrial Supplies');
  const [newSubmittalRef, setNewSubmittalRef] = useState('APX-KSP-03-MEP-MAT-0018-00');
  const [newDeliveryNote, setNewDeliveryNote] = useState('DN-2026-9912');
  const [newDeliveredQty, setNewDeliveredQty] = useState<number>(1000);
  const [newAcceptedQty, setNewAcceptedQty] = useState<number>(950);
  const [newRejectedQty, setNewRejectedQty] = useState<number>(50);
  const [newUnit, setNewUnit] = useState('Linear Meters');
  const [newNcrRef, setNewNcrRef] = useState('APX-KSP-03-QAQC-NCR-0014');
  const [newRemarks, setNewRemarks] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');
  const [newDates, setNewDates] = useState({
    preparationDate: todayIso(),
    internalReviewDate: '',
    submissionDate: todayIso(),
    plannedSubmissionDate: todayIso(),
    consultantReceiptDate: '',
    consultantResponseDate: '',
    approvalDate: '',
    revisionDate: todayIso(),
    closureDate: '',
  });

  const fetchMirs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mirs?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMirs(json.data);
      }
    } catch (e) {
      console.error('Error fetching MIRs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMirs();
  }, [currentProjectId]);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'MIR',
          discipline: 'MEP-FF',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating MIR number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setNewDates({
      preparationDate: todayIso(),
      internalReviewDate: '',
      submissionDate: todayIso(),
      plannedSubmissionDate: todayIso(),
      consultantReceiptDate: '',
      consultantResponseDate: '',
      approvalDate: '',
      revisionDate: todayIso(),
      closureDate: '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateMir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const pendingQty = Math.max(0, newDeliveredQty - newAcceptedQty - newRejectedQty);
    let result: any = 'Accepted';
    if (newRejectedQty > 0 && newAcceptedQty > 0) result = 'Partially Accepted';
    else if (newRejectedQty > 0 && newAcceptedQty === 0) result = 'Rejected';

    try {
      const res = await fetch('/api/mirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          mirNumber: generatedDocNum,
          materialCategory: newCategory,
          materialDescription: newDesc,
          manufacturer: newManufacturer,
          supplier: newSupplier,
          approvedSubmittalRef: newSubmittalRef,
          deliveryNoteNumber: newDeliveryNote,
          deliveryDate: newDates.submissionDate || todayIso(),
          deliveryLocation: 'Laydown Yard 2',
          storageLocation: 'Warehouse Bay 4B',
          quantityDelivered: newDeliveredQty,
          unitOfMeasure: newUnit,
          quantityInspected: newDeliveredQty,
          quantityAccepted: newAcceptedQty,
          quantityRejected: newRejectedQty,
          quantityPending: pendingQty,
          countryOfOrigin: 'Saudi Arabia',
          inspector: 'Eng. Sarah Al-Ghamdi',
          consultantRep: 'Eng. Tariq Al-Mansoor',
          result,
          ncrRef: newRejectedQty > 0 ? newNcrRef : undefined,
          remarks: newRemarks || (newRejectedQty > 0 ? `${newRejectedQty} units rejected due to damage. NCR linked.` : 'Inspected and verified against approved submittal.'),
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewDesc('');
        fetchMirs();
      }
    } catch (err) {
      alert('Error creating MIR record');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredMirs.map((m, index) => {
      const sla = calculateSlaStatus(m, currentProject?.reviewDurationDays || 7);
      return {
        '#': index + 1,
        'MIR Number': m.mirNumber,
        'Category': m.materialCategory,
        'Description': m.materialDescription,
        'Manufacturer': m.manufacturer,
        'Delivered': m.quantityDelivered,
        'Accepted': m.quantityAccepted,
        'Rejected': m.quantityRejected,
        'Unit': m.unitOfMeasure,
        'Submittal Ref': m.approvedSubmittalRef,
        'Result': m.result,
        'SLA Turnaround': sla.label,
        'Preparation Date': m.preparationDate || 'N/A',
        'Submission Date': m.submissionDate || 'N/A',
        'Consultant Response Date': m.consultantResponseDate || 'N/A',
        'Approval Date': m.approvalDate || 'N/A',
        'Linked NCR': m.ncrRef || 'None',
        'Delivery Date': m.deliveryDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MIR_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_MIR_REGISTER.xlsx`);
  };

  const filteredMirs = mirs.filter(m => {
    const matchSearch = searchQuery === '' || 
      m.mirNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchResult = resultFilter === 'ALL' || m.result === resultFilter;

    let matchSla = true;
    const sla = calculateSlaStatus(m, currentProject?.reviewDurationDays || 7);
    if (slaFilter === 'AWAITING') matchSla = sla.category === 'AWAITING_SUBMISSION';
    else if (slaFilter === 'PENDING') matchSla = sla.category === 'PENDING_REVIEW';
    else if (slaFilter === 'OVERDUE') matchSla = sla.category === 'OVERDUE';
    else if (slaFilter === 'APPROVED') matchSla = sla.category === 'APPROVED';

    let matchDate = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDate = !m.submissionDate || !m.preparationDate || (m.result === 'Accepted' && !m.approvalDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDate = !!m.hasDateCorrections || (!!m.dateCorrectionHistory && m.dateCorrectionHistory.length > 0);
    } else if (dateFilter === 'WITH_LINKS') {
      matchDate = (!!m.documentLinks && m.documentLinks.length > 0) || (!!m.linkedApexRecords && m.linkedApexRecords.length > 0);
    }

    return matchSearch && matchResult && matchSla && matchDate;
  });

  const slaStats = {
    total: mirs.length,
    awaiting: mirs.filter(m => calculateSlaStatus(m, currentProject?.reviewDurationDays || 7).category === 'AWAITING_SUBMISSION').length,
    pending: mirs.filter(m => calculateSlaStatus(m, currentProject?.reviewDurationDays || 7).category === 'PENDING_REVIEW').length,
    overdue: mirs.filter(m => calculateSlaStatus(m, currentProject?.reviewDurationDays || 7).category === 'OVERDUE').length,
    approved: mirs.filter(m => calculateSlaStatus(m, currentProject?.reviewDurationDays || 7).category === 'APPROVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل فحص وتوريد المواد بالموقع (MIR)' : 'Material Inspection Requests (MIR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredMirs.length} Consignments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Material deliveries, accepted vs rejected quantity tracking, MTC validation & 8-point SLA turnaround
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'طلب فحص مواد جديد' : 'New MIR'}</span>
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
          onClick={() => setSlaFilter('AWAITING')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'AWAITING' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ar' ? 'مسودة' : 'Draft'} ({slaStats.awaiting})
        </button>
        <button
          onClick={() => setSlaFilter('PENDING')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          {language === 'ar' ? 'قيد الفحص' : 'Under Inspection'} ({slaStats.pending})
        </button>
        <button
          onClick={() => setSlaFilter('OVERDUE')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          ⚠️ {language === 'ar' ? 'متأخر' : 'Overdue SLA'} ({slaStats.overdue})
        </button>
        <button
          onClick={() => setSlaFilter('APPROVED')}
          className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
            slaFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          ✓ {language === 'ar' ? 'مقبول / معتمد' : 'Accepted / Approved'} ({slaStats.approved})
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
            placeholder="Search MIR number, description, manufacturer, or delivery note..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Inspection Decisions</option>
          <option value="Accepted">Accepted</option>
          <option value="Partially Accepted">Partially Accepted</option>
          <option value="Rejected">Rejected</option>
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

      {/* MIR Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">MIR Number</th>
                <th className="py-3 px-3">Material Description</th>
                <th className="py-3 px-3">Manufacturer & Supplier</th>
                <th className="py-3 px-3">Delivery & Approval Dates</th>
                <th className="py-3 px-3 text-center">Quantities (Del / Acc / Rej)</th>
                <th className="py-3 px-3">Inspection Result</th>
                <th className="py-3 px-3">Turnaround SLA</th>
                <th className="py-3 px-3">Linked NCR</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMirs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No material inspection requests found.
                  </td>
                </tr>
              ) : (
                filteredMirs.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMir(m);
                          setDrawerOpen(true);
                        }}
                        className="hover:text-amber-700 hover:underline text-left"
                      >
                        {m.mirNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{m.materialDescription}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{m.materialCategory} • Ref: {m.approvedSubmittalRef}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold">{m.manufacturer}</div>
                      <div className="text-[10px] text-slate-400">{m.supplier}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-slate-700">DEL: <b>{formatDateSafe(m.submissionDate || m.deliveryDate)}</b></span>
                        {m.approvalDate ? (
                          <span className="text-emerald-700 font-semibold">APP: {formatDateSafe(m.approvalDate)}</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Due: {formatDateSafe(m.requiredApprovalDate)}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                      <span className="font-bold text-slate-800">{m.quantityDelivered}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-bold text-emerald-700">{m.quantityAccepted}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className={`font-bold ${m.quantityRejected > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                        {m.quantityRejected}
                      </span>
                      <div className="text-[10px] text-slate-500 font-sans">{m.unitOfMeasure}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        m.result === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        m.result === 'Partially Accepted' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {m.result}
                      </span>
                    </td>

                    {/* Turnaround SLA */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <DateStatusBadge dates={m} slaDays={currentProject?.reviewDurationDays || 7} />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {m.ncrRef ? (
                        <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {m.ncrRef}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedMir(m);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="View 8-Point Dates Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMir(m);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Print MIR Sheet"
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

      {/* Drawer for Selected MIR */}
      {drawerOpen && selectedMir && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-amber-400">
                    {selectedMir.mirNumber}
                  </div>
                  <h2 className="text-sm font-bold truncate max-w-md mt-0.5">
                    {selectedMir.materialDescription}
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
                  dates={selectedMir} 
                  slaDays={currentProject?.reviewDurationDays || 7}
                  moduleId="mirs"
                  recordId={selectedMir.id}
                  recordRef={selectedMir.mirNumber}
                  onDatesUpdated={(updated) => {
                    setSelectedMir(updated);
                    fetchMirs();
                  }}
                  language={language}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="mirs"
                  recordId={selectedMir.id}
                  recordRef={selectedMir.mirNumber}
                  documentLinks={selectedMir.documentLinks || []}
                  linkedApexRecords={selectedMir.linkedApexRecords || []}
                  legacyAttachments={selectedMir.attachments || []}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedMir(updated);
                    fetchMirs();
                  }}
                  language={language}
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                    Consignment Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Manufacturer</span>
                      <span className="font-semibold text-slate-800">{selectedMir.manufacturer}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Supplier</span>
                      <span className="font-semibold text-slate-800">{selectedMir.supplier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Approved Submittal</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedMir.approvedSubmittalRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Delivery Note</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedMir.deliveryNoteNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Immutable Audit Trail for this MIR */}
                <RecordAuditHistory
                  recordId={selectedMir.id}
                  recordRef={selectedMir.mirNumber}
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
                  Print MIR Slip
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
                <h3 className="font-bold text-sm">Material Inspection Request (MIR)</h3>
                <div className="text-[11px] text-slate-300">Incoming site delivery verification & 8-point date tracking</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMir} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated MIR Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Material Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Schedule 40 Seamless Carbon Steel Pipe 150mm Dia with MTC Certs"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Submittal Reference</label>
                  <input
                    type="text"
                    value={newSubmittalRef}
                    onChange={(e) => setNewSubmittalRef(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Note Number</label>
                  <input
                    type="text"
                    value={newDeliveryNote}
                    onChange={(e) => setNewDeliveryNote(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivered Qty</label>
                  <input
                    type="number"
                    value={newDeliveredQty}
                    onChange={(e) => setNewDeliveredQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    value={newAcceptedQty}
                    onChange={(e) => setNewAcceptedQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    value={newRejectedQty}
                    onChange={(e) => setNewRejectedQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
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
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold"
                >
                  Record Material Delivery & Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet Modal */}
      <PrintableDocumentModal
        docType="MIR_FORM"
        title="MATERIAL INSPECTION REQUEST & DELIVERY REPORT (MIR)"
        data={selectedMir}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
