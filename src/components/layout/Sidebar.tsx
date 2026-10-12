'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { 
  LayoutDashboard, FolderKanban, Compass, FileCheck2, 
  ClipboardList, PackageCheck, ShieldAlert, Mail, HelpCircle, 
  SendHorizontal, Users2, FileSpreadsheet, GitPullRequest, 
  CheckSquare, BarChart3, Wrench, Settings, Users, 
  History, Archive, Zap, Wind, ChevronRight, ChevronLeft, 
  Sparkles, Layers
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  setCurrentModule: (mod: string) => void;
}

export function Sidebar({ currentModule, setCurrentModule }: SidebarProps) {
  const { t, language, customModules } = useProject();
  const [collapsed, setCollapsed] = useState(false);

  const navSections = [
    {
      group: language === 'ar' ? 'نظرة عامة' : 'Core Hub',
      items: [
        { id: 'dashboard', label: t.modules.dashboard, icon: LayoutDashboard },
        { id: 'projects', label: t.modules.projects, icon: FolderKanban },
      ]
    },
    {
      group: language === 'ar' ? 'الهندسة والمخططات' : 'Drawings & Design',
      items: [
        { id: 'drawings', label: t.modules.drawings, icon: Compass, badge: '3' },
        { id: 'transmittals', label: t.modules.transmittals, icon: SendHorizontal },
      ]
    },
    {
      group: language === 'ar' ? 'الاعتمادات والمواد' : 'Submittals & Approvals',
      items: [
        { id: 'submittals', label: t.modules.submittals, icon: FileCheck2, badge: '2' },
      ]
    },
    {
      group: language === 'ar' ? 'الموقع والفحوصات' : 'Site Inspections',
      items: [
        { id: 'irs', label: t.modules.irs, icon: ClipboardList, badge: '2' },
        { id: 'mirs', label: t.modules.mirs, icon: PackageCheck, badge: '1' },
      ]
    },
    {
      group: language === 'ar' ? 'الجودة والسلامة' : 'Quality (QA/QC)',
      items: [
        { id: 'quality', label: t.modules.quality, icon: ShieldAlert, badge: '1' },
      ]
    },
    {
      group: language === 'ar' ? 'المراسلات والاستفسارات' : 'Communications',
      items: [
        { id: 'correspondence', label: t.modules.correspondence, icon: Mail },
        { id: 'rfis', label: t.modules.rfis, icon: HelpCircle, badge: '1' },
        { id: 'meetings', label: t.modules.meetings, icon: Users2 },
        { id: 'variations', label: t.modules.variations, icon: GitPullRequest },
      ]
    },
    {
      group: language === 'ar' ? 'السجلات والتسليم' : 'Registers & Handover',
      items: [
        { id: 'masterRegister', label: t.modules.masterRegister, icon: FileSpreadsheet },
        { id: 'handover', label: t.modules.handover, icon: PackageCheck },
        { id: 'tasks', label: t.modules.tasks, icon: CheckSquare },
        { id: 'analytics', label: t.modules.analytics, icon: BarChart3 },
      ]
    },
    {
      group: language === 'ar' ? 'السجلات المخصصة' : 'Custom Modules',
      items: [
        ...customModules.map(m => ({
          id: `custom_${m.id}`,
          customModuleId: m.id,
          label: language === 'ar' ? m.nameAr : m.name,
          icon: m.icon === 'Zap' ? Zap : (m.icon === 'Wind' ? Wind : Sparkles),
          isCustom: true,
        })),
        { id: 'customModules', label: t.modules.customModules, icon: Wrench, isBuilder: true },
      ]
    },
    {
      group: language === 'ar' ? 'الإدارة والنظام' : 'Administration',
      items: [
        { id: 'settings', label: t.modules.settings, icon: Settings },
        { id: 'users', label: t.modules.users, icon: Users },
        { id: 'audit', label: t.modules.audit, icon: History },
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#0B1D30] text-slate-300 border-r border-navy-900 flex flex-col transition-all duration-300 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-navy-800 text-xs">
        {!collapsed && (
          <span className="font-bold text-[11px] tracking-wider text-amber-400 uppercase">
            {language === 'ar' ? 'الوحدات الإنشائية' : 'SYSTEM MODULES'}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-navy-800 text-slate-400 hover:text-white transition ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-navy-700">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.group}
              </div>
            )}
            {sec.items.map((item: any) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentModule(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium transition text-left group ${
                    isActive
                      ? 'bg-amber-500 text-navy-950 font-bold shadow-sm'
                      : 'hover:bg-navy-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-navy-950' : (item.isCustom ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400')
                  }`} />
                  {!collapsed && (
                    <span className="truncate flex-1 text-[12px]">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-navy-950 text-amber-300' : 'bg-navy-800 text-amber-400 border border-navy-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && item.isCustom && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-navy-800 text-[10px] text-slate-400 bg-[#081524]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400">APEX DC v3.4 Enterprise</span>
            <span className="text-emerald-400 font-mono">Live DB</span>
          </div>
          <div className="text-slate-400 text-[9px] mt-0.5">ACID Persistence • Full Audit Trail</div>
        </div>
      )}
    </aside>
  );
}
