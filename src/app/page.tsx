'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { ProjectHeader } from '@/components/layout/ProjectHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { QuickCreateModal } from '@/components/layout/QuickCreateModal';

// Dedicated Module Views
import { ExecutiveDashboardView } from '@/components/modules/ExecutiveDashboardView';
import { ProjectsView } from '@/components/modules/ProjectsView';
import { DrawingsView } from '@/components/modules/DrawingsView';
import { SubmittalsView } from '@/components/modules/SubmittalsView';
import { InspectionRequestsView } from '@/components/modules/InspectionRequestsView';
import { MaterialInspectionsView } from '@/components/modules/MaterialInspectionsView';
import { QualityView } from '@/components/modules/QualityView';
import { CorrespondenceView } from '@/components/modules/CorrespondenceView';
import { RfisView } from '@/components/modules/RfisView';
import { TransmittalsView } from '@/components/modules/TransmittalsView';
import { MeetingsView } from '@/components/modules/MeetingsView';
import { VariationsView } from '@/components/modules/VariationsView';
import { HandoverView } from '@/components/modules/HandoverView';
import { MasterRegisterView } from '@/components/modules/MasterRegisterView';
import { TasksView } from '@/components/modules/TasksView';
import { ReportsView } from '@/components/modules/ReportsView';
import { CustomModuleBuilderView } from '@/components/modules/CustomModuleBuilderView';
import { CustomRecordView } from '@/components/modules/CustomRecordView';
import { SettingsView } from '@/components/modules/SettingsView';
import { UsersView } from '@/components/modules/UsersView';
import { AuditView } from '@/components/modules/AuditView';

export default function HomePage() {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  const handleQuickCreateAction = (actionType: string) => {
    if (actionType === 'new_drawing') setCurrentModule('drawings');
    else if (actionType === 'new_submittal') setCurrentModule('submittals');
    else if (actionType === 'new_ir') setCurrentModule('irs');
    else if (actionType === 'new_mir') setCurrentModule('mirs');
    else if (actionType === 'new_ncr') setCurrentModule('quality');
    else if (actionType === 'new_letter') setCurrentModule('correspondence');
    else if (actionType === 'new_rfi') setCurrentModule('rfis');
    else if (actionType === 'new_transmittal') setCurrentModule('transmittals');
    else if (actionType === 'new_meeting') setCurrentModule('meetings');
    else if (actionType === 'new_task') setCurrentModule('tasks');
    else if (actionType === 'new_project') setCurrentModule('projects');
    else if (actionType.startsWith('new_custom_')) {
      const customId = actionType.replace('new_custom_', '');
      setCurrentModule(`custom_${customId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentModule={currentModule}
          setCurrentModule={setCurrentModule}
        />

        {/* Working Surface Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Prominent Project Identification Header */}
          <ProjectHeader />

          {/* Module Working Canvas */}
          <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
            {currentModule === 'dashboard' && (
              <ExecutiveDashboardView onNavigateModule={setCurrentModule} />
            )}
            {currentModule === 'projects' && <ProjectsView />}
            {currentModule === 'drawings' && <DrawingsView />}
            {currentModule === 'submittals' && <SubmittalsView />}
            {currentModule === 'irs' && <InspectionRequestsView />}
            {currentModule === 'mirs' && <MaterialInspectionsView />}
            {currentModule === 'quality' && <QualityView />}
            {currentModule === 'correspondence' && <CorrespondenceView />}
            {currentModule === 'rfis' && <RfisView />}
            {currentModule === 'transmittals' && <TransmittalsView />}
            {currentModule === 'meetings' && <MeetingsView />}
            {currentModule === 'variations' && <VariationsView />}
            {currentModule === 'handover' && <HandoverView />}
            {currentModule === 'masterRegister' && (
              <MasterRegisterView onNavigateModule={setCurrentModule} />
            )}
            {currentModule === 'tasks' && <TasksView />}
            {currentModule === 'analytics' && <ReportsView />}
            {currentModule === 'customModules' && (
              <CustomModuleBuilderView onPublished={(id) => setCurrentModule(`custom_${id}`)} />
            )}
            {currentModule.startsWith('custom_') && (
              <CustomRecordView moduleId={currentModule.replace('custom_', '')} />
            )}
            {currentModule === 'settings' && <SettingsView />}
            {currentModule === 'users' && <UsersView />}
            {currentModule === 'audit' && <AuditView />}
          </main>
        </div>
      </div>

      {/* Global Quick Create Modal */}
      <QuickCreateModal onSelectAction={handleQuickCreateAction} />
    </div>
  );
}
