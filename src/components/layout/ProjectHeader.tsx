'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  Building, User, Shield, HardHat, FileText, Calendar, 
  Coins, MapPin, ChevronDown, ChevronUp, Layers, CheckCircle2 
} from 'lucide-react';

export function ProjectHeader() {
  const { currentProject, language, t } = useProject();
  const [expanded, setExpanded] = useState(false);

  if (!currentProject) return null;

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs px-4 py-3 transition-all">
      {/* Primary Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-900 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-navy-700 shadow-sm text-sm">
            {currentProject.code.split('-')[1] || 'PRJ'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base lg:text-lg leading-tight">
                {language === 'ar' ? currentProject.nameAr : currentProject.name}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                {currentProject.code}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {currentProject.status}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-navy-50 text-navy-800 border border-navy-100">
                {currentProject.projectType}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Building className="w-3 h-3 text-blue-600" />
                <span>{currentProject.buildings?.length || 0} {language === 'ar' ? 'مباني' : 'Buildings'}</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-600" />
                <span>{currentProject.floors?.length || 0} {language === 'ar' ? 'مستويات' : 'Levels'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700 font-medium">{t.projectHeader.client}:</strong> {currentProject.client}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700 font-medium">{t.projectHeader.consultant}:</strong> {currentProject.consultant}
              </span>
              <span className="flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700 font-medium">{t.projectHeader.contractor}:</strong> {currentProject.mainContractor}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Planned Completion</div>
            <div className="text-xs font-bold text-slate-800 font-mono">{currentProject.plannedCompletionDate}</div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded font-medium transition"
          >
            <span>{expanded ? (language === 'ar' ? 'إخفاء التفاصيل' : 'Less Info') : (language === 'ar' ? 'المزيد من بيانات المشروع' : 'Project Specs')}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Project Metadata Panel */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs animate-in fade-in">
          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.projectHeader.pm}</div>
            <div className="font-semibold text-slate-800 truncate mt-0.5">{currentProject.projectManager}</div>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.projectHeader.dcManager}</div>
            <div className="font-semibold text-slate-800 truncate mt-0.5">{currentProject.documentController}</div>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">QA/QC Manager</div>
            <div className="font-semibold text-slate-800 truncate mt-0.5">{currentProject.qaQcManager}</div>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.projectHeader.contractValue}</div>
            <div className="font-bold text-slate-900 font-mono mt-0.5">
              {Number(currentProject.contractValue).toLocaleString()} {currentProject.currency}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Contract Number</div>
            <div className="font-semibold text-slate-800 font-mono truncate mt-0.5">{currentProject.contractNumber}</div>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Numbering Format</div>
            <div className="font-mono text-[11px] text-amber-700 truncate mt-0.5">{currentProject.numberingFormat}</div>
          </div>

          {/* Configured Buildings & Floors Overview */}
          {currentProject.buildings && currentProject.buildings.length > 0 && (
            <div className="col-span-2 sm:col-span-3 lg:col-span-6 bg-slate-50 p-2.5 rounded border border-slate-200 mt-1">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-blue-600" />
                <span>{language === 'ar' ? 'المباني والمناطق المهيأة في المشروع' : 'Configured Project Buildings & Zones'}:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentProject.buildings.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                    <span className="font-mono font-bold text-[10px] bg-navy-900 text-amber-300 px-1 rounded">{b.code}</span>
                    <span>{language === 'ar' ? (b.nameAr || b.name) : b.name}</span>
                    <span className="text-[10px] text-slate-400">({b.floors?.length || currentProject.floors?.length || 0} lvls)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
