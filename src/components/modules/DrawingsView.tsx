'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Drawing, Discipline, ReviewStatus } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Compass, Plus, Search, Filter, Download, Upload, 
  Printer, Eye, History, FileText, CheckCircle2, AlertCircle, 
  Clock, Shield, ArrowUpDown, ChevronRight, Layers, FileSpreadsheet, Building2
} from 'lucide-react';
import { DocumentViewerModal } from '@/components/common/DocumentViewerModal';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { ExcelImportModal } from '@/components/common/ExcelImportModal';

export function DrawingsView() {
  const { currentProjectId, currentProject, language, t } = useProject();
  
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);

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

  // New Revision Form State
  const [revNumber, setRevNumber] = useState('P02');
  const [revStatus, setRevStatus] = useState<ReviewStatus>('Code B - Approved as Noted');
  const [revApprovalCode, setRevApprovalCode] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [revComments, setRevComments] = useState('');
  const [revReviewer, setRevReviewer] = useState('Eng. Tariq Al-Mansoor (Dar Al-Handasah)');

  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drawings?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDrawings(json.data);
      }
    } catch (e) {
      console.error('Failed to load drawings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [currentProjectId]);

  // Generate Document Number dynamically
  const generateNumber = async (disc: string) => {
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

  const handleOpenCreateModal = () => {
    generateNumber(newDiscipline);
    const initialZone = currentProject?.buildings?.[0]?.name || 'Energy Center B3';
    setNewZone(initialZone);
    const initialFloor = currentProject?.buildings?.[0]?.floors?.[0] || currentProject?.floors?.[0] || 'Basement Level 3';
    setNewFloor(initialFloor);
    setIsCustomZone(false);
    setIsCustomFloor(false);
    setCreateModalOpen(true);
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
          revisionDate: new Date().toISOString().split('T')[0],
          submissionDate: new Date().toISOString().split('T')[0],
          reviewStatus: 'Submitted to Consultant',
          reviewer: 'Consultant Supervising Lead',
          revisions: [
            {
              id: `rev-init-${Date.now()}`,
              drawingId: '',
              revisionNumber: 'P01',
              submissionDate: new Date().toISOString().split('T')[0],
              status: 'Submitted to Consultant',
              comments: 'Initial formal submission for construction review.',
              createdAt: new Date().toISOString(),
            }
          ]
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        fetchDrawings();
      }
    } catch (err) {
      alert('Error creating drawing record');
    }
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
          transmittalNumber: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRevisionModalOpen(false);
        fetchDrawings();
      }
    } catch (err) {
      alert('Error recording drawing revision');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredDrawings.map((d, index) => ({
      '#': index + 1,
      'Drawing Number': d.drawingNumber,
      'Title': d.title,
      'Discipline': d.discipline,
      'System': d.system,
      'Building / Zone': d.buildingZone,
      'Floor / Level': d.floorLevel,
      'Type': d.drawingType,
      'Revision': d.currentRevision,
      'Status': d.reviewStatus,
      'Approval Code': d.approvalCode || 'N/A',
      'Reviewer': d.reviewer || 'N/A',
      'Revision Date': d.revisionDate,
      'Comments': d.reviewComments || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drawing_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_DRAWINGS_REGISTER.xlsx`);
  };

  // Filtered List
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
    return matchSearch && matchDiscipline && matchStatus && matchZone && matchFloor;
  });

  return (
    <div className="space-y-4">
      {/* Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل المخططات الهندسية والمراجعات' : 'Drawing Management & Revision Register'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredDrawings.length} Drawings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict revision traceability (P01, P02, C01), consultant code tracking & approval stamps
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            export-btn="true"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
            title="Export Register to Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
            title="Import Existing Register"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.importExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إضافة مخطط جديد' : 'New Drawing'}</span>
          </button>
        </div>
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
      </div>

      {/* Drawing Register Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Drawing Number</th>
                <th className="py-3 px-3">Title & System</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3">Zone / Level</th>
                <th className="py-3 px-3 text-center">Rev</th>
                <th className="py-3 px-3">Review Status</th>
                <th className="py-3 px-3">Consultant Decision</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrawings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No drawing records found matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDrawings.map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/30 transition group">
                    {/* Drawing Number */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {d.drawingNumber}
                    </td>

                    {/* Title & System */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{d.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{d.system} • {d.drawingType}</div>
                    </td>

                    {/* Discipline */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{d.discipline}</span>
                    </td>

                    {/* Zone / Level */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{d.buildingZone}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{d.floorLevel}</span>
                        </span>
                      </div>
                    </td>

                    {/* Current Revision Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedDrawing(d);
                          setRevisionModalOpen(true);
                        }}
                        className="font-mono font-bold text-xs bg-navy-900 text-amber-300 px-2 py-0.5 rounded hover:bg-navy-800 transition"
                        title="Click to view or add revision"
                      >
                        {d.currentRevision}
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        d.approvalCode === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        d.approvalCode === 'B' ? 'bg-amber-100 text-amber-800' :
                        d.approvalCode === 'C' ? 'bg-orange-100 text-orange-800' :
                        d.approvalCode === 'D' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {d.reviewStatus}
                      </span>
                    </td>

                    {/* Review Comments / Stamp */}
                    <td className="py-3 px-3 max-w-[200px] text-[11px] text-slate-600 truncate">
                      {d.reviewComments || 'Pending review'}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedDrawing(d);
                            setViewerModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Open in Drawing Viewer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDrawing(d);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Print Formal Cover Sheet"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDrawing(d);
                            setRevisionModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Add Revision (P02, C01)"
                        >
                          <History className="w-4 h-4" />
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

      {/* Modal 1: Create New Drawing */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create New Shop / Engineering Drawing</h3>
                <div className="text-[11px] text-slate-300">Automatic project numbering & initial revision P01</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDrawing} className="p-6 space-y-4 text-xs">
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
                      generateNumber(disc);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    <option value="MEP-HVAC">MEP-HVAC</option>
                    <option value="MEP-Firefighting">MEP-Firefighting</option>
                    <option value="MEP-Plumbing">MEP-Plumbing</option>
                    <option value="MEP-Electrical">MEP-Electrical</option>
                    <option value="MEP-ELV">MEP-ELV</option>
                    <option value="Architectural">Architectural</option>
                    <option value="Structural">Structural</option>
                    <option value="Builder Works">Builder Works</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    <option value="Shop Drawing">Shop Drawing</option>
                    <option value="Coordination Drawing">Coordination Drawing</option>
                    <option value="Combined Services Drawing (CSD)">Combined Services (CSD)</option>
                    <option value="Builder Work Drawing (BWD)">Builder Work (BWD)</option>
                    <option value="IFC (Issued for Construction)">IFC Drawing</option>
                    <option value="As-Built Drawing">As-Built Drawing</option>
                  </select>
                </div>
              </div>

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
                        const val = e.target.value;
                        setNewZone(val);
                        const bld = currentProject?.buildings?.find(b => b.name === val || b.code === val);
                        if (bld?.floors && bld.floors.length > 0) {
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
                        <option value="Main Complex Zone">Main Complex Zone</option>
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
                  Create & Issue Revision P01
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Revision (P02, C01, etc.) */}
      {revisionModalOpen && selectedDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Add Drawing Revision & Consultant Decision</h3>
                <div className="text-[11px] text-slate-300 font-mono">{selectedDrawing.drawingNumber}</div>
              </div>
              <button onClick={() => setRevisionModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddRevision} className="p-6 space-y-4 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">Consultant Review Comments</label>
                <textarea
                  value={revComments}
                  onChange={(e) => setRevComments(e.target.value)}
                  placeholder="Enter detailed engineering comments, clash notes, or conditions of approval..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                  rows={3}
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

      {/* Modal 3: Document Viewer */}
      <DocumentViewerModal
        drawing={selectedDrawing}
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
      />

      {/* Modal 4: Printable Document Form */}
      <PrintableDocumentModal
        docType="DRAWING_COVER"
        title="SHOP DRAWING SUBMISSION & APPROVAL COVER SHEET"
        data={selectedDrawing}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      {/* Modal 5: Excel Import Modal */}
      <ExcelImportModal
        module="drawings"
        moduleTitle="Drawings"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          fetchDrawings();
        }}
      />
    </div>
  );
}
