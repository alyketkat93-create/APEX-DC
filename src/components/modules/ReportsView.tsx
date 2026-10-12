'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  BarChart3, PieChart, TrendingUp, Download, Calendar, 
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileText
} from 'lucide-react';

export function ReportsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [stats, setStats] = useState({
    drawingsCount: 0,
    drawingsApproved: 0,
    drawingsPending: 0,
    subsApproved: 0,
    subsPending: 0,
    irAccepted: 0,
    irRejected: 0,
    mirDeliveredTotal: 0,
    mirAcceptedTotal: 0,
    mirRejectedTotal: 0,
  });

  const fetchStats = async () => {
    try {
      const [drwRes, subRes, irRes, mirRes] = await Promise.all([
        fetch(`/api/drawings?projectId=${currentProjectId}`),
        fetch(`/api/submittals?projectId=${currentProjectId}`),
        fetch(`/api/irs?projectId=${currentProjectId}`),
        fetch(`/api/mirs?projectId=${currentProjectId}`),
      ]);

      const [drw, sub, ir, mir] = await Promise.all([
        drwRes.json(),
        subRes.json(),
        irRes.json(),
        mirRes.json(),
      ]);

      const drawings = drw.data || [];
      const submittals = sub.data || [];
      const irs = ir.data || [];
      const mirs = mir.data || [];

      const drawingsApproved = drawings.filter((d: any) => d.approvalCode === 'A' || d.approvalCode === 'B').length;
      const subsApproved = submittals.filter((s: any) => s.reviewStatus.includes('Code A') || s.reviewStatus.includes('Code B')).length;
      const irAccepted = irs.filter((i: any) => i.result === 'Accepted' || i.result === 'Accepted with Comments').length;
      const irRejected = irs.filter((i: any) => i.result === 'Rejected').length;

      let mirDel = 0, mirAcc = 0, mirRej = 0;
      mirs.forEach((m: any) => {
        mirDel += (m.quantityDelivered || 0);
        mirAcc += (m.quantityAccepted || 0);
        mirRej += (m.quantityRejected || 0);
      });

      setStats({
        drawingsCount: drawings.length,
        drawingsApproved,
        drawingsPending: drawings.length - drawingsApproved,
        subsApproved,
        subsPending: submittals.length - subsApproved,
        irAccepted,
        irRejected,
        mirDeliveredTotal: mirDel,
        mirAcceptedTotal: mirAcc,
        mirRejectedTotal: mirRej,
      });
    } catch (e) {
      console.error('Error fetching analytics stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentProjectId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'التقارير التحليلية ومؤشرات الأداء (KPIs & Analytics)' : 'Project Reports & Performance Analytics'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Contractual KPIs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown of approval turnaround times, inspection acceptance ratios, and material delivery logs
          </p>
        </div>
      </div>

      {/* Analytics Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Widget 1: Drawing Approval Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs uppercase text-slate-700">Drawing Approval Ratio</h3>
            <span className="font-mono text-xs font-bold text-emerald-700">
              {stats.drawingsCount > 0 ? `${Math.round((stats.drawingsApproved / stats.drawingsCount) * 100)}%` : '0%'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Code A & B Approved:</span>
              <span className="font-mono font-bold text-emerald-700">{stats.drawingsApproved}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.drawingsCount > 0 ? (stats.drawingsApproved / stats.drawingsCount) * 100 : 0}%` }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-600">Pending Consultant Review:</span>
              <span className="font-mono font-bold text-amber-700">{stats.drawingsPending}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.drawingsCount > 0 ? (stats.drawingsPending / stats.drawingsCount) * 100 : 0}%` }}
                className="bg-amber-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Widget 2: Site Inspection First-Time Pass Ratio */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs uppercase text-slate-700">Site IR Pass / Reject Ratio</h3>
            <span className="font-mono text-xs font-bold text-purple-700">
              {stats.irAccepted + stats.irRejected > 0 ? `${Math.round((stats.irAccepted / (stats.irAccepted + stats.irRejected)) * 100)}% Pass` : '—'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Accepted Inspections:</span>
              <span className="font-mono font-bold text-emerald-700">{stats.irAccepted}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.irAccepted + stats.irRejected > 0 ? (stats.irAccepted / (stats.irAccepted + stats.irRejected)) * 100 : 0}%` }}
                className="bg-purple-600 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-600">Rejected / Reinspection Linked:</span>
              <span className="font-mono font-bold text-red-600">{stats.irRejected}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.irAccepted + stats.irRejected > 0 ? (stats.irRejected / (stats.irAccepted + stats.irRejected)) * 100 : 0}%` }}
                className="bg-red-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Widget 3: Material Consignment Quantity Verification */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs uppercase text-slate-700">MIR Material Quantity Log</h3>
            <span className="font-mono text-xs font-bold text-amber-700">
              {stats.mirDeliveredTotal.toLocaleString()} Units
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Accepted Material Quantity:</span>
              <span className="font-mono font-bold text-emerald-700">{stats.mirAcceptedTotal.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.mirDeliveredTotal > 0 ? (stats.mirAcceptedTotal / stats.mirDeliveredTotal) * 100 : 0}%` }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-600">Rejected & Quarantined:</span>
              <span className="font-mono font-bold text-red-600">{stats.mirRejectedTotal.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats.mirDeliveredTotal > 0 ? (stats.mirRejectedTotal / stats.mirDeliveredTotal) * 100 : 0}%` }}
                className="bg-red-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
