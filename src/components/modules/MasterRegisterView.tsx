'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Search, Download, Filter, Eye, 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Layers
} from 'lucide-react';

interface MasterRegisterViewProps {
  onNavigateModule: (mod: string) => void;
}

export function MasterRegisterView({ onNavigateModule }: MasterRegisterViewProps) {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [masterRecords, setMasterRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Saved Views
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'APPROVED' | 'CLOSED'>('ALL');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const fetchMasterRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-register?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMasterRecords(json.data);
      }
    } catch (e) {
      console.error('Error fetching master document register', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterRegister();
  }, [currentProjectId]);

  const exportToExcel = () => {
    const exportData = filteredRecords.map((r, index) => ({
      '#': index + 1,
      'Module': r.module,
      'Document Number': r.docNumber,
      'Title': r.title,
      'Discipline': r.discipline,
      'Type': r.type,
      'Revision': r.currentRevision,
      'Status': r.status,
      'Originator': r.originator,
      'Recipient': r.recipient,
      'Submission Date': r.submissionDate || 'N/A',
      'Required Date': r.requiredDate || 'N/A',
      'Approval Date': r.approvalDate || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Document_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_MDR_MASTER_REGISTER.xlsx`);
  };

  const filteredRecords = masterRecords.filter(r => {
    const matchSearch = searchQuery === '' ||
      r.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiscipline = disciplineFilter === 'ALL' || r.discipline === disciplineFilter;
    const matchModule = moduleFilter === 'ALL' || r.moduleKey === moduleFilter;

    let matchView = true;
    if (activeView === 'PENDING') {
      matchView = r.status.includes('Review') || r.status.includes('Submitted') || r.status === 'Open';
    } else if (activeView === 'APPROVED') {
      matchView = r.status.includes('Approved') || r.status === 'Accepted';
    } else if (activeView === 'OVERDUE') {
      matchView = r.requiredDate && new Date(r.requiredDate) < new Date();
    } else if (activeView === 'CLOSED') {
      matchView = r.status === 'Closed';
    }

    return matchSearch && matchDiscipline && matchModule && matchView;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'السجل العام للمستندات (Master Document Register - MDR)' : 'Master Document Register (MDR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredRecords.length} Documents Consolidated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single unified source of truth consolidating drawings, submittals, IRs, MIRs, correspondence, and RFIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Master Register</span>
          </button>
        </div>
      </div>

      {/* Saved Views Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveView('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'ALL' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          All Project Records ({masterRecords.length})
        </button>
        <button
          onClick={() => setActiveView('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'PENDING' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          Pending Consultant Review
        </button>
        <button
          onClick={() => setActiveView('APPROVED')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'APPROVED' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          Approved / Accepted (Code A & B)
        </button>
        <button
          onClick={() => setActiveView('OVERDUE')}
          className={`px-3 py-1.5 rounded-lg transition ${activeView === 'OVERDUE' ? 'bg-navy-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
        >
          Overdue Response Items
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
            placeholder="Search master register by document number or title..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Modules</option>
          <option value="drawings">Drawings Only</option>
          <option value="submittals">Technical Submittals Only</option>
          <option value="irs">Inspection Requests Only</option>
          <option value="mirs">MIR Deliveries Only</option>
          <option value="rfis">RFIs Only</option>
          <option value="correspondence">Letters Only</option>
        </select>
      </div>

      {/* Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Document Number</th>
                <th className="py-3 px-3">Document Title</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3 text-center">Rev</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Due / Closed Date</th>
                <th className="py-3 px-3 text-right">Module Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No documents found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {r.module}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.docNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs font-semibold text-slate-800 line-clamp-1">
                      {r.title}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {r.discipline}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                      {r.currentRevision}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status.includes('Approved') || r.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        r.status.includes('Review') || r.status.includes('Submitted') ? 'bg-amber-100 text-amber-800' :
                        r.status.includes('Rejected') ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      {r.submissionDate || '—'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      {r.requiredDate || r.approvalDate || '—'}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigateModule(r.moduleKey)}
                        className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-900 text-[11px] group-hover:underline"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
