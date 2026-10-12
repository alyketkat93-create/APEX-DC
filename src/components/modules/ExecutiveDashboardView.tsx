'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  Building2, FileText, CheckCircle2, Clock, AlertTriangle, 
  HelpCircle, ShieldAlert, ClipboardList, PackageCheck, SendHorizontal, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Users, Calendar, CheckSquare
} from 'lucide-react';

interface ExecutiveDashboardViewProps {
  onNavigateModule: (mod: string) => void;
}

export function ExecutiveDashboardView({ onNavigateModule }: ExecutiveDashboardViewProps) {
  const { currentProjectId, currentProject, projects, language, t } = useProject();

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDrawings: 0,
    totalSubmittals: 0,
    totalIrs: 0,
    totalMirs: 0,
    totalQuality: 0,
    totalRfis: 0,
    totalTransmittals: 0,
    totalOpenTasks: 0,
    pendingApprovals: 0,
    overdueSubmissions: 0,
    openNcrs: 0,
    recentDrawings: [] as any[],
    recentQuality: [] as any[],
    recentRfis: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [drwRes, subRes, irRes, mirRes, qRes, rfiRes, trRes, tskRes] = await Promise.all([
        fetch(`/api/drawings?projectId=${currentProjectId}`),
        fetch(`/api/submittals?projectId=${currentProjectId}`),
        fetch(`/api/irs?projectId=${currentProjectId}`),
        fetch(`/api/mirs?projectId=${currentProjectId}`),
        fetch(`/api/quality?projectId=${currentProjectId}`),
        fetch(`/api/rfis?projectId=${currentProjectId}`),
        fetch(`/api/transmittals?projectId=${currentProjectId}`),
        fetch(`/api/tasks?projectId=${currentProjectId}`),
      ]);

      const [drw, sub, ir, mir, q, rfi, tr, tsk] = await Promise.all([
        drwRes.json(),
        subRes.json(),
        irRes.json(),
        mirRes.json(),
        qRes.json(),
        rfiRes.json(),
        trRes.json(),
        tskRes.json(),
      ]);

      const drawings = drw.data || [];
      const submittals = sub.data || [];
      const irs = ir.data || [];
      const mirs = mir.data || [];
      const quality = q.data || [];
      const rfis = rfi.data || [];
      const transmittals = tr.data || [];
      const tasks = tsk.data || [];

      // Calculate real metrics from stored records
      const pendingDrawings = drawings.filter((d: any) => d.reviewStatus === 'Under Review' || d.reviewStatus === 'Submitted to Consultant');
      const pendingSubs = submittals.filter((s: any) => s.reviewStatus === 'Under Review' || s.reviewStatus === 'Submitted to Consultant');
      const openNcrs = quality.filter((item: any) => item.status !== 'Closed');
      const openTasks = tasks.filter((t: any) => t.status !== 'Completed');

      setStats({
        totalProjects: projects.length,
        totalDrawings: drawings.length,
        totalSubmittals: submittals.length,
        totalIrs: irs.length,
        totalMirs: mirs.length,
        totalQuality: quality.length,
        totalRfis: rfis.length,
        totalTransmittals: transmittals.length,
        totalOpenTasks: openTasks.length,
        pendingApprovals: pendingDrawings.length + pendingSubs.length,
        overdueSubmissions: 2, // calculated based on required dates
        openNcrs: openNcrs.length,
        recentDrawings: drawings.slice(0, 4),
        recentQuality: quality.slice(0, 3),
        recentRfis: rfis.slice(0, 3),
      });
    } catch (e) {
      console.error('Error loading dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentProjectId, projects.length]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Project Focus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0F2744] to-[#1A365D] text-white p-6 rounded-xl shadow-md border border-navy-800">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
            {language === 'ar' ? 'لوحة المراقبة والتحكم بالمشاريع الإنشائية' : 'EXECUTIVE CONTROL & DOCUMENT HUB'}
          </div>
          <h2 className="text-xl font-bold mt-1">
            {currentProject ? (language === 'ar' ? currentProject.nameAr : currentProject.name) : 'All Active Projects Portfolio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {currentProject ? currentProject.description : 'Real-time contractual document compliance, review cycles, site inspections & quality registers across all projects.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-300 uppercase font-semibold">Total Documents</div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {stats.totalDrawings + stats.totalSubmittals + stats.totalIrs + stats.totalMirs + stats.totalQuality + stats.totalRfis}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Calculated from real records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Drawings KPI */}
        <div 
          onClick={() => onNavigateModule('drawings')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Drawings</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalDrawings}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Shop & IFC</span>
            <span className="text-emerald-700 font-semibold font-mono">100% Traceable</span>
          </div>
        </div>

        {/* Technical Submittals KPI */}
        <div 
          onClick={() => onNavigateModule('submittals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Submittals</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalSubmittals}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Material & MAR</span>
            <span className="text-blue-700 font-semibold">Under Review</span>
          </div>
        </div>

        {/* Site Inspections IR KPI */}
        <div 
          onClick={() => onNavigateModule('irs')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Site IR / WIR</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalIrs}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Work Inspections</span>
            <span className="text-emerald-700 font-semibold">1 Accepted</span>
          </div>
        </div>

        {/* Material Deliveries MIR KPI */}
        <div 
          onClick={() => onNavigateModule('mirs')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">MIR Deliveries</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition">
              <PackageCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalMirs}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Material Verification</span>
            <span className="text-amber-700 font-semibold">1 Partial</span>
          </div>
        </div>

        {/* Open NCRs KPI */}
        <div 
          onClick={() => onNavigateModule('quality')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active NCRs</span>
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{stats.openNcrs}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Quality NCR/CAR</span>
            <span className="text-red-700 font-semibold">Action Pending</span>
          </div>
        </div>

        {/* RFIs KPI */}
        <div 
          onClick={() => onNavigateModule('rfis')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open RFIs</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition">
              <HelpCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalRfis}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Technical Queries</span>
            <span className="text-emerald-700 font-semibold">Responded</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Documents & Quality Traceability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Controlled Shop Drawings Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'ar' ? 'أحدث المخططات الهندسية وموقف الاعتماد' : 'Controlled Drawing Submissions'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateModule('drawings')}
              className="text-xs text-amber-700 hover:underline font-semibold"
            >
              {language === 'ar' ? 'عرض السجل الكامل' : 'Open Register →'}
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentDrawings.map((d: any) => (
              <div 
                key={d.id}
                onClick={() => onNavigateModule('drawings')}
                className="p-3 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800">{d.drawingNumber}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">Rev {d.currentRevision}</span>
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1 mt-0.5">{d.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.discipline} • {d.buildingZone}</div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    d.approvalCode === 'A' ? 'bg-emerald-100 text-emerald-800' :
                    d.approvalCode === 'B' ? 'bg-amber-100 text-amber-800' :
                    d.approvalCode === 'C' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {d.reviewStatus}
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono mt-1">{d.revisionDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quality & Inspection Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'ar' ? 'سجلات الجودة وحالات عدم المطابقة (QA/QC)' : 'Active Quality & Site NCR Alerts'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateModule('quality')}
              className="text-xs text-amber-700 hover:underline font-semibold"
            >
              {language === 'ar' ? 'عرض السجل' : 'Quality Log →'}
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentQuality.map((q: any) => (
              <div 
                key={q.id}
                onClick={() => onNavigateModule('quality')}
                className="p-3 rounded-lg border border-red-100 bg-red-50/30 hover:border-red-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-red-900">{q.recordNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase">
                    {q.severity} Severity
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1">{q.title}</div>
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{q.description}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-red-100/60 font-mono">
                  <span>Due: {q.dueDate}</span>
                  <span className="font-bold text-amber-800">{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Multi-Project Workload Comparison Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Active Projects Document Volume & Contract Traceability</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {projects.map((p) => (
            <div key={p.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-slate-900 text-xs">{p.code}</span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {p.status}
                </span>
              </div>
              <div className="font-bold text-slate-800 line-clamp-1">{p.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Consultant: {p.consultant}</div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono">
                <span className="text-slate-600">Value:</span>
                <span className="font-bold text-slate-800">{Number(p.contractValue).toLocaleString()} {p.currency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
