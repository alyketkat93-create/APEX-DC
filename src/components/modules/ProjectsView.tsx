'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Project } from '@/types';
import { 
  FolderKanban, Plus, Building2, MapPin, Calendar, 
  Coins, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';

export function ProjectsView() {
  const { projects, currentProjectId, setCurrentProjectId, refreshProjects, language, t } = useProject();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [consultant, setConsultant] = useState('');
  const [contractor, setContractor] = useState('APEX Engineering & Construction JV');
  const [contractValue, setContractValue] = useState<number>(350000000);
  const [plannedCompletion, setPlannedCompletion] = useState('2027-06-30');
  const [type, setType] = useState<any>('Commercial Complex');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !code.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: nameEn,
          nameAr: nameAr || nameEn,
          client: client || 'Private Client / Employer',
          consultant: consultant || 'Supervising Consultant',
          mainContractor: contractor,
          subcontractors: ['Specialized MEP Subcontractor'],
          projectManager: 'Eng. Khalid Al-Mutairi',
          projectEngineer: 'Eng. Majed Al-Zahrani',
          documentController: 'Eng. Aly Ketkat',
          qaQcManager: 'Eng. Sarah Al-Ghamdi',
          location: 'Riyadh, Kingdom of Saudi Arabia',
          contractNumber: `KSA-PRJ-${code}-2026`,
          contractValue,
          currency: 'SAR',
          startDate: new Date().toISOString().split('T')[0],
          plannedCompletionDate: plannedCompletion,
          status: 'Active',
          projectType: type,
          description: `Turnkey execution of ${nameEn}`,
          numberingFormat: '{PROJECT}-{DISC}-{TYPE}-{SEQ:4}-{REV}',
          reviewDurationDays: 14,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        refreshProjects();
        if (json.data?.id) {
          setCurrentProjectId(json.data.id);
        }
      }
    } catch (err) {
      alert('Error creating project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'إدارة المشاريع وبيئات العمل المنفصلة' : 'Projects Management & Isolated Workspaces'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {projects.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent project workspaces, numbering configurations, contractual metadata & document registers
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'ar' ? 'إنشاء مشروع جديد' : 'New Project'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const isSelected = p.id === currentProjectId;
          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                isSelected 
                  ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs bg-navy-900 text-amber-300 px-2.5 py-1 rounded">
                    {p.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {p.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {language === 'ar' ? p.nameAr : p.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client:</span>
                    <span className="font-medium truncate max-w-[180px]">{p.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultant:</span>
                    <span className="font-medium truncate max-w-[180px]">{p.consultant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contract Value:</span>
                    <span className="font-bold font-mono text-slate-900">{Number(p.contractValue).toLocaleString()} {p.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Numbering Rule:</span>
                    <span className="font-mono text-[10px] text-amber-800">{p.numberingFormat}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {isSelected ? (
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Active Workspace</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentProjectId(p.id)}
                    className="text-xs font-bold text-navy-900 hover:text-amber-600 flex items-center gap-1 transition"
                  >
                    <span>Switch to Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create New Construction Project Workspace</h3>
                <div className="text-[11px] text-slate-300">Set up isolated registers & numbering rules</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APX-NEOM-05"
                    className="w-full border border-slate-300 font-mono font-bold rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    <option value="Commercial Complex">Commercial Complex</option>
                    <option value="Luxury Resort">Luxury Resort</option>
                    <option value="Hospital & Healthcare">Hospital & Healthcare</option>
                    <option value="Infrastructure & Metro">Infrastructure & Metro</option>
                    <option value="Residential Compound">Residential Compound</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name (English)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. NEOM Mountain Resort Package 05 (MEP & Utilities)"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name (Arabic - الاسم بالعربية)</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مشروع منتجع نيوم الجبلي - حزمة الأعمال الكهروميكانيكية"
                  className="w-full border border-slate-300 rounded p-2 text-xs text-right font-arabic"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client / Owner</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. NEOM Company"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Consultant</label>
                  <input
                    type="text"
                    value={consultant}
                    onChange={(e) => setConsultant(e.target.value)}
                    placeholder="e.g. AECOM / Buro Happold"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Value (SAR)</label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full border border-slate-300 font-mono rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Planned Completion Date</label>
                  <input
                    type="date"
                    value={plannedCompletion}
                    onChange={(e) => setPlannedCompletion(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
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
                  Create & Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
