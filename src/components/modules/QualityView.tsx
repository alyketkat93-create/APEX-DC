'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { QualityRecord, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  ShieldAlert, Plus, Search, Download, Upload, Printer, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function QualityView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<QualityRecord | null>(null);

  // New NCR Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('NCR (Non-Conformance Report)');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-Firefighting');
  const [newLocation, setNewLocation] = useState('Laydown Yard 2, Warehouse 4B');
  const [isCustomLoc, setIsCustomLoc] = useState(false);
  const [newParty, setNewParty] = useState('Al-Jazira Industrial Supplies');
  const [newSeverity, setNewSeverity] = useState<'Minor' | 'Major' | 'Critical'>('Major');
  const [newDesc, setNewDesc] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newCorrective, setNewCorrective] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

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
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
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
    const exportData = filteredRecords.map((r, index) => ({
      '#': index + 1,
      'Record Number': r.recordNumber,
      'Type': r.recordType,
      'Title': r.title,
      'Discipline': r.discipline,
      'Location': r.location,
      'Responsible Party': r.responsibleParty,
      'Severity': r.severity,
      'Status': r.status,
      'Issue Date': r.issueDate,
      'Due Date': r.dueDate,
    }));

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
    return matchSearch && matchType && matchSeverity;
  });

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
            NCRs, root-cause analyses, CARs, ITPs, and verification sign-off before closure
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
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No quality records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.recordNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{r.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{r.recordType} • {r.discipline}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <div className="font-semibold">{r.location}</div>
                      <div className="text-[10px] text-slate-400">{r.responsibleParty}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        r.severity === 'Critical' ? 'bg-red-200 text-red-950 font-black' :
                        r.severity === 'Major' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.severity}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      <div>Issued: {r.issueDate}</div>
                      <span className="text-red-700 font-bold">Due: {r.dueDate}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        r.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Corrective Action Submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create NCR Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Issue Non-Conformance Report (NCR)</h3>
                <div className="text-[11px] text-slate-300">Contractual QA/QC defect documentation</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">NCR Title / Defect Summary</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Defective Firefighting Pipes Delivered with Surface Corrosion"
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
                    <option value="Structural">Structural</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold text-red-800"
                  >
                    <option value="Critical">Critical (Immediate Stop Work)</option>
                    <option value="Major">Major (Rework / Quarantine Required)</option>
                    <option value="Minor">Minor (Rectification)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Location on Site</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomLoc(!isCustomLoc)}
                      className="text-[10px] text-red-700 hover:underline font-semibold"
                    >
                      {isCustomLoc ? (language === 'ar' ? 'من المباني' : 'From Buildings') : (language === 'ar' ? '+ إدخال حر' : '+ Free Text')}
                    </button>
                  </div>
                  {isCustomLoc ? (
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Laydown Yard 2, Warehouse 4B"
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                      required
                    />
                  ) : (
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                      required
                    >
                      {currentProject?.buildings && currentProject.buildings.length > 0 ? (
                        currentProject.buildings.map((b) => (
                          <option key={b.id} value={`${b.code} - ${b.name}`}>
                            {b.code} — {language === 'ar' ? (b.nameAr || b.name) : b.name}
                          </option>
                        ))
                      ) : (
                        <option value="Main Site Zone">Main Site Zone</option>
                      )}
                      <option value="Laydown Yard & Warehouse">Laydown Yard & Warehouse</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsible Party</label>
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
                <label className="block font-bold text-slate-700 mb-1">Description of Non-Conformance</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail exact standard, spec clause, or drawing violation..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-red-500"
                  rows={2}
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
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Issue Formal NCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <PrintableDocumentModal
        docType="NCR_FORM"
        title="NON-CONFORMANCE REPORT (NCR)"
        data={selectedRecord}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
