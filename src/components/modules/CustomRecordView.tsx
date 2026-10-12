'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { CustomModuleDefinition, CustomRecord } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Sparkles, Plus, Search, Download, CheckCircle2, 
  Wrench, FileSpreadsheet, Eye, Printer, Layers
} from 'lucide-react';

interface CustomRecordViewProps {
  moduleId: string;
}

export function CustomRecordView({ moduleId }: CustomRecordViewProps) {
  const { currentProjectId, currentProject, language, t, customModules } = useProject();

  const definition = customModules.find(m => m.id === moduleId);

  const [records, setRecords] = useState<CustomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchRecords = async () => {
    if (!definition) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-records?moduleId=${definition.id}&projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data);
      }
    } catch (e) {
      console.error('Error fetching custom records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [moduleId, currentProjectId]);

  const generateNumber = async () => {
    if (!definition) return;
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'CUST',
          customPrefix: definition.numberingPrefix,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating custom record number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setFormData({});
    setCreateModalOpen(true);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!definition) return;

    try {
      const res = await fetch('/api/custom-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: definition.id,
          projectId: currentProjectId,
          recordNumber: generatedDocNum,
          status: definition.workflowStatuses[0]?.code || 'OPEN',
          data: formData,
          createdBy: 'Eng. Aly Ketkat',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      alert('Error saving custom record');
    }
  };

  const exportToExcel = () => {
    if (!definition) return;
    const exportData = filteredRecords.map((r, index) => {
      const row: any = {
        '#': index + 1,
        'Record Number': r.recordNumber,
        'Status': r.status,
      };
      definition.fields.forEach(f => {
        row[f.label] = r.data[f.name] || '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Register');
    XLSX.writeFile(wb, `${definition.key}_REGISTER.xlsx`);
  };

  if (!definition) {
    return (
      <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
        Module definition not found.
      </div>
    );
  }

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    return r.recordNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(r.data).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? definition.nameAr : definition.name}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredRecords.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Category: {definition.category} • Record Type: {definition.recordType} • Prefix: {definition.numberingPrefix}
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
            <span>New {definition.name.split(' ')[0]} Record</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${definition.name} records...`}
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Record Number</th>
                {definition.fields.slice(0, 5).map((f) => (
                  <th key={f.id} className="py-3 px-3">
                    {language === 'ar' ? f.labelAr : f.label}
                  </th>
                ))}
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={definition.fields.length + 2} className="py-8 text-center text-slate-400">
                    No records found in this custom register.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.recordNumber}
                    </td>

                    {definition.fields.slice(0, 5).map((f) => (
                      <td key={f.id} className="py-3 px-3 text-slate-700 max-w-xs truncate">
                        {String(r.data[f.name] || '—')}
                      </td>
                    ))}

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {r.createdAt.split('T')[0]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Add Record — {definition.name}</h3>
                <div className="text-[11px] text-slate-300">Generated with numbering prefix {definition.numberingPrefix}</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated Record Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              {/* Dynamic Fields Grid */}
              <div className="space-y-3">
                {definition.fields.map((f) => (
                  <div key={f.id}>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ar' ? f.labelAr : f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>

                    {f.type === 'select' && f.options ? (
                      <select
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                        required={f.required}
                      >
                        <option value="">Select option...</option>
                        {f.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : f.type === 'longtext' ? (
                      <textarea
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full border border-slate-300 rounded p-2 text-xs"
                        rows={2}
                        required={f.required}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' || f.type === 'decimal' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full border border-slate-300 rounded p-2 text-xs"
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
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
                  Save Record to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
