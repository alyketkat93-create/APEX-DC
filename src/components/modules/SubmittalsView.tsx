'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { TechnicalSubmittal, Discipline, ReviewStatus } from '@/types';
import * as XLSX from 'xlsx';
import { 
  FileCheck2, Plus, Search, Download, Upload, Printer, 
  Eye, CheckCircle2, AlertTriangle, Clock, Layers, ShieldCheck
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';
import { ExcelImportModal } from '@/components/common/ExcelImportModal';

export function SubmittalsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [submittals, setSubmittals] = useState<TechnicalSubmittal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedSubmittal, setSelectedSubmittal] = useState<TechnicalSubmittal | null>(null);

  // New Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('Material Submittal');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newSystem, setNewSystem] = useState('Central Chiller Plant');
  const [newSpec, setNewSpec] = useState('15620 - Liquid Chillers');
  const [newManufacturer, setNewManufacturer] = useState('Carrier Corporation');
  const [newSupplier, setNewSupplier] = useState('Carrier Arabian Air Conditioning');
  const [newOrigin, setNewOrigin] = useState('USA');
  const [newModel, setNewModel] = useState('19DV-750TR-VFD');
  const [newDesc, setNewDesc] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchSubmittals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submittals?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSubmittals(json.data);
      }
    } catch (e) {
      console.error('Error fetching submittals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmittals();
  }, [currentProjectId]);

  const generateNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'SUB',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(`${json.docNumber}-00`);
      }
    } catch (e) {
      console.error('Error generating submittal number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber(newDiscipline);
    setCreateModalOpen(true);
  };

  const handleCreateSubmittal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/submittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          submittalNumber: generatedDocNum,
          title: newTitle,
          type: newType,
          discipline: newDiscipline,
          system: newSystem,
          specSection: newSpec,
          manufacturer: newManufacturer,
          supplier: newSupplier,
          countryOfOrigin: newOrigin,
          modelNumber: newModel,
          materialDescription: newDesc || newTitle,
          complianceStatus: 'Fully Compliant',
          submittedBy: 'Eng. Aly Ketkat',
          preparedBy: 'Eng. Hisham Al-Husseini',
          checkedBy: 'Eng. Majed Al-Zahrani',
          submissionDate: new Date().toISOString().split('T')[0],
          requiredApprovalDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          reviewStatus: 'Submitted to Consultant',
          revisionNumber: '00',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchSubmittals();
      }
    } catch (err) {
      alert('Error creating technical submittal');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredSubmittals.map((s, index) => ({
      '#': index + 1,
      'Submittal Number': s.submittalNumber,
      'Title': s.title,
      'Type': s.type,
      'Discipline': s.discipline,
      'Manufacturer': s.manufacturer,
      'Supplier': s.supplier,
      'Origin': s.countryOfOrigin,
      'Compliance': s.complianceStatus,
      'Rev': s.revisionNumber,
      'Status': s.reviewStatus,
      'Comments': s.consultantComments || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Submittals_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_SUBMITTALS_REGISTER.xlsx`);
  };

  const filteredSubmittals = submittals.filter(s => {
    const matchSearch = searchQuery === '' || 
      s.submittalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiscipline = disciplineFilter === 'ALL' || s.discipline === disciplineFilter;
    const matchStatus = statusFilter === 'ALL' || s.reviewStatus === statusFilter;
    return matchSearch && matchDiscipline && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل الاعتمادات الفنية للمواد والمعدات' : 'Technical & Material Submittals (MAR / MAS)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              {filteredSubmittals.length} Submittals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Material approvals, equipment specs, compliance statements & consultant review stages
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
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.importExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إضافة اعتماد جديد' : 'New Submittal'}</span>
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
            placeholder="Search submittal number, title, manufacturer, or spec..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="Code A - Approved">Code A - Approved</option>
          <option value="Code B - Approved as Noted">Code B - Approved as Noted</option>
          <option value="Under Review">Under Review</option>
          <option value="Submitted to Consultant">Submitted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Submittal Number</th>
                <th className="py-3 px-3">Material Title & Spec</th>
                <th className="py-3 px-3">Manufacturer & Supplier</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3 text-center">Rev</th>
                <th className="py-3 px-3">Compliance</th>
                <th className="py-3 px-3">Consultant Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmittals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No technical submittals found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmittals.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {s.submittalNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{s.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{s.specSection} • {s.type}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold">{s.manufacturer}</div>
                      <div className="text-[10px] text-slate-400">{s.countryOfOrigin}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {s.discipline}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{s.revisionNumber}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.complianceStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        s.reviewStatus.includes('Code A') ? 'bg-emerald-100 text-emerald-800' :
                        s.reviewStatus.includes('Code B') ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {s.reviewStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedSubmittal(s);
                          setPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                        title="Print Submittal Cover Sheet"
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

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create New Technical Material Submittal</h3>
                <div className="text-[11px] text-slate-300">Automatic project numbering & initial revision 00</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmittal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated Submittal Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Submittal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. UL/FM Approved Peerless End Suction Fire Pump Set (1500 GPM)"
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
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submittal Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    <option value="Material Submittal">Material Submittal</option>
                    <option value="Material Approval Request (MAR)">Material Approval Request (MAR)</option>
                    <option value="Product Data Sheet">Product Data Sheet</option>
                    <option value="Equipment Submittal">Equipment Submittal</option>
                    <option value="Method Statement">Method Statement</option>
                  </select>
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
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Agent</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
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
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Create & Submit to Consultant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Modal */}
      <PrintableDocumentModal
        docType="SUBMITTAL_COVER"
        title="TECHNICAL MATERIAL SUBMITTAL COVER SHEET"
        data={selectedSubmittal}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      {/* Import Modal */}
      <ExcelImportModal
        module="submittals"
        moduleTitle="Technical Submittals"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          fetchSubmittals();
        }}
      />
    </div>
  );
}
