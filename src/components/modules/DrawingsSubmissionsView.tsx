'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Drawing, Discipline, ReviewStatus, Transmittal } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Compass, SendHorizontal, Plus, Search, Filter, Download, Upload, 
  Printer, Eye, History, FileText, CheckCircle2, AlertCircle, 
  Clock, Shield, ArrowUpDown, ChevronRight, Layers, FileSpreadsheet, 
  Building2, Calendar, CheckSquare, X, ExternalLink, ArrowRight,
  TrendingUp, AlertTriangle, FileCheck2, BarChart2, Check
} from 'lucide-react';
import { DocumentViewerModal } from '@/components/common/DocumentViewerModal';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { ExcelImportModal } from '@/components/common/ExcelImportModal';
import { DateStatusBadge, DateLifecycleCard, DateInputsFormSection } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';
import { calculateSlaStatus, formatDateSafe, todayIso } from '@/lib/dateUtils';

export function DrawingsSubmissionsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'drawings' | 'transmittals' | 'sla_monitor'>('drawings');
  
  // Data states
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [transmittals, setTransmittals] = useState<Transmittal[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-selection state for creating transmittal
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
  
  // Drawing Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'AWAITING' | 'PENDING' | 'OVERDUE' | 'APPROVED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MISSING_DATES' | 'CORRECTED_DATES' | 'WITH_LINKS'>('ALL');

  // Transmittal Filters
  const [trSearchQuery, setTrSearchQuery] = useState('');
  const [trStatusFilter, setTrStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [createDrawingModalOpen, setCreateDrawingModalOpen] = useState(false);
  const [createTransmittalModalOpen, setCreateTransmittalModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTransmittalModalOpen, setPrintTransmittalModalOpen] = useState(false);
  const [viewTransmittalModalOpen, setViewTransmittalModalOpen] = useState(false);
  
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [selectedTransmittal, setSelectedTransmittal] = useState<Transmittal | null>(null);

  // New Drawing Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newSystem, setNewSystem] = useState('Chilled Water Plant');
  const [newZone, setNewZone] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [isCustomFloor, setIsCustomFloor] = useState(false);
  const [newType, setNewType] = useState<any>('Shop Drawing');
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

  // New Revision Form State
  const [revNumber, setRevNumber] = useState('P02');
  const [revStatus, setRevStatus] = useState<ReviewStatus>('Code B - Approved as Noted');
  const [revApprovalCode, setRevApprovalCode] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [revComments, setRevComments] = useState('');
  const [revReviewer, setRevReviewer] = useState('Eng. Tariq Al-Mansoor (Dar Al-Handasah)');
  const [revTransmittalNum, setRevTransmittalNum] = useState('');
  const [revDates, setRevDates] = useState({
    preparationDate: todayIso(),
    internalReviewDate: '',
    submissionDate: todayIso(),
    plannedSubmissionDate: '',
    consultantReceiptDate: '',
    consultantResponseDate: todayIso(),
    approvalDate: todayIso(),
    revisionDate: todayIso(),
    closureDate: '',
  });

  // New Transmittal Form State
  const [trNumber, setTrNumber] = useState('');
  const [trRecipient, setTrRecipient] = useState('Dar Al-Handasah Consultants');
  const [trPurpose, setTrPurpose] = useState<any>('For Approval');
  const [trAction, setTrAction] = useState('Review and return with approval code within 14 calendar days.');
  const [trDeliveryMethod, setTrDeliveryMethod] = useState('System Transmittal');
  const [trCategory, setTrCategory] = useState('Shop Drawings');
  const [trSubmissionDate, setTrSubmissionDate] = useState(todayIso());

  const fetchDrawings = async () => {
    try {
      const res = await fetch(`/api/drawings?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDrawings(json.data);
      }
    } catch (e) {
      console.error('Failed to load drawings', e);
    }
  };

  const fetchTransmittals = async () => {
    try {
      const res = await fetch(`/api/transmittals?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTransmittals(json.data);
      }
    } catch (e) {
      console.error('Failed to load transmittals', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchDrawings(), fetchTransmittals()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    setSelectedDrawingIds([]);
  }, [currentProjectId]);

  // Document Number Generator
  const generateDrawingNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'DWG',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(`${json.docNumber}-P01`);
      }
    } catch (e) {
      console.error('Error generating drawing number', e);
    }
  };

  const generateTransmittalNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'TR',
          discipline: 'DC',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setTrNumber(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating transmittal number', e);
    }
  };

  const handleOpenCreateDrawingModal = () => {
    generateDrawingNumber(newDiscipline);
    const initialZone = currentProject?.buildings?.[0]?.name || 'Energy Center B3';
    setNewZone(initialZone);
    const initialFloor = currentProject?.buildings?.[0]?.floors?.[0] || currentProject?.floors?.[0] || 'Basement Level 3';
    setNewFloor(initialFloor);
    setIsCustomZone(false);
    setIsCustomFloor(false);
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
    setCreateDrawingModalOpen(true);
  };

  const handleCreateDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          drawingNumber: generatedDocNum,
          title: newTitle,
          discipline: newDiscipline,
          system: newSystem,
          buildingZone: newZone,
          floorLevel: newFloor,
          drawingType: newType,
          originator: 'APEX Technical Office',
          currentRevision: 'P01',
          reviewStatus: 'Submitted to Consultant',
          reviewer: 'Consultant Supervising Lead',
          ...newDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateDrawingModalOpen(false);
        setNewTitle('');
        await loadAll();
      }
    } catch (err) {
      alert('Error creating drawing record');
    }
  };

  const handleOpenAddRevision = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    const nextRev = drawing.currentRevision.startsWith('P') 
      ? `P0${parseInt(drawing.currentRevision.replace('P', ''), 10) + 1 || 2}`
      : `Rev-0${(drawing.revisions?.length || 1) + 1}`;
    setRevNumber(nextRev);
    setRevStatus('Code B - Approved as Noted');
    setRevApprovalCode('B');
    setRevComments('');
    setRevTransmittalNum(drawing.relatedTransmittal || `TR-${Math.floor(1000 + Math.random() * 9000)}`);
    setRevDates({
      preparationDate: todayIso(),
      internalReviewDate: '',
      submissionDate: todayIso(),
      plannedSubmissionDate: '',
      consultantReceiptDate: '',
      consultantResponseDate: todayIso(),
      approvalDate: todayIso(),
      revisionDate: todayIso(),
      closureDate: '',
    });
    setRevisionModalOpen(true);
  };

  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrawing) return;

    try {
      const res = await fetch(`/api/drawings/${selectedDrawing.id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionNumber: revNumber,
          status: revStatus,
          approvalCode: revApprovalCode,
          comments: revComments,
          reviewer: revReviewer,
          transmittalNumber: revTransmittalNum,
          ...revDates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRevisionModalOpen(false);
        await loadAll();
        if (drawerOpen && selectedDrawing) {
          const updated = json.data;
          setSelectedDrawing(updated);
        }
      }
    } catch (err) {
      alert('Error recording drawing revision');
    }
  };

  // Open Transmittal creation pre-filled with selected drawings
  const handleOpenCreateTransmittal = async () => {
    await generateTransmittalNumber();
    setTrRecipient(currentProject?.consultant || 'Dar Al-Handasah Consultants');
    setTrSubmissionDate(todayIso());
    setCreateTransmittalModalOpen(true);
  };

  const handleCreateTransmittal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build document list from selected drawings or pre-filled items
      const selectedDrawingsList = drawings.filter(d => selectedDrawingIds.includes(d.id));
      const documentList = selectedDrawingsList.length > 0 
        ? selectedDrawingsList.map(d => ({
            docNumber: d.drawingNumber,
            docTitle: d.title,
            revision: d.currentRevision,
            format: 'PDF + DWG',
            purpose: trPurpose,
            discipline: d.discipline,
          }))
        : [
            {
              docNumber: drawings[0]?.drawingNumber || 'APX-DWG-001-P01',
              docTitle: drawings[0]?.title || 'General Layout Drawing',
              revision: drawings[0]?.currentRevision || 'P01',
              format: 'PDF + DWG',
              purpose: trPurpose,
              discipline: drawings[0]?.discipline || 'MEP-HVAC',
            }
          ];

      const res = await fetch('/api/transmittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          transmittalNumber: trNumber,
          category: trCategory,
          sender: currentProject?.mainContractor || 'APEX Engineering & Construction JV',
          recipient: trRecipient,
          submissionDate: trSubmissionDate,
          purpose: trPurpose,
          requiredAction: trAction,
          deliveryMethod: trDeliveryMethod,
          receiptAcknowledged: false,
          status: 'Issued / Dispatched',
          documentList,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateTransmittalModalOpen(false);
        setSelectedDrawingIds([]);
        await loadAll();
        setActiveTab('transmittals');
      }
    } catch (e) {
      alert('Error creating document transmittal');
    }
  };

  // Quick Action: Acknowledge Transmittal Receipt by Consultant
  const handleAcknowledgeReceipt = async (tr: Transmittal) => {
    try {
      const res = await fetch('/api/transmittals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tr.id,
          receiptAcknowledged: true,
          status: 'Received by Consultant',
          consultantReceiptDate: todayIso(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        await loadAll();
      }
    } catch (e) {
      alert('Error acknowledging transmittal receipt');
    }
  };

  // Selection toggle
  const toggleSelectDrawing = (id: string) => {
    setSelectedDrawingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDrawingIds.length === filteredDrawings.length) {
      setSelectedDrawingIds([]);
    } else {
      setSelectedDrawingIds(filteredDrawings.map(d => d.id));
    }
  };

  // Filtering Logic
  const filteredDrawings = drawings.filter(d => {
    const matchSearch = searchQuery === '' || 
      d.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.buildingZone && d.buildingZone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.floorLevel && d.floorLevel.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiscipline = disciplineFilter === 'ALL' || d.discipline === disciplineFilter;
    const matchStatus = statusFilter === 'ALL' || d.reviewStatus === statusFilter;
    const matchZone = zoneFilter === 'ALL' || d.buildingZone === zoneFilter || d.buildingZone?.toLowerCase().includes(zoneFilter.toLowerCase());
    const matchFloor = floorFilter === 'ALL' || d.floorLevel === floorFilter || d.floorLevel?.toLowerCase().includes(floorFilter.toLowerCase());
    
    // SLA Filter
    let matchSla = true;
    const sla = calculateSlaStatus(d, currentProject?.reviewDurationDays || 14);
    if (slaFilter === 'AWAITING') matchSla = sla.category === 'AWAITING_SUBMISSION';
    else if (slaFilter === 'PENDING') matchSla = sla.category === 'PENDING_REVIEW';
    else if (slaFilter === 'OVERDUE') matchSla = sla.category === 'OVERDUE';
    else if (slaFilter === 'APPROVED') matchSla = sla.category === 'APPROVED';

    // Date & Links Filter
    let matchDate = true;
    if (dateFilter === 'MISSING_DATES') {
      matchDate = !d.submissionDate || !d.preparationDate || (d.reviewStatus.includes('Approved') && !d.approvalDate);
    } else if (dateFilter === 'CORRECTED_DATES') {
      matchDate = !!d.hasDateCorrections || (!!d.dateCorrectionHistory && d.dateCorrectionHistory.length > 0);
    } else if (dateFilter === 'WITH_LINKS') {
      matchDate = (!!d.documentLinks && d.documentLinks.length > 0) || (!!d.linkedApexRecords && d.linkedApexRecords.length > 0);
    }

    return matchSearch && matchDiscipline && matchStatus && matchZone && matchFloor && matchSla && matchDate;
  });

  const filteredTransmittals = transmittals.filter(t => {
    const matchSearch = trSearchQuery === '' ||
      t.transmittalNumber.toLowerCase().includes(trSearchQuery.toLowerCase()) ||
      t.recipient.toLowerCase().includes(trSearchQuery.toLowerCase()) ||
      t.purpose.toLowerCase().includes(trSearchQuery.toLowerCase());
    const matchStatus = trStatusFilter === 'ALL' || t.status === trStatusFilter;
    return matchSearch && matchStatus;
  });

  // Excel Export
  const exportDrawingsToExcel = () => {
    const exportData = filteredDrawings.map((d, index) => {
      const sla = calculateSlaStatus(d, currentProject?.reviewDurationDays || 14);
      return {
        '#': index + 1,
        'Drawing Number': d.drawingNumber,
        'Title': d.title,
        'Discipline': d.discipline,
        'System': d.system,
        'Building / Zone': d.buildingZone,
        'Floor / Level': d.floorLevel,
        'Type': d.drawingType,
        'Revision': d.currentRevision,
        'Review Status': d.reviewStatus,
        'Approval Code': d.approvalCode || 'N/A',
        'SLA Turnaround': sla.label,
        'Preparation Date': d.preparationDate || 'N/A',
        'Submission Date': d.submissionDate || 'N/A',
        'Consultant Receipt Date': d.consultantReceiptDate || 'N/A',
        'Required SLA Deadline': d.requiredApprovalDate || 'N/A',
        'Consultant Response Date': d.consultantResponseDate || 'N/A',
        'Approval Date': d.approvalDate || 'N/A',
        'Revision Date': d.revisionDate || 'N/A',
        'Closure Date': d.closureDate || 'N/A',
        'Linked Transmittal': d.relatedTransmittal || 'N/A',
        'Reviewer': d.reviewer || 'N/A',
        'Comments': d.reviewComments || 'N/A',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drawings_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_DRAWINGS_SUBMISSIONS_REGISTER.xlsx`);
  };

  const exportTransmittalsToExcel = () => {
    const exportData = filteredTransmittals.map((t, index) => ({
      '#': index + 1,
      'Transmittal Number': t.transmittalNumber,
      'Date': t.transmittalDate || t.submissionDate,
      'Category': t.category,
      'Sender': t.sender,
      'Recipient': t.recipient,
      'Purpose': t.purpose,
      'Documents Count': t.documentList?.length || 0,
      'Receipt Acknowledged': t.receiptAcknowledged ? 'YES' : 'NO',
      'Consultant Receipt Date': t.consultantReceiptDate || 'N/A',
      'Status': t.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transmittals_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_TRANSMITTALS_REGISTER.xlsx`);
  };

  // SLA Stats
  const slaStats = {
    total: drawings.length,
    awaiting: drawings.filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'AWAITING_SUBMISSION').length,
    pending: drawings.filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'PENDING_REVIEW').length,
    overdue: drawings.filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'OVERDUE').length,
    approved: drawings.filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'APPROVED').length,
  };

  return (
    <div className="space-y-4">
      {/* Unified Module Header & Master Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{language === 'ar' ? 'المخططات والتسليمات الفنية' : 'Drawings & Document Submissions'}</span>
                  <span className="text-xs font-mono font-bold bg-navy-900 text-amber-400 px-2.5 py-0.5 rounded-full">
                    {drawings.length} Drawings • {transmittals.length} Transmittals
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar' 
                    ? 'إدارة متكاملة لسجل المخططات، الإصدارات، مذكرات الإرسال الرسمية ومتابعة المهل التعاقدية 8-Point Date Tracking' 
                    : 'Unified hub for Drawings, Revision History, Formal Transmittals, Dispatch Tracking & 8-Point SLA Engine'}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedDrawingIds.length > 0 && (
              <button
                onClick={handleOpenCreateTransmittal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm animate-pulse"
                title="Create formal transmittal slip from selected drawings"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? `إنشاء مذكرة إرسال (${selectedDrawingIds.length})` : `Create Transmittal (${selectedDrawingIds.length})`}</span>
              </button>
            )}

            <button
              onClick={handleOpenCreateDrawingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'ar' ? 'إضافة مخطط جديد' : 'New Drawing'}</span>
            </button>

            <button
              onClick={handleOpenCreateTransmittal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition shadow-xs active:scale-95"
            >
              <SendHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'مذكرة إرسال جديدة' : 'New Transmittal'}</span>
            </button>

            <button
              onClick={activeTab === 'drawings' ? exportDrawingsToExcel : exportTransmittalsToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
              title="Export Register to Excel with all 8 dates"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.exportExcel}</span>
            </button>

            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
              title="Import Drawings from Excel"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.importExcel}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('drawings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'drawings'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'سجل المخططات والمراجعات' : 'Drawing Register & Revisions'}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-navy-800 text-amber-300 border border-navy-700">
              {drawings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transmittals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'transmittals'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SendHorizontal className="w-4 h-4 text-teal-400" />
            <span>{language === 'ar' ? 'مذكرات إرسال المستندات (Transmittals)' : 'Formal Document Transmittals'}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-navy-800 text-teal-300 border border-navy-700">
              {transmittals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sla_monitor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'sla_monitor'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-400" />
            <span>{language === 'ar' ? 'متابعة المهل الزمنية والتأخيرات (SLA)' : 'Overdue & Turnaround SLA Monitor'}</span>
            {slaStats.overdue > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                {slaStats.overdue} Overdue
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DRAWINGS REGISTER & REVISIONS */}
      {/* ========================================================================= */}
      {activeTab === 'drawings' && (
        <div className="space-y-4">
          {/* Quick SLA Status Filter Pills */}
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
              {language === 'ar' ? 'بانتظار الإرسال (مسودة)' : 'Awaiting Submission'} ({slaStats.awaiting})
            </button>
            <button
              onClick={() => setSlaFilter('PENDING')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                slaFilter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {language === 'ar' ? 'قيد مراجعة الاستشاري' : 'Pending Consultant Review'} ({slaStats.pending})
            </button>
            <button
              onClick={() => setSlaFilter('OVERDUE')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                slaFilter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              ⚠️ {language === 'ar' ? 'تجاوزت المهلة التعاقدية (متأخر)' : 'Overdue Turnaround'} ({slaStats.overdue})
            </button>
            <button
              onClick={() => setSlaFilter('APPROVED')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                slaFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ✓ {language === 'ar' ? 'معتمد (Code A / B)' : 'Approved (Code A / B)'} ({slaStats.approved})
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by drawing number, title, or system..."
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Building / Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{language === 'ar' ? 'جميع المباني والمناطق' : 'All Buildings / Zones'}</option>
              {currentProject?.buildings?.map(b => (
                <option key={b.id} value={b.name}>
                  {b.code} — {language === 'ar' ? (b.nameAr || b.name) : b.name}
                </option>
              ))}
            </select>

            {/* Floor / Level Filter */}
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{language === 'ar' ? 'جميع الأدوار والمستويات' : 'All Floors / Levels'}</option>
              {currentProject?.floors?.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Discipline Filter */}
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Disciplines</option>
              <option value="MEP-HVAC">MEP - HVAC</option>
              <option value="MEP-Firefighting">MEP - Firefighting</option>
              <option value="MEP-Plumbing">MEP - Plumbing</option>
              <option value="MEP-Electrical">MEP - Electrical</option>
              <option value="MEP-ELV">MEP - Low Current (ELV)</option>
              <option value="Architectural">Architectural</option>
              <option value="Structural">Structural</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Review Statuses</option>
              <option value="Code A - Approved">Code A - Approved</option>
              <option value="Code B - Approved as Noted">Code B - Approved as Noted</option>
              <option value="Code C - Revise and Resubmit">Code C - Revise & Resubmit</option>
              <option value="Code D - Rejected">Code D - Rejected</option>
              <option value="Under Review">Under Review</option>
              <option value="Submitted to Consultant">Submitted to Consultant</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Date & Link Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Date & Link Records</option>
              <option value="MISSING_DATES">Missing Critical Dates</option>
              <option value="CORRECTED_DATES">Historical Date Corrections</option>
              <option value="WITH_LINKS">With External Links / Records</option>
            </select>
          </div>

          {/* Master Drawings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={filteredDrawings.length > 0 && selectedDrawingIds.length === filteredDrawings.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-400 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        title="Select All for Transmittal"
                      />
                    </th>
                    <th className="py-3 px-3">Drawing Number</th>
                    <th className="py-3 px-3">Title & System</th>
                    <th className="py-3 px-3">Zone / Floor</th>
                    <th className="py-3 px-3 text-center">Rev</th>
                    <th className="py-3 px-3">Submission & Turnaround Dates</th>
                    <th className="py-3 px-3">Review Status & Code</th>
                    <th className="py-3 px-3">Turnaround SLA</th>
                    <th className="py-3 px-3">Linked Transmittal</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrawings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No drawing records found matching the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDrawings.map((d) => {
                      const isSelected = selectedDrawingIds.includes(d.id);
                      return (
                        <tr 
                          key={d.id} 
                          className={`transition group ${isSelected ? 'bg-amber-50/60' : 'hover:bg-amber-50/20'}`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectDrawing(d.id)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Drawing Number */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedDrawing(d);
                                setDrawerOpen(true);
                              }}
                              className="text-left hover:text-amber-600 hover:underline flex items-center gap-1"
                              title="Click to view full 8-point date timeline & revisions"
                            >
                              <span>{d.drawingNumber}</span>
                            </button>
                            <div className="text-[10px] text-slate-500 font-sans font-semibold">
                              {d.discipline}
                            </div>
                          </td>

                          {/* Title & System */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-semibold text-slate-800 line-clamp-1">{d.title}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{d.system} • {d.drawingType}</div>
                          </td>

                          {/* Zone / Level */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{d.buildingZone}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{d.floorLevel}</span>
                              </span>
                            </div>
                          </td>

                          {/* Current Revision Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleOpenAddRevision(d)}
                              className="font-mono font-bold text-xs bg-navy-900 text-amber-300 px-2.5 py-0.5 rounded hover:bg-navy-800 transition shadow-2xs"
                              title="Click to add new revision (e.g. P02, C01)"
                            >
                              {d.currentRevision}
                            </button>
                          </td>

                          {/* Submission Date & Approval Date */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col text-[11px] leading-tight">
                              <span className="text-slate-700 flex items-center gap-1">
                                <span className="text-slate-400 font-mono text-[10px]">SUB:</span>
                                <span className="font-semibold">{formatDateSafe(d.submissionDate)}</span>
                              </span>
                              {d.approvalDate ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="text-emerald-500 font-mono text-[10px]">APP:</span>
                                  <span>{formatDateSafe(d.approvalDate)}</span>
                                </span>
                              ) : d.consultantResponseDate ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="text-amber-500 font-mono text-[10px]">RSP:</span>
                                  <span>{formatDateSafe(d.consultantResponseDate)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] mt-0.5">
                                  Target: {formatDateSafe(d.requiredApprovalDate)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Review Status & Approval Code */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              d.approvalCode === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              d.approvalCode === 'B' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              d.approvalCode === 'C' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              d.approvalCode === 'D' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {d.reviewStatus}
                            </span>
                          </td>

                          {/* Turnaround SLA Indicator */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <DateStatusBadge dates={d} slaDays={currentProject?.reviewDurationDays || 14} />
                          </td>

                          {/* Linked Transmittal Slip */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {d.relatedTransmittal ? (
                              <button
                                onClick={() => {
                                  const tr = transmittals.find(t => t.transmittalNumber === d.relatedTransmittal);
                                  if (tr) {
                                    setSelectedTransmittal(tr);
                                    setViewTransmittalModalOpen(true);
                                  } else {
                                    setActiveTab('transmittals');
                                    setTrSearchQuery(d.relatedTransmittal || '');
                                  }
                                }}
                                className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1"
                                title="Click to view linked transmittal dispatch slip"
                              >
                                <SendHorizontal className="w-3 h-3 text-teal-600" />
                                <span>{d.relatedTransmittal}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Direct / Pending TR</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedDrawing(d);
                                  setDrawerOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                                title="View 8-Point Dates & Revision Details Drawer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedDrawing(d);
                                  setViewerModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
                                title="Open CAD/PDF Drawing Viewer"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedDrawing(d);
                                  setPrintModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                                title="Print Formal Submittal Cover Sheet"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenAddRevision(d)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition"
                                title="Add Revision (P02, C01)"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORMAL DOCUMENT TRANSMITTALS */}
      {/* ========================================================================= */}
      {activeTab === 'transmittals' && (
        <div className="space-y-4">
          {/* Transmittals Filter Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={trSearchQuery}
                onChange={(e) => setTrSearchQuery(e.target.value)}
                placeholder="Search transmittal number, recipient, purpose..."
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={trStatusFilter}
              onChange={(e) => setTrStatusFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Transmittal Statuses</option>
              <option value="Issued / Dispatched">Issued / Dispatched</option>
              <option value="Received by Consultant">Received by Consultant</option>
              <option value="Under Review">Under Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Transmittals Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-3">Transmittal Number</th>
                    <th className="py-3 px-3">Date Sent</th>
                    <th className="py-3 px-3">Recipient & Purpose</th>
                    <th className="py-3 px-3 text-center">Docs Attached</th>
                    <th className="py-3 px-3">Receipt Acknowledgment</th>
                    <th className="py-3 px-3">Turnaround SLA</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransmittals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No transmittal records found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransmittals.map((tr) => (
                      <tr key={tr.id} className="hover:bg-amber-50/20 transition group">
                        {/* Number */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedTransmittal(tr);
                              setViewTransmittalModalOpen(true);
                            }}
                            className="text-left hover:text-teal-700 hover:underline flex items-center gap-1.5"
                          >
                            <SendHorizontal className="w-3.5 h-3.5 text-teal-600" />
                            <span>{tr.transmittalNumber}</span>
                          </button>
                          <div className="text-[10px] text-slate-500 font-sans">{tr.category}</div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatDateSafe(tr.transmittalDate || tr.submissionDate)}
                          </span>
                        </td>

                        {/* Recipient & Purpose */}
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-slate-800 line-clamp-1">{tr.recipient}</div>
                          <div className="text-[11px] text-slate-500">{tr.purpose} • {tr.deliveryMethod}</div>
                        </td>

                        {/* Attached Docs */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {tr.documentList?.length || 0} Docs
                          </span>
                        </td>

                        {/* Consultant Receipt */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {tr.receiptAcknowledged || tr.consultantReceiptDate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Received {formatDateSafe(tr.consultantReceiptDate)}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledgeReceipt(tr)}
                              className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition"
                              title="Click to stamp consultant receipt date & sync to drawings"
                            >
                              + Mark Acknowledged
                            </button>
                          )}
                        </td>

                        {/* Turnaround SLA */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <DateStatusBadge dates={tr} slaDays={currentProject?.reviewDurationDays || 14} />
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            tr.status === 'Issued / Dispatched' ? 'bg-blue-100 text-blue-800' :
                            tr.status === 'Received by Consultant' ? 'bg-teal-100 text-teal-800' :
                            tr.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                            tr.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tr.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedTransmittal(tr);
                                setViewTransmittalModalOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                              title="View Transmittal Document Bundle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedTransmittal(tr);
                                setPrintTransmittalModalOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                              title="Print Formal Transmittal Slip"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OVERDUE SLA & TURNAROUND MONITOR */}
      {/* ========================================================================= */}
      {activeTab === 'sla_monitor' && (
        <div className="space-y-4">
          {/* KPI Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'إجمالي المخططات قيد المراجعة' : 'Drawings Under Review'}
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{slaStats.pending}</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Contractual SLA: {currentProject?.reviewDurationDays || 14} days</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                {language === 'ar' ? 'المخططات المتأخرة عن المهلة' : 'Overdue Turnaround (> 14d)'}
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">{slaStats.overdue}</div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgent expediting action required</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                {language === 'ar' ? 'المخططات المعتمدة' : 'Approved (Code A / B)'}
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{slaStats.approved}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Released for Site Construction</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'بانتظار الإرسال (مسودة)' : 'Awaiting Submission'}
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{slaStats.awaiting}</div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                <SendHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <span>Bundle into Transmittal Slip</span>
              </div>
            </div>
          </div>

          {/* Overdue Items Alert List */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{language === 'ar' ? 'سجل المخططات المتأخرة ومتابعة الاستشاري' : 'Consultant Turnaround Overdue Register'}</span>
            </h3>

            {drawings.filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'OVERDUE').length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                ✓ No overdue drawings found! All consultant review turnarounds are within contractual SLA.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {drawings
                  .filter(d => calculateSlaStatus(d, currentProject?.reviewDurationDays || 14).category === 'OVERDUE')
                  .map(d => {
                    const sla = calculateSlaStatus(d, currentProject?.reviewDurationDays || 14);
                    return (
                      <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-rose-700">{d.drawingNumber}</span>
                            <span className="text-xs font-bold text-slate-800">{d.title}</span>
                            <span className="text-[10px] font-bold bg-navy-900 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                              Rev {d.currentRevision}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                            <span>Discipline: <b>{d.discipline}</b></span>
                            <span>Submitted: <b>{formatDateSafe(d.submissionDate)}</b></span>
                            <span>Target SLA: <b>{formatDateSafe(d.requiredApprovalDate)}</b></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            {sla.label}
                          </span>

                          <button
                            onClick={() => {
                              setSelectedDrawing(d);
                              handleOpenAddRevision(d);
                            }}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs rounded transition"
                          >
                            + Record Consultant Stamp
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: DRAWING DETAILS & 8-POINT DATE TIMELINE */}
      {/* ========================================================================= */}
      {drawerOpen && selectedDrawing && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-amber-400">
                    {selectedDrawing.drawingNumber}
                  </div>
                  <h2 className="text-sm font-bold truncate max-w-md mt-0.5">
                    {selectedDrawing.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* 8-Point Lifecycle Dates Card with Edit & History Support */}
                <DateLifecycleCard 
                  dates={selectedDrawing} 
                  slaDays={currentProject?.reviewDurationDays || 14}
                  moduleId="drawings"
                  recordId={selectedDrawing.id}
                  recordRef={selectedDrawing.drawingNumber}
                  onDatesUpdated={(updated) => {
                    setSelectedDrawing(updated);
                    loadAll();
                  }}
                  language={language}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="drawings"
                  recordId={selectedDrawing.id}
                  recordRef={selectedDrawing.drawingNumber}
                  documentLinks={selectedDrawing.documentLinks || []}
                  linkedApexRecords={selectedDrawing.linkedApexRecords || []}
                  legacyFileUrl={selectedDrawing.fileUrl}
                  legacyFileName={selectedDrawing.fileName}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedDrawing(updated);
                    loadAll();
                  }}
                  language={language}
                />

                {/* Technical Metadata */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                    {language === 'ar' ? 'البيانات الفنية للمخطط' : 'Engineering Metadata'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Discipline</span>
                      <span className="font-semibold text-slate-800">{selectedDrawing.discipline}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">System</span>
                      <span className="font-semibold text-slate-800">{selectedDrawing.system}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Building / Zone</span>
                      <span className="font-semibold text-slate-800">{selectedDrawing.buildingZone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Floor / Level</span>
                      <span className="font-semibold text-slate-800">{selectedDrawing.floorLevel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Drawing Type</span>
                      <span className="font-semibold text-slate-800">{selectedDrawing.drawingType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Active Revision</span>
                      <span className="font-mono font-bold text-amber-600">{selectedDrawing.currentRevision}</span>
                    </div>
                  </div>
                </div>

                {/* Revision History Timeline */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      {language === 'ar' ? 'سجل المراجعات التاريخي (Traceability)' : 'Complete Revision History'}
                    </h3>
                    <button
                      onClick={() => handleOpenAddRevision(selectedDrawing)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-[11px] rounded transition"
                    >
                      + Add Revision
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(selectedDrawing.revisions || []).map((rev, index) => (
                      <div key={rev.id || index} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-navy-900 text-amber-300 px-2 py-0.5 rounded">
                              Rev {rev.revisionNumber}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              rev.approvalCode === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              rev.approvalCode === 'B' ? 'bg-amber-100 text-amber-800' :
                              rev.approvalCode === 'C' ? 'bg-orange-100 text-orange-800' :
                              rev.approvalCode === 'D' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {rev.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatDateSafe(rev.submissionDate)}
                          </div>
                        </div>

                        {rev.comments && (
                          <div className="text-slate-700 mt-2 text-[11px] bg-white p-2 rounded border border-slate-100">
                            <b>Comments:</b> {rev.comments}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          <span>Reviewer: <b>{rev.reviewer || 'N/A'}</b></span>
                          {rev.transmittalNumber && (
                            <span>TR Slip: <b className="font-mono text-teal-700">{rev.transmittalNumber}</b></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immutable Audit Trail for this Drawing */}
                <RecordAuditHistory
                  recordId={selectedDrawing.id}
                  recordRef={selectedDrawing.drawingNumber}
                  projectId={currentProjectId}
                  language={language}
                />
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setViewerModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Open Viewer
                </button>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setPrintModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Print Cover Sheet
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

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW DRAWING */}
      {/* ========================================================================= */}
      {createDrawingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create New Shop / Engineering Drawing</h3>
                <div className="text-[11px] text-slate-300">Automatic project numbering & mandatory 8-point date tracking</div>
              </div>
              <button onClick={() => setCreateDrawingModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDrawing} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated Drawing Number (Controlled)</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Primary Chilled Water Pump Station Piping & Header Layout"
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
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
                      generateDrawingNumber(disc);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    <option value="MEP-HVAC">MEP - HVAC</option>
                    <option value="MEP-Firefighting">MEP - Firefighting</option>
                    <option value="MEP-Plumbing">MEP - Plumbing</option>
                    <option value="MEP-Electrical">MEP - Electrical</option>
                    <option value="MEP-ELV">MEP - Low Current (ELV)</option>
                    <option value="Architectural">Architectural</option>
                    <option value="Structural">Structural</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System / Service</label>
                  <input
                    type="text"
                    value={newSystem}
                    onChange={(e) => setNewSystem(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Building & Floor Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Building / Zone</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomZone(!isCustomZone)}
                      className="text-[10px] text-amber-700 hover:underline font-semibold"
                    >
                      {isCustomZone ? (language === 'ar' ? 'من القائمة' : 'From List') : (language === 'ar' ? '+ إدخال يدوي' : '+ Custom Zone')}
                    </button>
                  </div>
                  {isCustomZone ? (
                    <input
                      type="text"
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      placeholder="e.g. Energy Center B3"
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                      required
                    />
                  ) : (
                    <select
                      value={newZone}
                      onChange={(e) => {
                        const z = e.target.value;
                        setNewZone(z);
                        const bld = currentProject?.buildings?.find(b => b.name === z || b.code === z);
                        if (bld && bld.floors && bld.floors.length > 0) {
                          setNewFloor(bld.floors[0]);
                        }
                      }}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                      required
                    >
                      {currentProject?.buildings && currentProject.buildings.length > 0 ? (
                        currentProject.buildings.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.code} — {language === 'ar' ? (b.nameAr || b.name) : b.name}
                          </option>
                        ))
                      ) : (
                        <option value="Energy Center B3">Energy Center B3</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Floor / Level</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomFloor(!isCustomFloor)}
                      className="text-[10px] text-amber-700 hover:underline font-semibold"
                    >
                      {isCustomFloor ? (language === 'ar' ? 'من القائمة' : 'From List') : (language === 'ar' ? '+ إدخال يدوي' : '+ Custom Floor')}
                    </button>
                  </div>
                  {isCustomFloor ? (
                    <input
                      type="text"
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                      placeholder="e.g. Basement Level 3"
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                      required
                    />
                  ) : (
                    <select
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                      required
                    >
                      {(() => {
                        const bld = currentProject?.buildings?.find(b => b.name === newZone || b.code === newZone);
                        const floorsList = bld?.floors && bld.floors.length > 0
                          ? bld.floors
                          : (currentProject?.floors && currentProject.floors.length > 0
                            ? currentProject.floors
                            : ['Basement Level 1', 'Ground Floor', 'Level 1', 'Roof']);
                        return floorsList.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ));
                      })()}
                    </select>
                  )}
                </div>
              </div>

              {/* 8-Point Lifecycle Dates Form Section */}
              <DateInputsFormSection 
                dates={newDates}
                onChange={setNewDates}
              />

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateDrawingModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold"
                >
                  Create & Issue Revision P01
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD REVISION (P02, C01, ETC.) */}
      {/* ========================================================================= */}
      {revisionModalOpen && selectedDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Add Drawing Revision & Consultant Decision</h3>
                <div className="text-[11px] text-slate-300 font-mono">{selectedDrawing.drawingNumber}</div>
              </div>
              <button onClick={() => setRevisionModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddRevision} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-slate-50 border rounded text-[11px]">
                <div className="font-bold text-slate-800">Current Active Revision: Rev {selectedDrawing.currentRevision}</div>
                <div className="text-slate-500">Historical revisions are preserved and will never be overwritten.</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Revision Number</label>
                  <input
                    type="text"
                    value={revNumber}
                    onChange={(e) => setRevNumber(e.target.value)}
                    placeholder="e.g. P02 or C01"
                    className="w-full border border-slate-300 font-mono font-bold rounded p-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultant Approval Code</label>
                  <select
                    value={revApprovalCode}
                    onChange={(e) => {
                      const code = e.target.value as any;
                      setRevApprovalCode(code);
                      if (code === 'A') setRevStatus('Code A - Approved');
                      else if (code === 'B') setRevStatus('Code B - Approved as Noted');
                      else if (code === 'C') setRevStatus('Code C - Revise and Resubmit');
                      else if (code === 'D') setRevStatus('Code D - Rejected');
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="A">CODE A — Approved</option>
                    <option value="B">CODE B — Approved as Noted</option>
                    <option value="C">CODE C — Revise and Resubmit</option>
                    <option value="D">CODE D — Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Linked Transmittal Number</label>
                <input
                  type="text"
                  value={revTransmittalNum}
                  onChange={(e) => setRevTransmittalNum(e.target.value)}
                  placeholder="e.g. APX-KSP-03-TR-0045"
                  className="w-full border border-slate-300 font-mono rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultant Review Comments</label>
                <textarea
                  value={revComments}
                  onChange={(e) => setRevComments(e.target.value)}
                  placeholder="Enter detailed engineering comments, clash notes, or conditions of approval..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reviewer Name & Entity</label>
                <input
                  type="text"
                  value={revReviewer}
                  onChange={(e) => setRevReviewer(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              {/* Revision 8-Point Dates */}
              <DateInputsFormSection
                dates={revDates}
                onChange={setRevDates}
              />

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold"
                >
                  Save Revision {revNumber}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW TRANSMITTAL (LINKED TO SELECTED DRAWINGS) */}
      {/* ========================================================================= */}
      {createTransmittalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Issue Formal Document Transmittal</h3>
                <div className="text-[11px] text-slate-300">
                  {selectedDrawingIds.length > 0 
                    ? `Packaging ${selectedDrawingIds.length} selected drawings into formal transmittal slip`
                    : 'Create and dispatch contractual document transmittal'}
                </div>
              </div>
              <button onClick={() => setCreateTransmittalModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransmittal} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transmittal Number (Controlled)</label>
                  <input
                    type="text"
                    value={trNumber}
                    onChange={(e) => setTrNumber(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={trSubmissionDate}
                    onChange={(e) => setTrSubmissionDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient</label>
                  <input
                    type="text"
                    value={trRecipient}
                    onChange={(e) => setTrRecipient(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={trCategory}
                    onChange={(e) => setTrCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    <option value="Shop Drawings">Shop Drawings</option>
                    <option value="As-Built Drawings">As-Built Drawings</option>
                    <option value="Design Drawings">Design Drawings</option>
                    <option value="Technical Submittals">Technical Submittals</option>
                    <option value="Coordination Drawings">Coordination Drawings</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purpose of Submission</label>
                  <select
                    value={trPurpose}
                    onChange={(e) => setTrPurpose(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    <option value="For Approval">For Approval</option>
                    <option value="For Information">For Information</option>
                    <option value="For Construction">For Construction</option>
                    <option value="As-Built Record">As-Built Record</option>
                    <option value="For Review & Comments">For Review & Comments</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Method</label>
                  <select
                    value={trDeliveryMethod}
                    onChange={(e) => setTrDeliveryMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    <option value="System Transmittal">System Transmittal (Direct)</option>
                    <option value="Hand Delivered">Hand Delivered (Hardcopy + USB)</option>
                    <option value="Courier / Dispatch">Courier / Dispatch</option>
                    <option value="Email & Cloud Link">Email & Cloud Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Action</label>
                <input
                  type="text"
                  value={trAction}
                  onChange={(e) => setTrAction(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              {/* Document Bundle List */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 text-[11px] mb-2 flex items-center justify-between">
                  <span>Attached Documents Bundle</span>
                  <span className="font-mono text-teal-700 font-bold">
                    {selectedDrawingIds.length > 0 ? `${selectedDrawingIds.length} Drawings Selected` : '1 Drawing'}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {selectedDrawingIds.length > 0 ? (
                    drawings.filter(d => selectedDrawingIds.includes(d.id)).map(d => (
                      <div key={d.id} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{d.drawingNumber}</span>
                          <span className="text-slate-500 ml-2">{d.title}</span>
                        </div>
                        <span className="font-mono font-bold bg-navy-900 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                          Rev {d.currentRevision}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-500 text-[11px]">
                      {drawings[0] ? `${drawings[0].drawingNumber} — ${drawings[0].title}` : 'No drawings selected, default document will be added.'}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Notice: Creating and dispatching this transmittal will record the submission date and link this transmittal to all included drawings, but will <b>never automatically mark them as approved</b>.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateTransmittalModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Dispatch & Issue Transmittal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW TRANSMITTAL DETAILS */}
      {/* ========================================================================= */}
      {viewTransmittalModalOpen && selectedTransmittal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <div className="text-[11px] font-mono text-teal-400 font-bold">{selectedTransmittal.transmittalNumber}</div>
                <h3 className="font-bold text-sm">Formal Document Transmittal Details</h3>
              </div>
              <button onClick={() => setViewTransmittalModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <DateLifecycleCard dates={selectedTransmittal} slaDays={currentProject?.reviewDurationDays || 14} />

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Sender</span>
                  <span className="font-semibold text-slate-800">{selectedTransmittal.sender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Recipient</span>
                  <span className="font-semibold text-slate-800">{selectedTransmittal.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Purpose</span>
                  <span className="font-semibold text-slate-800">{selectedTransmittal.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className="font-bold text-teal-700">{selectedTransmittal.status}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Transmitted Documents List ({selectedTransmittal.documentList?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[10px]">
                      <tr>
                        <th className="p-2">Document Number</th>
                        <th className="p-2">Title</th>
                        <th className="p-2 text-center">Rev</th>
                        <th className="p-2">Discipline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedTransmittal.documentList || []).map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-900">{doc.docNumber}</td>
                          <td className="p-2 text-slate-800">{doc.docTitle}</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-700">{doc.revision}</td>
                          <td className="p-2 text-slate-600">{doc.discipline || 'General'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setViewTransmittalModalOpen(false);
                  setPrintTransmittalModalOpen(true);
                }}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
              >
                Print Transmittal Slip
              </button>
              <button
                onClick={() => setViewTransmittalModalOpen(false)}
                className="px-4 py-1.5 rounded bg-navy-900 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMMON PREVIEW & PRINT MODALS */}
      {/* ========================================================================= */}
      <DocumentViewerModal
        drawing={selectedDrawing}
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
      />

      <PrintableDocumentModal
        docType="DRAWING_COVER"
        title="SHOP DRAWING SUBMISSION & APPROVAL COVER SHEET"
        data={selectedDrawing}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      <PrintableDocumentModal
        docType="TRANSMITTAL_SLIP"
        title="FORMAL DOCUMENT TRANSMITTAL SLIP"
        data={selectedTransmittal}
        isOpen={printTransmittalModalOpen}
        onClose={() => setPrintTransmittalModalOpen(false)}
      />

      <ExcelImportModal
        module="drawings"
        moduleTitle="Drawings"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          loadAll();
        }}
      />
    </div>
  );
}
