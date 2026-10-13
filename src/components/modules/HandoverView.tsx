'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { HandoverItem } from '@/types';
import * as XLSX from 'xlsx';
import { 
  PackageCheck, Plus, Search, Download, CheckCircle2, 
  Clock, ShieldCheck, FileCheck, Layers, BookOpen, Wrench,
  AlertTriangle, X, Eye, ArrowRight, Building2, Calendar
} from 'lucide-react';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function HandoverView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [items, setItems] = useState<HandoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Drawer / Selection
  const [selectedItem, setSelectedItem] = useState<HandoverItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<any>('As-Built Drawing');
  const [newDiscipline, setNewDiscipline] = useState<any>('MEP-HVAC');
  const [newSystem, setNewSystem] = useState('Central Chiller Plant');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [newZone, setNewZone] = useState('Energy Center B3');
  const [newOriginalDoc, setNewOriginalDoc] = useState('APX-KSP-03-MEP-HVAC-0042-P02');
  const [newPkgRef, setNewPkgRef] = useState('PKG-HO-HVAC-CHW');
  const [newPercent, setNewPercent] = useState<number>(100);
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  // 8 Mandatory Lifecycle Dates
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

  const fetchHandover = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/handover?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (e) {
      console.error('Error fetching handover items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandover();
  }, [currentProjectId]);

  // Set default building when project loads
  useEffect(() => {
    if (currentProject?.buildings && currentProject.buildings.length > 0) {
      setSelectedBuilding(currentProject.buildings[0].name);
      if (currentProject.buildings[0].floors && currentProject.buildings[0].floors.length > 0) {
        setSelectedFloor(currentProject.buildings[0].floors[0]);
      }
    }
  }, [currentProject]);

  const activeBuildingObj = currentProject?.buildings?.find(b => b.name === selectedBuilding);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'HO',
          discipline: 'CLOSE',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating HO number', e);
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

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const buildingZoneText = selectedBuilding 
      ? (selectedFloor ? `${selectedBuilding} - ${selectedFloor}` : selectedBuilding)
      : newZone;

    try {
      const res = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          itemNumber: generatedDocNum,
          category: newCategory,
          title: newTitle,
          discipline: newDiscipline,
          system: newSystem,
          buildingZone: buildingZoneText,
          originalDocRef: newOriginalDoc,
          latestRevision: '00',
          siteVerificationStatus: 'Verified on Site',
          qaQcVerificationStatus: 'Verified',
          consultantReviewStatus: 'Approved',
          approvalStatus: 'Approved',
          handoverPackageRef: newPkgRef,
          completionPercent: newPercent,
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        fetchHandover();
      }
    } catch (err) {
      alert('Error creating handover item');
    }
  };

  const handleUpdateItemStatus = async (item: HandoverItem, status: 'Approved' | 'Handed Over') => {
    try {
      const updates: any = {
        id: item.id,
        approvalStatus: status,
        consultantReviewStatus: 'Approved',
        completionPercent: status === 'Handed Over' ? 100 : item.completionPercent,
      };

      const res = await fetch('/api/handover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedItem(json.data);
        fetchHandover();
      }
    } catch (err) {
      alert('Error updating handover item');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredItems.map((h, index) => {
      const sla = calculateSlaStatus(h, currentProject?.reviewDurationDays || 14);
      return {
        '#': index + 1,
        'Item Number': h.itemNumber,
        'Category': h.category,
        'Title': h.title,
        'Discipline': h.discipline,
        'Package Ref': h.handoverPackageRef,
        'Zone / Location': h.buildingZone,
        'Original Ref': h.originalDocRef || 'N/A',
        'Completion %': `${h.completionPercent}%`,
        'Approval Status': h.approvalStatus,
        'Consultant Review': h.consultantReviewStatus,
        'Site Verification': h.siteVerificationStatus,
        'SLA Turnaround': sla.label,
        'Preparation Date': h.preparationDate || 'N/A',
        'Internal Review Date': h.internalReviewDate || 'N/A',
        'Submission Date': h.submissionDate || 'N/A',
        'Consultant Receipt Date': h.consultantReceiptDate || 'N/A',
        'Consultant Response Date': h.consultantResponseDate || 'N/A',
        'Approval Date': h.approvalDate || 'N/A',
        'Revision Date': h.revisionDate || 'N/A',
        'Closure Date': h.closureDate || 'N/A',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Handover_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_HANDOVER_LIFECYCLE_REGISTER.xlsx`);
  };

  // Average completion percentage
  const avgCompletion = items.length > 0 
    ? Math.round(items.reduce((acc, curr) => acc + curr.completionPercent, 0) / items.length)
    : 0;

  const filteredItems = items.filter(h => {
    const matchSearch = searchQuery === '' ||
      h.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.handoverPackageRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || h.category === categoryFilter;

    const sla = calculateSlaStatus(h, currentProject?.reviewDurationDays || 14);
    let matchSla = true;
    if (slaFilter === 'AWAITING') matchSla = sla.status === 'AWAITING_SUBMISSION';
    else if (slaFilter === 'PENDING') matchSla = sla.status === 'PENDING_REVIEW';
    else if (slaFilter === 'OVERDUE') matchSla = sla.status === 'OVERDUE';
    else if (slaFilter === 'APPROVED') matchSla = sla.status === 'APPROVED' || sla.status === 'CLOSED';

    let matchDateFilter = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDateFilter = !h.submissionDate || (!h.approvalDate && !h.closureDate && !h.consultantResponseDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDateFilter = Boolean(h.hasDateCorrections || (h.dateCorrectionHistory && h.dateCorrectionHistory.length > 0));
    } else if (dateFilter === 'WITH_LINKS') {
      matchDateFilter = Boolean((h.documentLinks && h.documentLinks.length > 0) || (h.linkedApexRecords && h.linkedApexRecords.length > 0));
    }

    return matchSearch && matchCat && matchSla && matchDateFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل المخططات المنفذة والتسليم النهائي (As-Built & Handover Dossier)' : 'As-Built Documentation & Handover Closeout'}
            </h2>
            <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              {avgCompletion}% Dossier Complete
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            As-built drawing registers, O&M manuals, warranty certificates, TAB testing & authority closeout with 8-point lifecycle tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إضافة وثيقة تسليم' : 'New Closeout Record'}</span>
          </button>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
          <span>Overall Project Handover Package Readiness</span>
          <span className="font-mono text-emerald-700">{avgCompletion}% Complete ({items.filter(i => i.approvalStatus === 'Handed Over').length}/{items.length} Handed Over)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div 
            style={{ width: `${avgCompletion}%` }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* Quick SLA & Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setSlaFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${slaFilter === 'ALL' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'جميع ملفات التسليم' : 'All Handover Items'} ({items.length})
        </button>
        <button
          onClick={() => setSlaFilter('AWAITING')}
          className={`px-3 py-1.5 rounded-lg transition ${slaFilter === 'AWAITING' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'في انتظار الإرسال' : 'Awaiting Submission'}
        </button>
        <button
          onClick={() => setSlaFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition ${slaFilter === 'PENDING' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          {language === 'ar' ? 'قيد مراجعة الاستشاري' : 'Pending Consultant Review'}
        </button>
        <button
          onClick={() => setSlaFilter('OVERDUE')}
          className={`px-3 py-1.5 rounded-lg transition ${slaFilter === 'OVERDUE' ? 'bg-red-700 text-white font-bold' : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'}`}
        >
          {language === 'ar' ? '⚠️ متأخرة عن المدة التعاقدية' : '⚠️ Overdue Turnaround'}
        </button>
        <button
          onClick={() => setSlaFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-lg transition ${slaFilter === 'APPROVED' ? 'bg-emerald-700 text-white font-bold' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'}`}
        >
          {language === 'ar' ? '✓ معتمدة ومسلمة' : '✓ Approved / Handed Over'}
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
            placeholder="Search handover item number, title, package ref..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Closeout Categories</option>
          <option value="As-Built Drawing">As-Built Drawings</option>
          <option value="O&M Manual">O&M Manuals</option>
          <option value="Warranty Certificate">Warranty Certificates</option>
          <option value="Testing & Commissioning Report">T&C Reports</option>
          <option value="TAB Report (Testing Adjusting Balancing)">TAB Balancing Reports</option>
          <option value="Civil Defense / Municipality Approval">Civil Defense / Authority</option>
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
                <th className="py-3 px-3">Item Number</th>
                <th className="py-3 px-3">Title & Category</th>
                <th className="py-3 px-3">Discipline & Package</th>
                <th className="py-3 px-3">Zone / Location</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Approval Date</th>
                <th className="py-3 px-3">Turnaround / SLA</th>
                <th className="py-3 px-3 text-center">Progress %</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No handover records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((h) => {
                  const sla = calculateSlaStatus(h, currentProject?.reviewDurationDays || 14);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition group">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {h.itemNumber}
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{h.title}</div>
                        <div className="text-[11px] text-slate-500">{h.category}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <div className="font-semibold">{h.discipline}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{h.handoverPackageRef}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                        {h.buildingZone || 'Whole Project'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {h.submissionDate ? formatDateSafe(h.submissionDate) : '—'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {h.approvalDate ? formatDateSafe(h.approvalDate) : '—'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <DateStatusBadge sla={sla} />
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                        <span className="text-emerald-700">{h.completionPercent}%</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          h.approvalStatus === 'Handed Over' ? 'bg-emerald-100 text-emerald-800' :
                          h.approvalStatus === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {h.approvalStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedItem(h); setDrawerOpen(true); }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Dates</span>
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

      {/* Slide-over Drawer for Item Details and 8 Dates */}
      {drawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="bg-[#0F2744] text-white p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded font-bold">
                      {selectedItem.itemNumber}
                    </span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-2">{selectedItem.title}</h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* 8-Point Lifecycle Card */}
                <DateLifecycleCard 
                  dates={selectedItem} 
                  slaDays={currentProject?.reviewDurationDays || 14} 
                  moduleId="handover"
                  recordId={selectedItem.id}
                  recordRef={selectedItem.itemNumber}
                  allowEdit={true}
                  onDatesUpdated={(updated) => {
                    setSelectedItem(prev => prev ? { ...prev, ...updated } : null);
                    fetchHandover();
                  }}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="handover"
                  recordId={selectedItem.id}
                  recordRef={selectedItem.itemNumber}
                  documentLinks={selectedItem.documentLinks || []}
                  linkedApexRecords={selectedItem.linkedApexRecords || []}
                  legacyAttachments={selectedItem.attachments}
                  legacyFileUrl={selectedItem.fileUrl}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedItem(updated);
                    fetchHandover();
                  }}
                  language={language}
                />

                {/* Handover Dossier Attributes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dossier Handover Package Specifications</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Discipline</span>
                      <span className="font-semibold">{selectedItem.discipline}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">System</span>
                      <span className="font-semibold">{selectedItem.system || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Building / Floor</span>
                      <span className="font-semibold">{selectedItem.buildingZone || 'Whole Project'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Package Reference</span>
                      <span className="font-mono font-semibold">{selectedItem.handoverPackageRef}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Original Shop Drawing</span>
                      <span className="font-mono font-semibold">{selectedItem.originalDocRef || 'Direct Dossier'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Site Verification</span>
                      <span className="font-bold text-emerald-700">{selectedItem.siteVerificationStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Dossier Progress Completion</span>
                      <span className="font-mono text-emerald-700">{selectedItem.completionPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        style={{ width: `${selectedItem.completionPercent}%` }}
                        className="bg-emerald-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Workflow Action Buttons */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Execute Workflow Action</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateItemStatus(selectedItem, 'Approved')}
                      disabled={selectedItem.approvalStatus === 'Approved' || selectedItem.approvalStatus === 'Handed Over'}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition"
                    >
                      ✓ Stamp Consultant Approval
                    </button>
                    <button
                      onClick={() => handleUpdateItemStatus(selectedItem, 'Handed Over')}
                      disabled={selectedItem.approvalStatus === 'Handed Over'}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 transition"
                    >
                      🏆 Final Closeout & Handover
                    </button>
                  </div>
                </div>

                {/* Immutable Audit Trail for this Handover Item */}
                <RecordAuditHistory
                  recordId={selectedItem.id}
                  recordRef={selectedItem.itemNumber}
                  projectId={currentProjectId}
                  language={language}
                />
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

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-[#0F2744] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Add As-Built / Handover Dossier Item</h3>
                <div className="text-[11px] text-slate-300">Link to original approved shop drawings & track 8 lifecycle dates</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateHandover} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generated Handover Ref</label>
                  <input
                    type="text"
                    value={generatedDocNum}
                    onChange={(e) => setGeneratedDocNum(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="As-Built Drawing">As-Built Drawing</option>
                    <option value="O&M Manual">O&M Manual</option>
                    <option value="Warranty Certificate">Warranty Certificate</option>
                    <option value="Testing & Commissioning Report">T&C Report</option>
                    <option value="TAB Report (Testing Adjusting Balancing)">TAB Balancing Report</option>
                    <option value="Civil Defense / Municipality Approval">Civil Defense / Authority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Substation 01 Transformer Room As-Built Layout"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              {/* Building & Floor Selector (dynamically connected to Project details) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Building / Zone</span>
                  </label>
                  {currentProject?.buildings && currentProject.buildings.length > 0 ? (
                    <select
                      value={selectedBuilding}
                      onChange={(e) => {
                        setSelectedBuilding(e.target.value);
                        const bObj = currentProject.buildings?.find(b => b.name === e.target.value);
                        if (bObj && bObj.floors && bObj.floors.length > 0) {
                          setSelectedFloor(bObj.floors[0]);
                        } else {
                          setSelectedFloor('');
                        }
                      }}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-semibold"
                    >
                      {currentProject.buildings.map(b => (
                        <option key={b.id} value={b.name}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      placeholder="e.g. Energy Center B3"
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floor / Level</label>
                  {activeBuildingObj && activeBuildingObj.floors && activeBuildingObj.floors.length > 0 ? (
                    <select
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-semibold"
                    >
                      {activeBuildingObj.floors.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(e.target.value)}
                      placeholder="e.g. Basement Level 3"
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Linked Original Drawing Ref</label>
                  <input
                    type="text"
                    value={newOriginalDoc}
                    onChange={(e) => setNewOriginalDoc(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Handover Package Ref</label>
                  <input
                    type="text"
                    value={newPkgRef}
                    onChange={(e) => setNewPkgRef(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 8-Point Mandatory Date Tracking Inputs */}
              <DateInputsFormSection
                dates={newDates}
                onChange={setNewDates}
                requireSubmissionDate={true}
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
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs active:scale-95"
                >
                  Save Handover Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
