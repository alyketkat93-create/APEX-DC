'use client';

import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  X, Compass, FileCheck2, ClipboardList, PackageCheck, 
  HelpCircle, Mail, SendHorizontal, ShieldAlert, Users2, 
  CheckSquare, FolderPlus, Wrench, Sparkles, ArrowRight
} from 'lucide-react';

interface QuickCreateModalProps {
  onSelectAction: (actionType: string) => void;
}

export function QuickCreateModal({ onSelectAction }: QuickCreateModalProps) {
  const { quickCreateOpen, setQuickCreateOpen, language, currentProject, customModules } = useProject();

  if (!quickCreateOpen) return null;

  const actions = [
    { id: 'new_drawing', label: language === 'ar' ? 'مخطط ورشة هندسي جديد' : 'New Shop / IFC Drawing', desc: 'Create controlled drawing with automatic code numbering & revision P01', icon: Compass, color: 'text-blue-500 bg-blue-50' },
    { id: 'new_submittal', label: language === 'ar' ? 'اعتماد فني للمواد والمعدات' : 'New Technical Submittal', desc: 'Material submittal, MAR, catalog, or compliance sheet', icon: FileCheck2, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'new_ir', label: language === 'ar' ? 'طلب فحص أعمال (IR / WIR)' : 'New Inspection Request (IR)', desc: 'Work inspection request for civil, MEP, or pressure test', icon: ClipboardList, color: 'text-purple-500 bg-purple-50' },
    { id: 'new_mir', label: language === 'ar' ? 'طلب فحص وتوريد مواد (MIR)' : 'New Material Inspection (MIR)', desc: 'Record incoming delivery, accepted/rejected quantities & MTC', icon: PackageCheck, color: 'text-amber-500 bg-amber-50' },
    { id: 'new_rfi', label: language === 'ar' ? 'طلب استفسار فني (RFI)' : 'New Request for Information (RFI)', desc: 'Formal technical query with drawing references and cost/time impact', icon: HelpCircle, color: 'text-indigo-500 bg-indigo-50' },
    { id: 'new_letter', label: language === 'ar' ? 'خطاب مراسلة رسمية' : 'New Formal Correspondence', desc: 'Incoming or outgoing contractual letter with project letterhead', icon: Mail, color: 'text-sky-500 bg-sky-50' },
    { id: 'new_transmittal', label: language === 'ar' ? 'مذكرة إرسال مستندات (Transmittal)' : 'New Document Transmittal', desc: 'Bundle drawings and submittals into formal transmittal slip', icon: SendHorizontal, color: 'text-teal-500 bg-teal-50' },
    { id: 'new_ncr', label: language === 'ar' ? 'تقرير عدم مطابقة (NCR)' : 'New Non-Conformance Report (NCR)', desc: 'Record quality defect, severity, root cause, and corrective action', icon: ShieldAlert, color: 'text-red-500 bg-red-50' },
    { id: 'new_meeting', label: language === 'ar' ? 'محضر اجتماع ومتابعة المهام (MOM)' : 'New Meeting Minutes (MOM)', desc: 'Record coordination meeting, attendees, decisions & action items', icon: Users2, color: 'text-violet-500 bg-violet-50' },
    { id: 'new_task', label: language === 'ar' ? 'مهمة عمل جديدة' : 'New Project Task', desc: 'Assign document follow-up task with checklist and due date', icon: CheckSquare, color: 'text-rose-500 bg-rose-50' },
    { id: 'new_project', label: language === 'ar' ? 'مشروع جديد' : 'New Project Workspace', desc: 'Setup new construction project with numbering rules and team', icon: FolderPlus, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-navy-900 text-white">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {language === 'ar' ? 'إنشاء مستند أو سجل جديد' : 'Global Quick Create'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentProject ? `${currentProject.code} — ${language === 'ar' ? currentProject.nameAr : currentProject.name}` : 'Select Document Type'}
            </p>
          </div>
          <button
            onClick={() => setQuickCreateOpen(false)}
            className="p-1 rounded-lg hover:bg-navy-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onSelectAction(act.id);
                  }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition group"
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-amber-800 flex items-center justify-between">
                      <span>{act.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {act.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Modules Options */}
          {customModules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {language === 'ar' ? 'السجلات المخصصة المتاحة' : 'Available Custom Registers'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customModules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setQuickCreateOpen(false);
                      onSelectAction(`new_custom_${m.id}`);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition text-xs font-semibold text-slate-800"
                  >
                    <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{language === 'ar' ? m.nameAr : m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
