'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, User, NotificationItem, CustomModuleDefinition } from '@/types';
import { translations, Language } from '@/lib/i18n';

interface ProjectContextType {
  projects: Project[];
  currentProjectId: string;
  currentProject: Project | null;
  setCurrentProjectId: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: typeof translations.en;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  markNotificationRead: (id: string) => void;
  customModules: CustomModuleDefinition[];
  refreshCustomModules: () => void;
  refreshProjects: () => void;
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string>('prj-ksp-01');
  const [language, setLanguageState] = useState<Language>('en');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Eng. Aly Ketkat',
    nameAr: 'م. علي قطقط',
    email: 'aly.ketkat@apexdc.com',
    role: 'Document Control Manager',
    company: 'APEX Engineering & Construction PMO',
    phone: '+966 50 123 4567',
    active: true,
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [customModules, setCustomModules] = useState<CustomModuleDefinition[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const t = translations[language];

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success && json.data) {
        setProjects(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  };

  const fetchCustomModules = async () => {
    try {
      const res = await fetch('/api/custom-modules');
      const json = await res.json();
      if (json.success && json.data) {
        setCustomModules(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch custom modules', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchCustomModules();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [currentProjectId]);

  const setCurrentProjectId = (id: string) => {
    setCurrentProjectIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_current_project_id', id);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Error marking notification read', e);
    }
  };

  const currentProject = projects.find(p => p.id === currentProjectId) || (projects.length > 0 ? projects[0] : null);
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProjectId,
        currentProject,
        setCurrentProjectId,
        language,
        setLanguage,
        dir,
        t,
        currentUser,
        users,
        setCurrentUser,
        notifications,
        unreadNotifsCount,
        markNotificationRead,
        customModules,
        refreshCustomModules: fetchCustomModules,
        refreshProjects: fetchProjects,
        quickCreateOpen,
        setQuickCreateOpen,
        globalSearch,
        setGlobalSearch,
      }}
    >
      <div dir={dir} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
