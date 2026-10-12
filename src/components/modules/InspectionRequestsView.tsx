'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { InspectionRequest, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  ClipboardList, Plus, Search, Download, Upload, Printer, 
  Calendar, CheckCircle2, AlertTriangle, Link as LinkIcon, 
  Clock, ShieldCheck, MapPin, Building2, Layers
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function InspectionRequestsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [irs, setIrs] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [calendarView, setCalendarView] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedIr, setSelectedIr] = useState<InspectionRequest | null>(null);

  // New IR Form State
  const [newType, setNewType] = useState('Piping Hydrostatic Pressure Testing');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newSystem, setNewSystem] = useState('Chilled Water Plant');
  const [newZone, setNewZone] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [isCustomFloor, setIsCustomFloor] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newDwgRef, setNewDwgRef] = useState('APX-KSP-03-MEP-HVAC-0042-P02');
  const [newDwgRev, setNewDwgRev] = useState('P02');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchIrs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/irs?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setIrs(json.data);
      }
    } catch (e) {
      console.error('Error fetching IRs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIrs();
  }, [currentProjectId]);

  const generateNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'IR',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating IR number', e);
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

  const handleCreateIr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    try {
      const res = await fetch('/api/irs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          irNumber: generatedDocNum,
          discipline: newDiscipline,
          system: newSystem,
          buildingZone: newZone,
          floorLocation: newFloor,
          inspectionType: newType,
          workDescription: newDesc,
          approvedDrawingRef: newDwgRef,
          drawingRevision: newDwgRev,
          approvedMethodStatement: 'MS-MEP-METHOD-01',
          approvedItpRef: 'ITP-QC-001',
          contractorRequestDate: new Date().toISOString().split('T')[0],
          requestedDateTime: `${newDate}T10:00:00`,
          submittedBy: 'Eng. Aly Ketkat',
          siteEngineer: 'Eng. Tariq Zaid',
          qaQcEngineer: 'Eng. Sarah Al-Ghamdi',
          consultantInspector: 'Eng. Tariq Al-Mansoor',
          result: 'Submitted',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewDesc('');
        fetchIrs();
      }
    } catch (err) {
      alert('Error creating inspection request');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredIrs.map((i, index) => ({
      '#': index + 1,
      'IR Number': i.irNumber,
      'Type': i.inspectionType,
      'Discipline': i.discipline,
      'Zone / Location': `${i.buildingZone} - ${i.floorLocation}`,
      'Drawing Ref': `${i.approvedDrawingRef} (Rev ${i.drawingRevision})`,
      'Request Date': i.contractorRequestDate,
      'Inspection Date': i.requestedDateTime.split('T')[0],
      'Result': i.result,
      'Comments': i.consultantComments || 'N/A',
      'Linked Reinspection': i.reinspectionIrId || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IR_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_IR_REGISTER.xlsx`);
  };

  const filteredIrs = irs.filter(i => {
    const matchSearch = searchQuery === '' || 
      i.irNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.inspectionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.workDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.buildingZone && i.buildingZone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.floorLocation && i.floorLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiscipline = disciplineFilter === 'ALL' || i.discipline === disciplineFilter;
    const matchResult = resultFilter === 'ALL' || i.result === resultFilter;
    const matchZone = zoneFilter === 'ALL' || i.buildingZone === zoneFilter || i.buildingZone?.toLowerCase().includes(zoneFilter.toLowerCase());
    const matchFloor = floorFilter === 'ALL' || i.floorLocation === floorFilter || i.floorLocation?.toLowerCase().includes(floorFilter.toLowerCase());
    return matchSearch && matchDiscipline && matchResult && matchZone && matchFloor;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل طلبات فحص الأعمال بالموقع (IR / WIR)' : 'Site Inspection Requests (IR / WIR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
              {filteredIrs.length} Requests
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Civil, MEP installations, pressure testing witness, and rejection reinspection linking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCalendarView(!calendarView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition shadow-xs ${
              calendarView ? 'bg-navy-900 text-white border-navy-900' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{calendarView ? 'Table View' : 'Inspection Schedule'}</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'طلب فحص جديد' : 'New IR / WIR'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by IR number, activity, or description..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Building / Zone Filter */}
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-purple-500"
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
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">{language === 'ar' ? 'جميع الأدوار والمستويات' : 'All Floors / Levels'}</option>
          {currentProject?.floors?.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select
          value={disciplineFilter}
          onChange={(e) => setDisciplineFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Disciplines</option>
          <option value="MEP-HVAC">MEP - HVAC</option>
          <option value="MEP-Firefighting">MEP - Firefighting</option>
          <option value="MEP-Plumbing">MEP - Plumbing</option>
          <option value="MEP-Electrical">MEP - Electrical</option>
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Inspection Results</option>
          <option value="Accepted">Accepted</option>
          <option value="Accepted with Comments">Accepted with Comments</option>
          <option value="Rejected">Rejected</option>
          <option value="Submitted">Submitted / Scheduled</option>
        </select>
      </div>

      {/* Schedule Calendar View Mode */}
      {calendarView ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Site Witnessing & Inspection Schedule</span>
            </h3>
            <span className="text-xs text-slate-500">October 2026 Scheduled Inspections</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {filteredIrs.map((ir) => (
              <div key={ir.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-900 text-xs">{ir.irNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ir.result === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                    ir.result === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ir.result}
                  </span>
                </div>
                <div className="font-bold text-slate-800">{ir.inspectionType}</div>
                <div className="text-[11px] text-slate-600 line-clamp-2">{ir.workDescription}</div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Witness Time:</span>
                  <span className="font-bold text-slate-800">{ir.requestedDateTime.replace('T', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Standard Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
                <tr>
                  <th className="py-3 px-3">IR Number</th>
                  <th className="py-3 px-3">Inspection Activity & Location</th>
                  <th className="py-3 px-3">Approved Drawing Ref</th>
                  <th className="py-3 px-3">Discipline</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-3">Reinspection Link</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIrs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No inspection requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIrs.map((ir) => (
                    <tr key={ir.id} className="hover:bg-slate-50 transition group">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {ir.irNumber}
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{ir.inspectionType}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{ir.buildingZone} • {ir.floorLocation}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                        <div>{ir.approvedDrawingRef}</div>
                        <span className="text-[10px] text-slate-400">Rev: {ir.drawingRevision || 'P01'}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                        {ir.discipline}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {ir.requestedDateTime.replace('T', ' ')}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          ir.result === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                          ir.result === 'Accepted with Comments' ? 'bg-amber-100 text-amber-800' :
                          ir.result === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ir.result}
                        </span>
                      </td>

                      {/* Reinspection linkage for rejected inspections */}
                      <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                        {ir.reinspectionIrId ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <LinkIcon className="w-3 h-3" />
                            {ir.reinspectionIrId}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedIr(ir);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                          title="Print Formal IR Form with Signatures"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create IR Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Request Site Work Inspection (IR / WIR)</h3>
                <div className="text-[11px] text-slate-300">Contractor formal request for consultant site witness</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateIr} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated IR Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
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
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Type</label>
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Description & Scope</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed description of works ready for inspection..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-purple-500"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Drawing Ref</label>
                  <input
                    type="text"
                    value={newDwgRef}
                    onChange={(e) => setNewDwgRef(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Rev</label>
                  <input
                    type="text"
                    value={newDwgRev}
                    onChange={(e) => setNewDwgRev(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Building / Zone</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomZone(!isCustomZone)}
                      className="text-[10px] text-purple-700 hover:underline font-semibold"
                    >
                      {isCustomZone ? (language === 'ar' ? 'من القائمة' : 'From List') : (language === 'ar' ? '+ إدخال يدوي' : '+ Custom')}
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
                    <label className="block font-bold text-slate-700">Floor Location</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomFloor(!isCustomFloor)}
                      className="text-[10px] text-purple-700 hover:underline font-semibold"
                    >
                      {isCustomFloor ? (language === 'ar' ? 'من القائمة' : 'From List') : (language === 'ar' ? '+ إدخال يدوي' : '+ Custom')}
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested Witness Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
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
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Submit Inspection Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable IR Sheet Modal */}
      <PrintableDocumentModal
        docType="IR_FORM"
        title="SITE WORK INSPECTION REQUEST (IR / WIR)"
        data={selectedIr}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
