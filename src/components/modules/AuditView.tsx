'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { AuditEvent } from '@/types';
import * as XLSX from 'xlsx';
import { 
  History, Search, Download, Shield, Clock, 
  User, CheckCircle2, AlertTriangle, FileText, Lock
} from 'lucide-react';

export function AuditView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data);
      }
    } catch (e) {
      console.error('Error fetching audit events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [currentProjectId]);

  const exportToExcel = () => {
    const exportData = filteredEvents.map((a, index) => ({
      '#': index + 1,
      'Timestamp': a.timestamp,
      'Action': a.action,
      'User': a.userName,
      'Module': a.moduleId,
      'Record Reference': a.recordRef,
      'Before': a.previousValue || 'N/A',
      'After': a.newValue || 'N/A',
      'Comment / Reason': a.comment || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Log');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_AUDIT_TRAIL.xlsx`);
  };

  const filteredEvents = events.filter(e => {
    const matchSearch = searchQuery === '' ||
      e.recordRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.comment && e.comment.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchAction = actionFilter === 'ALL' || e.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل التدقيق والتتبع الشامل للنظام (System Audit Trail)' : 'Immutable System Audit Trail'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Immutable Ledger</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic timestamped audit log capturing document creations, status changes, code approvals & revisions
          </p>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export Audit Log</span>
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
            placeholder="Search audit trail by user, reference, or reason..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REVISE">REVISE</option>
          <option value="IMPORT">IMPORT</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User & Authority</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Record Ref</th>
                <th className="py-3 px-3">Previous State</th>
                <th className="py-3 px-3">New State / Diff</th>
                <th className="py-3 px-3">Reason / Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredEvents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    {a.timestamp.replace('T', ' ').substring(0, 19)}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-sans font-bold text-slate-800">
                    {a.userName}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      a.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-900' :
                      a.action === 'CREATE' ? 'bg-blue-100 text-blue-900' :
                      a.action === 'REVISE' ? 'bg-amber-100 text-amber-900' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {a.action}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-sans">
                    {a.moduleId}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                    {a.recordRef}
                  </td>

                  <td className="py-3 px-3 max-w-[160px] truncate text-slate-400">
                    {a.previousValue || '—'}
                  </td>

                  <td className="py-3 px-3 max-w-[180px] truncate text-slate-800 font-bold">
                    {a.newValue || '—'}
                  </td>

                  <td className="py-3 px-3 max-w-[200px] truncate font-sans text-slate-600">
                    {a.comment || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
