'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { SiteInstruction } from '@/types';
import * as XLSX from 'xlsx';
import { 
  GitPullRequest, Plus, Search, Download, DollarSign, 
  Clock, AlertTriangle, CheckCircle2, FileText, ArrowRight, Eye, X
} from 'lucide-react';
import { DateLifecycleCard } from '@/components/common/DateLifecycleDisplay';
import { UniversalDocumentLinks } from '@/components/common/UniversalDocumentLinks';
import { RecordAuditHistory } from '@/components/common/RecordAuditHistory';

export function VariationsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [items, setItems] = useState<SiteInstruction[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer / Selection
  const [selectedItem, setSelectedItem] = useState<SiteInstruction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newType, setNewType] = useState<any>('Site Instruction (SI)');
  const [newDesc, setNewDesc] = useState('');
  const [newReason, setNewReason] = useState('Consultant site coordination directive');
  const [newClause, setNewClause] = useState('Clause 13.1 (Right to Vary)');
  const [newCost, setNewCost] = useState<number>(50000);
  const [newDays, setNewDays] = useState<number>(7);
  const [newDept, setNewDept] = useState('MEP Electrical Dept');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchVariations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/variations?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (e) {
      console.error('Error fetching variations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations();
  }, [currentProjectId]);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'SI',
          discipline: 'ENG',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating SI number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setCreateModalOpen(true);
  };

  const handleCreateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    try {
      const res = await fetch('/api/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          instructionNumber: generatedDocNum,
          instructionType: newType,
          originator: 'Lead Supervising Consultant',
          dateReceived: new Date().toISOString().split('T')[0],
          description: newDesc,
          reasonForChange: newReason,
          contractClauseRef: newClause,
          potentialCostImpact: newCost,
          potentialTimeImpactDays: newDays,
          responsibleDept: newDept,
          status: 'Instructed',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewDesc('');
        fetchVariations();
      }
    } catch (err) {
      alert('Error creating variation');
    }
  };

  const exportToExcel = () => {
    const exportData = items.map((v, index) => ({
      '#': index + 1,
      'Number': v.instructionNumber,
      'Type': v.instructionType,
      'Description': v.description,
      'Reason': v.reasonForChange,
      'Clause': v.contractClauseRef || 'N/A',
      'Cost Impact (SAR)': v.potentialCostImpact || 0,
      'Time Impact (Days)': v.potentialTimeImpactDays || 0,
      'Status': v.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Variations_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_VARIATIONS_REGISTER.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل تعليمات الموقع وأوامر التغيير (SI / VO)' : 'Site Instructions & Variations (VO / Change Control)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {items.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Site instructions, variation orders, potential claims, and contractual cost/schedule impacts
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'أمر تغيير / تعليمات جديدة' : 'New Instruction / VO'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Reference Number</th>
                <th className="py-3 px-3">Instruction Type</th>
                <th className="py-3 px-3">Description & Reason</th>
                <th className="py-3 px-3">Originator</th>
                <th className="py-3 px-3">Contract Clause</th>
                <th className="py-3 px-3 text-right">Potential Cost (SAR)</th>
                <th className="py-3 px-3 text-center">Time (Days)</th>
                <th className="py-3 px-3">Approval Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((si) => (
                <tr key={si.id} className="hover:bg-slate-50 transition group">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedItem(si);
                        setDrawerOpen(true);
                      }}
                      className="text-amber-700 hover:underline font-bold"
                    >
                      {si.instructionNumber}
                    </button>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-semibold text-amber-900">
                    {si.instructionType}
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-slate-800 line-clamp-1">{si.description}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{si.reasonForChange}</div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    {si.originator}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {si.contractClauseRef || 'Clause 13'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {si.potentialCostImpact ? `${Number(si.potentialCostImpact).toLocaleString()} SAR` : '—'}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                    {si.potentialTimeImpactDays ? `+${si.potentialTimeImpactDays} d` : '0 d'}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      {si.status}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedItem(si);
                        setDrawerOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                      title="View details, dates & document links"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
                <h3 className="font-bold text-sm">Record Site Instruction or Variation Order</h3>
                <div className="text-[11px] text-slate-300">Contractual change tracking with cost & time impacts</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVariation} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generated Reference</label>
                  <input
                    type="text"
                    value={generatedDocNum}
                    onChange={(e) => setGeneratedDocNum(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instruction Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Site Instruction (SI)">Site Instruction (SI)</option>
                    <option value="Engineer's Instruction (EI)">Engineer's Instruction (EI)</option>
                    <option value="Variation Order (VO)">Variation Order (VO)</option>
                    <option value="Change Request">Change Request</option>
                    <option value="Potential Claim">Potential Claim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description of Change / Instruction</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail scope modification or engineer directive..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Change</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Clause Ref</label>
                  <input
                    type="text"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Cost Impact (SAR)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Time Impact (Days)</label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold"
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
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variation Details Drawer */}
      {drawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="bg-[#0F2744] text-white p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded font-bold">
                      {selectedItem.instructionNumber}
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded font-semibold">
                      {selectedItem.instructionType}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-2">
                    {selectedItem.description}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Date Lifecycle Card */}
                <DateLifecycleCard 
                  dates={selectedItem} 
                  slaDays={currentProject?.reviewDurationDays || 14} 
                  moduleId="siteInstructions"
                  recordId={selectedItem.id}
                  recordRef={selectedItem.instructionNumber}
                  allowEdit={true}
                  onDatesUpdated={(updated) => {
                    setSelectedItem((prev) => prev ? { ...prev, ...updated } : null);
                    fetchVariations();
                  }}
                />

                {/* Universal Documents & References + Linked APEX Records */}
                <UniversalDocumentLinks
                  moduleId="siteInstructions"
                  recordId={selectedItem.id}
                  recordRef={selectedItem.instructionNumber}
                  documentLinks={selectedItem.documentLinks || []}
                  linkedApexRecords={selectedItem.linkedApexRecords || []}
                  legacyAttachments={selectedItem.attachments}
                  projectId={currentProjectId}
                  onUpdated={(updated) => {
                    setSelectedItem(updated);
                    fetchVariations();
                  }}
                  language={language}
                />

                {/* Scope & Financial Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs">Variation Parameters</h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Originator</span>
                      <span className="font-medium text-slate-800">{selectedItem.originator}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Contract Clause</span>
                      <span className="font-medium text-slate-800">{selectedItem.contractClauseRef || 'Clause 13'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Potential Cost Impact</span>
                      <span className="font-bold text-amber-700">
                        {selectedItem.potentialCostImpact ? `${Number(selectedItem.potentialCostImpact).toLocaleString()} SAR` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Potential Time Impact</span>
                      <span className="font-bold text-slate-800">
                        {selectedItem.potentialTimeImpactDays ? `+${selectedItem.potentialTimeImpactDays} Days` : '0 Days'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Reason for Directive</span>
                      <span className="font-medium text-slate-800">{selectedItem.reasonForChange}</span>
                    </div>
                  </div>
                </div>

                {/* Immutable Audit History */}
                <RecordAuditHistory
                  recordId={selectedItem.id}
                  recordRef={selectedItem.instructionNumber}
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
    </div>
  );
}
