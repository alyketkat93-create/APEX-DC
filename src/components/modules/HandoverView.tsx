'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { HandoverItem } from '@/types';
import * as XLSX from 'xlsx';
import { 
  PackageCheck, Plus, Search, Download, CheckCircle2, 
  Clock, ShieldCheck, FileCheck, Layers, BookOpen, Wrench
} from 'lucide-react';

export function HandoverView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [items, setItems] = useState<HandoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<any>('As-Built Drawing');
  const [newDiscipline, setNewDiscipline] = useState<any>('MEP-HVAC');
  const [newSystem, setNewSystem] = useState('Central Chiller Plant');
  const [newZone, setNewZone] = useState('Energy Center B3');
  const [newOriginalDoc, setNewOriginalDoc] = useState('APX-KSP-03-MEP-HVAC-0042-P02');
  const [newPkgRef, setNewPkgRef] = useState('PKG-HO-HVAC-CHW');
  const [newPercent, setNewPercent] = useState<number>(100);
  const [generatedDocNum, setGeneratedDocNum] = useState('');

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
    setCreateModalOpen(true);
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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
          buildingZone: newZone,
          originalDocRef: newOriginalDoc,
          latestRevision: '00',
          siteVerificationStatus: 'Verified on Site',
          qaQcVerificationStatus: 'Verified',
          consultantReviewStatus: 'Approved',
          approvalStatus: 'Approved',
          handoverPackageRef: newPkgRef,
          completionPercent: newPercent,
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

  const exportToExcel = () => {
    const exportData = items.map((h, index) => ({
      '#': index + 1,
      'Item Number': h.itemNumber,
      'Category': h.category,
      'Title': h.title,
      'Discipline': h.discipline,
      'Package Ref': h.handoverPackageRef,
      'Original Ref': h.originalDocRef || 'N/A',
      'Completion %': `${h.completionPercent}%`,
      'Status': h.approvalStatus,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Handover_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_HANDOVER_REGISTER.xlsx`);
  };

  // Average completion percentage
  const avgCompletion = items.length > 0 
    ? Math.round(items.reduce((acc, curr) => acc + curr.completionPercent, 0) / items.length)
    : 0;

  const filteredItems = items.filter(h => {
    const matchSearch = searchQuery === '' ||
      h.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || h.category === categoryFilter;
    return matchSearch && matchCat;
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
            As-built drawing registers, O&M manuals, warranty certificates, TAB testing & authority closeout
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
          <span className="font-mono text-emerald-700">{avgCompletion}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div 
            style={{ width: `${avgCompletion}%` }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
          />
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
            placeholder="Search handover item number, title, package..."
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
                <th className="py-3 px-3">Linked Original Drawing</th>
                <th className="py-3 px-3">Site Verification</th>
                <th className="py-3 px-3 text-center">Progress %</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((h) => (
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

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    {h.originalDocRef || 'Direct Dossier'}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {h.siteVerificationStatus}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                    <span className="text-emerald-700">{h.completionPercent}%</span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {h.approvalStatus}
                    </span>
                  </td>
                </tr>
              ))}
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
                <h3 className="font-bold text-sm">Add As-Built / Handover Dossier Item</h3>
                <div className="text-[11px] text-slate-300">Link to original approved shop drawings</div>
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
                  Save Handover Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
