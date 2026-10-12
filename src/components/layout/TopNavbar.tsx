'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  Building2, Search, Plus, Bell, CheckSquare, ShieldCheck, 
  Globe, ChevronDown, UserCircle2, Layers, Briefcase, FileText, 
  ClipboardCheck, Mail, Send, AlertTriangle, Calendar, Sparkles
} from 'lucide-react';

export function TopNavbar() {
  const { 
    projects, currentProjectId, currentProject, setCurrentProjectId, 
    language, setLanguage, t, currentUser, users, setCurrentUser, 
    notifications, unreadNotifsCount, markNotificationRead,
    setQuickCreateOpen, globalSearch, setGlobalSearch 
  } = useProject();

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F2744] text-white border-b border-navy-800 shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        {/* Left: Brand & Project Selector */}
        <div className="flex items-center gap-4 min-w-[280px]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-inner font-bold text-lg tracking-wider text-navy-950">
              AX
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-wide text-base leading-none">
                <span>APEX DC</span>
                <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  HUB
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {language === 'ar' ? 'التحكم بالمستندات الإنشائية' : 'Enterprise Document Control'}
              </div>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-navy-800/90 hover:bg-navy-700 border border-navy-600 text-slate-200 transition-colors max-w-[260px]"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-semibold">
                {currentProject ? (language === 'ar' ? currentProject.code : currentProject.code) : t.allProjects}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
            </button>

            {projectMenuOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-72 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setProjectMenuOpen(false)}
              >
                <div className="px-3 py-1.5 font-semibold text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                  {t.selectProject}
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex flex-col hover:bg-slate-50 transition-colors ${
                      p.id === currentProjectId ? 'bg-amber-50/80 border-l-4 border-amber-500 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{p.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{p.status}</span>
                    </div>
                    <span className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      {language === 'ar' ? p.nameAr : p.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={t.globalSearch}
              className="w-full bg-navy-900/80 text-slate-200 placeholder-slate-400 text-xs rounded-lg pl-9 pr-4 py-2 border border-navy-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>
        </div>

        {/* Right: Quick Create, Badges, Lang Switcher, User Role */}
        <div className="flex items-center gap-2">
          {/* Quick Create Button */}
          <button
            onClick={() => setQuickCreateOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs shadow transition active:scale-95"
            title="Create new document"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.quickCreate}</span>
          </button>

          {/* Pending Approvals Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-800/80 border border-navy-700 text-xs text-amber-300" title="Pending Consultant & Internal Approvals">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">3</span>
            <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'معلق' : 'Pending'}</span>
          </div>

          {/* Tasks Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-800/80 border border-navy-700 text-xs text-emerald-300" title="My Active Tasks">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">2</span>
            <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'مهام' : 'Tasks'}</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              className="relative p-1.5 rounded-md hover:bg-navy-800 text-slate-300 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-navy-950 animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in"
                onMouseLeave={() => setNotifMenuOpen(false)}
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-700">
                  <span>{t.notifications}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {unreadNotifsCount} {language === 'ar' ? 'جديد' : 'New'}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition ${!n.isRead ? 'bg-amber-50/50' : ''}`}
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900 mb-0.5">
                          <span>{language === 'ar' ? n.titleAr : n.title}</span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {language === 'ar' ? n.messageAr : n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-navy-800/90 hover:bg-navy-700 border border-navy-600 text-amber-300 transition"
            title="Toggle Arabic / English"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded bg-navy-800 hover:bg-navy-700 border border-navy-700 transition"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left text-xs">
                <div className="font-semibold text-slate-100 leading-tight">
                  {language === 'ar' && currentUser.nameAr ? currentUser.nameAr : currentUser.name}
                </div>
                <div className="text-[10px] text-amber-300 leading-tight">{currentUser.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <div className="font-bold text-slate-900">
                    {language === 'ar' && currentUser.nameAr ? currentUser.nameAr : currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  <div className="text-[10px] font-semibold text-amber-700 mt-0.5">{currentUser.company}</div>
                </div>

                <div className="px-3 py-1.5 font-bold text-slate-400 uppercase text-[9px] tracking-wider">
                  {t.switchRole}
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                      u.id === currentUser.id ? 'bg-amber-50 text-amber-900 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {language === 'ar' && u.nameAr ? u.nameAr : u.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{u.role}</div>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
