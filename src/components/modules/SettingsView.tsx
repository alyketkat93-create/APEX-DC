'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  Settings, Save, Hash, Clock, ShieldCheck, CheckCircle2, 
  Layers, RefreshCw, FileText
} from 'lucide-react';

export function SettingsView() {
  const { currentProject, language, t } = useProject();

  const [numberingPattern, setNumberingPattern] = useState(
    currentProject?.numberingFormat || '{PROJECT}-{DISC}-{TYPE}-{SEQ:4}-{REV}'
  );
  const [reviewDays, setReviewDays] = useState(currentProject?.reviewDurationDays || 14);
  const [dwgPrefix, setDwgPrefix] = useState('DWG');
  const [subPrefix, setSubPrefix] = useState('SUB');
  const [irPrefix, setIrPrefix] = useState('IR');
  const [mirPrefix, setMirPrefix] = useState('MIR');
  const [ncrPrefix, setNcrPrefix] = useState('NCR');
  const [corPrefix, setCorPrefix] = useState('COR');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'إعدادات التحكم بالمستندات ونظام الترقيم' : 'Document Control Settings & Numbering Engine'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure project-level document numbering conventions, default consultant review periods, and discipline codes
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Numbering Format Pattern Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
            <Hash className="w-4 h-4 text-amber-500" />
            <span>Standard Project Numbering Rule</span>
          </h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Configurable Numbering Pattern</label>
            <input
              type="text"
              value={numberingPattern}
              onChange={(e) => setNumberingPattern(e.target.value)}
              className="w-full font-mono font-bold text-amber-900 bg-slate-50 border border-slate-300 rounded p-2.5 text-xs"
            />
            <div className="text-[11px] text-slate-400 mt-1">
              Supported tokens: {'{PROJECT}'}, {'{DISC}'}, {'{TYPE}'}, {'{SEQ:4}'}, {'{REV}'}, {'{YEAR}'}
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
            <div className="font-bold text-amber-900 text-xs">Live Generated Output Sample:</div>
            <div className="font-mono text-sm font-bold text-navy-950 mt-1">
              APX-KSP-03-MEP-HVAC-DWG-0042-P01
            </div>
          </div>
        </div>

        {/* Review Periods & Deadlines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Contractual Review Periods & Overdue Triggers</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Consultant Review Duration (Calendar Days)</label>
              <input
                type="number"
                value={reviewDays}
                onChange={(e) => setReviewDays(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                required
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Submissions automatically flag as overdue in MDR and dashboard when this duration lapses.
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">RFI Urgent Response Window (Calendar Days)</label>
              <input
                type="number"
                defaultValue={7}
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Document Type Code Prefixes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Document Type Code Abbreviations</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Drawings Prefix</label>
              <input
                type="text"
                value={dwgPrefix}
                onChange={(e) => setDwgPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Submittals Prefix</label>
              <input
                type="text"
                value={subPrefix}
                onChange={(e) => setSubPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">IR (Inspection Request)</label>
              <input
                type="text"
                value={irPrefix}
                onChange={(e) => setIrPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MIR (Material Inspection)</label>
              <input
                type="text"
                value={mirPrefix}
                onChange={(e) => setMirPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">NCR Prefix</label>
              <input
                type="text"
                value={ncrPrefix}
                onChange={(e) => setNcrPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Correspondence Prefix</label>
              <input
                type="text"
                value={corPrefix}
                onChange={(e) => setCorPrefix(e.target.value)}
                className="w-full border border-slate-300 font-mono font-bold rounded p-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded-lg text-xs shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Numbering & Project Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
