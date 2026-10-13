'use client';

import React, { useState, useEffect } from 'react';
import { AuditEvent } from '@/types';
import { History, ShieldCheck, RefreshCw, Calendar, Link2, Share2, AlertCircle } from 'lucide-react';
import { formatDateSafe } from '@/lib/dateUtils';

interface RecordAuditHistoryProps {
  recordId: string;
  recordRef?: string;
  projectId?: string;
  language?: 'en' | 'ar';
}

export function RecordAuditHistory({ recordId, recordRef, projectId, language = 'en' }: RecordAuditHistoryProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditEvents = async () => {
    if (!recordId && !recordRef) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recordId) params.append('recordId', recordId);
      if (recordRef) params.append('recordRef', recordRef);
      if (projectId) params.append('projectId', projectId);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data);
      }
    } catch (e) {
      console.error('Error fetching record audit events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [recordId, recordRef]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DATE_CORRECTION':
        return { label: 'Date Correction', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'LINK_ADD':
        return { label: 'Link Added', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'LINK_UPDATE':
        return { label: 'Link Updated', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'LINK_DELETE':
        return { label: 'Link Removed', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'RECORD_LINK':
        return { label: 'Record Linked', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'CREATE':
        return { label: 'Created', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'SUBMIT':
        return { label: 'Submitted', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 'APPROVE':
        return { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'REJECT':
        return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'REVISE':
        return { label: 'Revised', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        return { label: action, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <h4 className="font-bold text-xs text-slate-900">
              {language === 'ar' ? 'سجل التدقيق والرقابة غير القابل للتعديل' : 'Immutable Audit & Traceability Log'}
            </h4>
            <p className="text-[10px] text-slate-500">
              Complete historical record of date corrections, links, and workflow transitions
            </p>
          </div>
        </div>

        <button
          onClick={fetchAuditEvents}
          disabled={loading}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          title="Refresh audit history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-4 text-center text-slate-400 text-xs">Loading audit trail...</div>
      ) : events.length === 0 ? (
        <div className="py-4 text-center text-slate-400 text-xs bg-slate-50/50 rounded-lg">
          No audit history events recorded for this record yet.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {events.map((ev) => {
            const badge = getActionBadge(ev.action);
            const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '';
            return (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="font-semibold text-slate-800">{ev.userName}</span>
                    {ev.fieldChanged && (
                      <span className="text-[10px] font-mono text-slate-500">
                        [{ev.fieldChanged}]
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateSafe(ev.timestamp)} {timeStr}
                  </span>
                </div>

                {(ev.previousValue || ev.newValue) && (
                  <div className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-100 font-mono mt-1 flex flex-wrap gap-x-2">
                    {ev.previousValue && (
                      <span>Prev: <s className="text-slate-400">{ev.previousValue}</s></span>
                    )}
                    {ev.newValue && (
                      <span className="text-emerald-700 font-bold">New: {ev.newValue}</span>
                    )}
                  </div>
                )}

                {(ev.reason || ev.comment) && (
                  <div className="text-[11px] text-slate-700 italic">
                    Reason: <b>{ev.reason || ev.comment}</b>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
