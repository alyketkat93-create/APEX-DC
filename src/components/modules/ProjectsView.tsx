'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Project, BuildingZone } from '@/types';
import { 
  FolderKanban, Plus, Building2, MapPin, Calendar, 
  Coins, ShieldCheck, CheckCircle2, ArrowRight, Settings2,
  Trash2, Layers, Check, Sparkles, Edit3
} from 'lucide-react';

export function ProjectsView() {
  const { projects, currentProjectId, setCurrentProjectId, refreshProjects, language, t } = useProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Active Tab in Modal
  const [activeTab, setActiveTab] = useState<'info' | 'buildings' | 'floors'>('info');

  // Form State - Info
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [consultant, setConsultant] = useState('');
  const [contractor, setContractor] = useState('APEX Engineering & Construction JV');
  const [contractValue, setContractValue] = useState<number>(350000000);
  const [plannedCompletion, setPlannedCompletion] = useState('2027-06-30');
  const [type, setType] = useState<any>('Commercial Complex');

  // Form State - Buildings & Floors
  const [buildings, setBuildings] = useState<BuildingZone[]>([
    {
      id: 'bld-1',
      code: 'BLD-01',
      name: 'Main Complex Tower',
      nameAr: 'البرج الرئيسي للمشروع',
      floors: ['Basement Level 2', 'Basement Level 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Level 2', 'Roof']
    },
    {
      id: 'bld-2',
      code: 'PODIUM',
      name: 'Commercial Podium & Retail',
      nameAr: 'مبنى البوديوم التجاري',
      floors: ['Basement Level 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Roof']
    },
    {
      id: 'bld-3',
      code: 'EC-01',
      name: 'Central Energy & Utility Plant',
      nameAr: 'محطة الطاقة والخدمات المركزية',
      floors: ['Basement Level 2', 'Basement Level 1', 'Ground Floor', 'Roof']
    }
  ]);

  const [projectFloors, setProjectFloors] = useState<string[]>([
    'Basement Level 3',
    'Basement Level 2',
    'Basement Level 1',
    'Ground Floor',
    'Mezzanine',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Roof',
    'Upper Roof'
  ]);

  // Input states for adding a building
  const [newBldCode, setNewBldCode] = useState('');
  const [newBldNameEn, setNewBldNameEn] = useState('');
  const [newBldNameAr, setNewBldNameAr] = useState('');
  const [newBldFloors, setNewBldFloors] = useState<string[]>([]);

  // Input state for adding a floor
  const [customFloorInput, setCustomFloorInput] = useState('');

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingProjectId(null);
    setCode('');
    setNameEn('');
    setNameAr('');
    setClient('');
    setConsultant('');
    setContractor('APEX Engineering & Construction JV');
    setContractValue(350000000);
    setPlannedCompletion('2027-06-30');
    setType('Commercial Complex');
    setBuildings([
      {
        id: `bld-${Date.now()}-1`,
        code: 'BLD-01',
        name: 'Main Complex Tower',
        nameAr: 'البرج الرئيسي للمشروع',
        floors: ['Basement Level 2', 'Basement Level 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Level 2', 'Roof']
      },
      {
        id: `bld-${Date.now()}-2`,
        code: 'PODIUM',
        name: 'Commercial Podium & Retail',
        nameAr: 'مبنى البوديوم التجاري',
        floors: ['Basement Level 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Roof']
      },
      {
        id: `bld-${Date.now()}-3`,
        code: 'EC-01',
        name: 'Central Energy & Utility Plant',
        nameAr: 'محطة الطاقة والخدمات المركزية',
        floors: ['Basement Level 2', 'Basement Level 1', 'Ground Floor', 'Roof']
      }
    ]);
    setProjectFloors([
      'Basement Level 3',
      'Basement Level 2',
      'Basement Level 1',
      'Ground Floor',
      'Mezzanine',
      'Level 1',
      'Level 2',
      'Level 3',
      'Level 4',
      'Roof',
      'Upper Roof'
    ]);
    setActiveTab('info');
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setIsEditing(true);
    setEditingProjectId(p.id);
    setCode(p.code);
    setNameEn(p.name);
    setNameAr(p.nameAr || p.name);
    setClient(p.client);
    setConsultant(p.consultant);
    setContractor(p.mainContractor || 'APEX Engineering & Construction JV');
    setContractValue(p.contractValue);
    setPlannedCompletion(p.plannedCompletionDate);
    setType(p.projectType);
    setBuildings(p.buildings && p.buildings.length > 0 ? p.buildings : [
      {
        id: `bld-${Date.now()}-1`,
        code: 'BLD-01',
        name: 'Main Building Zone',
        nameAr: 'المبنى الرئيسي',
        floors: ['Basement Level 1', 'Ground Floor', 'Level 1', 'Roof']
      }
    ]);
    setProjectFloors(p.floors && p.floors.length > 0 ? p.floors : [
      'Basement Level 2',
      'Basement Level 1',
      'Ground Floor',
      'Mezzanine',
      'Level 1',
      'Level 2',
      'Roof'
    ]);
    setActiveTab('buildings');
    setModalOpen(true);
  };

  // Add a building
  const handleAddBuilding = () => {
    if (!newBldCode.trim() || !newBldNameEn.trim()) return;
    const newBld: BuildingZone = {
      id: `bld-${Date.now()}`,
      code: newBldCode.trim().toUpperCase(),
      name: newBldNameEn.trim(),
      nameAr: newBldNameAr.trim() || newBldNameEn.trim(),
      floors: newBldFloors.length > 0 ? newBldFloors : [...projectFloors]
    };
    setBuildings([...buildings, newBld]);
    setNewBldCode('');
    setNewBldNameEn('');
    setNewBldNameAr('');
    setNewBldFloors([]);
  };

  // Remove a building
  const handleRemoveBuilding = (id: string) => {
    setBuildings(buildings.filter(b => b.id !== id));
  };

  // Add custom floor
  const handleAddCustomFloor = () => {
    const val = customFloorInput.trim();
    if (!val || projectFloors.includes(val)) return;
    setProjectFloors([...projectFloors, val]);
    setCustomFloorInput('');
  };

  // Remove a floor
  const handleRemoveFloor = (floor: string) => {
    setProjectFloors(projectFloors.filter(f => f !== floor));
    // also update any building that explicitly has it
    setBuildings(buildings.map(b => ({
      ...b,
      floors: b.floors?.filter(f => f !== floor)
    })));
  };

  // Apply Building Presets
  const applyPreset = (presetType: 'commercial' | 'hospital' | 'resort' | 'metro') => {
    if (presetType === 'commercial') {
      const floors = ['Basement 3', 'Basement 2', 'Basement 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Level 2', 'Level 3', 'Roof', 'Upper Roof'];
      setProjectFloors(floors);
      setBuildings([
        { id: `bld-${Date.now()}-1`, code: 'TWR-A', name: 'Commercial Tower A', nameAr: 'البرج التجاري (أ)', floors },
        { id: `bld-${Date.now()}-2`, code: 'POD', name: 'Shopping Podium', nameAr: 'البوديوم التجاري', floors: ['Basement 1', 'Ground Floor', 'Level 1', 'Roof'] },
        { id: `bld-${Date.now()}-3`, code: 'EC-01', name: 'Energy Center', nameAr: 'مركز الطاقة والمرافق', floors: ['Basement 3', 'Basement 2', 'Ground Floor', 'Roof'] },
        { id: `bld-${Date.now()}-4`, code: 'PLZ', name: 'Landscaped Plaza', nameAr: 'الساحات الخارجية', floors: ['Ground Floor'] },
      ]);
    } else if (presetType === 'hospital') {
      const floors = ['Basement 2', 'Basement 1', 'Ground Floor', 'Level 1 - Clinics', 'Level 2 - Inpatient', 'Level 3 - Surgical OR', 'Level 4 - MEP Plant', 'Roof'];
      setProjectFloors(floors);
      setBuildings([
        { id: `bld-${Date.now()}-1`, code: 'HSP-01', name: 'Main Hospital Building', nameAr: 'المبنى الطبي الرئيسي', floors },
        { id: `bld-${Date.now()}-2`, code: 'DIA-02', name: 'Diagnostic Center & Labs', nameAr: 'مركز الفحوصات والمختبرات', floors: ['Ground Floor', 'Level 1 - Clinics', 'Roof'] },
        { id: `bld-${Date.now()}-3`, code: 'UTL-01', name: 'Central Utility Complex', nameAr: 'مجمع المرافق المركزية', floors: ['Basement 1', 'Ground Floor', 'Roof'] }
      ]);
    } else if (presetType === 'resort') {
      const floors = ['Basement 1', 'Ground Floor', 'Mezzanine', 'First Floor', 'Roof Terrace'];
      setProjectFloors(floors);
      setBuildings([
        { id: `bld-${Date.now()}-1`, code: 'CLUB', name: 'Main Clubhouse & Spa', nameAr: 'النادي الرئيسي والسبا', floors: ['Ground Floor', 'First Floor', 'Roof Terrace'] },
        { id: `bld-${Date.now()}-2`, code: 'VIL-A', name: 'Villas Zone A (V01-V20)', nameAr: 'منطقة الفلل (أ)', floors: ['Ground Floor', 'First Floor', 'Roof Terrace'] },
        { id: `bld-${Date.now()}-3`, code: 'VIL-B', name: 'Villas Zone B (V21-V40)', nameAr: 'منطقة الفلل (ب)', floors: ['Ground Floor', 'First Floor', 'Roof Terrace'] },
        { id: `bld-${Date.now()}-4`, code: 'UTL-RO', name: 'Utility Yard & RO Desalination', nameAr: 'منطقة الخدمات ومحطة التحلية', floors: ['Ground Floor'] }
      ]);
    } else if (presetType === 'metro') {
      const floors = ['Track Level (B3)', 'Concourse Level (B2)', 'Plant Room (B1)', 'Street Concourse (L0)', 'Platform Level (L1)', 'Canopy Roof'];
      setProjectFloors(floors);
      setBuildings([
        { id: `bld-${Date.now()}-1`, code: 'STN-BOX', name: 'Station Deep Underground Box', nameAr: 'صندوق المحطة العميق تحت الأرض', floors: ['Track Level (B3)', 'Concourse Level (B2)', 'Plant Room (B1)', 'Street Concourse (L0)'] },
        { id: `bld-${Date.now()}-2`, code: 'VENT-01', name: 'TVS Ventilation Shaft 01', nameAr: 'مخرج تهوية الأنفاق رقم 1', floors: ['Track Level (B3)', 'Concourse Level (B2)', 'Street Concourse (L0)'] },
        { id: `bld-${Date.now()}-3`, code: 'DEPOT', name: 'Maintenance Depot & Rail Yard', nameAr: 'ورش ومستودع صيانة القطارات', floors: ['Street Concourse (L0)', 'Canopy Roof'] }
      ]);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !code.trim()) return;

    try {
      if (isEditing && editingProjectId) {
        // Update existing project
        const res = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProjectId,
            code,
            name: nameEn,
            nameAr: nameAr || nameEn,
            client: client || 'Private Client / Employer',
            consultant: consultant || 'Supervising Consultant',
            mainContractor: contractor,
            contractValue,
            plannedCompletionDate: plannedCompletion,
            projectType: type,
            buildings,
            floors: projectFloors,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setModalOpen(false);
          refreshProjects();
        } else {
          alert('Error updating project: ' + (json.error || 'Unknown error'));
        }
      } else {
        // Create new project
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
            buildings,
            floors: projectFloors,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setModalOpen(false);
          refreshProjects();
          if (json.data?.id) {
            setCurrentProjectId(json.data.id);
          }
        } else {
          alert('Error creating project: ' + (json.error || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Network error while saving project');
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
              {language === 'ar' ? 'إدارة المشاريع والمباني والأدوار' : 'Projects Management & Workspaces'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {projects.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar' 
              ? 'تكوين المشاريع وتحديد المباني والمناطق والأدوار لتنعكس تلقائياً في الرسومات والتفتيشات وكافة السجلات'
              : 'Configure projects, buildings, zones and floor levels cascading into drawings, inspection requests & registers'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
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
          const buildingsCount = p.buildings?.length || 0;
          const floorsCount = p.floors?.length || 0;

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

                {/* Buildings & Floors Summary Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    <Building2 className="w-3 h-3 text-blue-600" />
                    <span>{buildingsCount} {language === 'ar' ? 'مباني / مناطق' : 'Buildings / Zones'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                    <Layers className="w-3 h-3 text-purple-600" />
                    <span>{floorsCount} {language === 'ar' ? 'أدوار ومستويات' : 'Floor Levels'}</span>
                  </span>
                </div>

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
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'ar' ? 'تعديل المباني والأدوار' : 'Edit Zones & Floors'}</span>
                </button>

                {isSelected ? (
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Active</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentProjectId(p.id)}
                    className="text-xs font-bold text-navy-900 hover:text-amber-600 flex items-center gap-1 transition"
                  >
                    <span>Switch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Project Modal with Buildings & Floors */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">
                  {isEditing 
                    ? (language === 'ar' ? `تعديل بيانات المشروع والمباني: ${code}` : `Edit Project & Buildings: ${code}`)
                    : (language === 'ar' ? 'إنشاء بيئة عمل مشروع جديد وتحديد المباني والأدوار' : 'Create New Construction Project Workspace')}
                </h3>
                <div className="text-[11px] text-slate-300">
                  {language === 'ar'
                    ? 'البيانات المدخلة للمباني والأدوار ستسمع تلقائياً في الرسومات والتفتيشات وكافة السجلات'
                    : 'Configured buildings and levels will automatically cascade into drawings, inspections & registers'}
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'info'
                    ? 'border-amber-500 text-slate-900 bg-white rounded-t'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ar' ? '1. بيانات المشروع' : '1. Project Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('buildings')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'buildings'
                    ? 'border-amber-500 text-slate-900 bg-white rounded-t'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'ar' ? `2. المباني والمناطق (${buildings.length})` : `2. Buildings & Zones (${buildings.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('floors')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'floors'
                    ? 'border-amber-500 text-slate-900 bg-white rounded-t'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>{language === 'ar' ? `3. الأدوار والمستويات (${projectFloors.length})` : `3. Floors & Levels (${projectFloors.length})`}</span>
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* TAB 1: BASIC INFORMATION */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Project Code</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. APX-NEOM-05"
                        className="w-full border border-slate-300 font-mono font-bold rounded p-2 text-xs focus:outline-none focus:border-amber-500"
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
                        <option value="Industrial">Industrial</option>
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
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
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
                      className="w-full border border-slate-300 rounded p-2 text-xs text-right font-arabic focus:outline-none focus:border-amber-500"
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

                  <div className="pt-2 flex justify-between">
                    <span className="text-[11px] text-slate-400">Step 1 of 3: Enter project metadata</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('buildings')}
                      className="px-3 py-1.5 bg-navy-900 text-white rounded font-bold hover:bg-navy-800 transition flex items-center gap-1"
                    >
                      <span>{language === 'ar' ? 'التالي: تحديد المباني والمناطق ←' : 'Next: Setup Buildings →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BUILDINGS & ZONES */}
              {activeTab === 'buildings' && (
                <div className="space-y-4">
                  {/* Preset Templates */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === 'ar' ? 'قوالب سريعة للمباني والمناطق (اختياري)' : 'Quick Presets for Buildings & Zones'}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 mb-2">
                      {language === 'ar' 
                        ? 'اختر قالباً لتوليد المباني والأدوار بنقرة واحدة، ويمكنك التعديل عليها بعدها بحرية:'
                        : 'Generate standard buildings and level sets with one click, then customize as needed:'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset('commercial')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded text-[11px] font-semibold transition"
                      >
                        🏢 Commercial Complex (Towers + Podium + EC)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('hospital')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded text-[11px] font-semibold transition"
                      >
                        🏥 Hospital & Healthcare (Clinics + OR + Plant)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('resort')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded text-[11px] font-semibold transition"
                      >
                        🏖️ Luxury Resort & Villas (Clubhouse + Villas)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('metro')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded text-[11px] font-semibold transition"
                      >
                        🚇 Metro Rail & Stations (Deep Box + Elevated)
                      </button>
                    </div>
                  </div>

                  {/* Add New Building Form */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ar' ? 'إضافة مبنى أو منطقة جديدة للمشروع' : 'Add New Building / Zone'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">Building Code</label>
                        <input
                          type="text"
                          value={newBldCode}
                          onChange={(e) => setNewBldCode(e.target.value)}
                          placeholder="e.g. BLD-01 or TWR-A"
                          className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">Name (English)</label>
                        <input
                          type="text"
                          value={newBldNameEn}
                          onChange={(e) => setNewBldNameEn(e.target.value)}
                          placeholder="e.g. Central Theater & Hall"
                          className="w-full border border-slate-300 rounded p-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">الاسم (بالعربية)</label>
                        <input
                          type="text"
                          value={newBldNameAr}
                          onChange={(e) => setNewBldNameAr(e.target.value)}
                          placeholder="مثال: المسرح والقاعة المركزية"
                          className="w-full border border-slate-300 rounded p-1.5 text-xs text-right font-arabic"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddBuilding}
                        disabled={!newBldCode.trim() || !newBldNameEn.trim()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-bold text-xs transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إضافة المبنى للقائمة' : 'Add Building to Project'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Configured Buildings List */}
                  <div>
                    <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>{language === 'ar' ? `المباني المعتمدة للمشروع (${buildings.length})` : `Configured Buildings (${buildings.length})`}:</span>
                      <span className="text-[11px] text-slate-400">ستظهر هذه الخيارات في الرسومات وطلبات الفحص</span>
                    </div>

                    {buildings.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 border border-dashed rounded text-slate-400">
                        No buildings configured yet. Use the presets above or add your buildings.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {buildings.map((b) => (
                          <div key={b.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-navy-900 text-amber-300 px-2 py-0.5 rounded">
                                  {b.code}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">{b.name}</span>
                                {b.nameAr && b.nameAr !== b.name && (
                                  <span className="text-xs text-slate-500 font-arabic">({b.nameAr})</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1">
                                <span className="text-slate-400 font-medium">Floors:</span>
                                {b.floors && b.floors.length > 0 ? (
                                  b.floors.slice(0, 5).map(f => (
                                    <span key={f} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                                      {f}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">Inherits all project levels</span>
                                )}
                                {b.floors && b.floors.length > 5 && (
                                  <span className="text-[10px] text-slate-400 font-bold">+{b.floors.length - 5} more</span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBuilding(b.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                              title="Delete Building"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('info')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                    >
                      ← Back to Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('floors')}
                      className="px-3 py-1.5 bg-navy-900 text-white rounded font-bold hover:bg-navy-800 transition flex items-center gap-1"
                    >
                      <span>{language === 'ar' ? 'التالي: إعداد الأدوار والمستويات ←' : 'Next: Setup Floors →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: FLOORS & LEVELS */}
              {activeTab === 'floors' && (
                <div className="space-y-4">
                  {/* Quick floor generator chips */}
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
                    <div className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>{language === 'ar' ? 'توليد سريع لقائمة الأدوار والمستويات' : 'Quick Floor Generators'}</span>
                    </div>
                    <div className="text-[11px] text-purple-700 mb-2">
                      Add common standard floor sequences with one click:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const std = ['Basement Level 3', 'Basement Level 2', 'Basement Level 1', 'Ground Floor', 'Mezzanine', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Roof', 'Upper Roof'];
                          setProjectFloors(Array.from(new Set([...projectFloors, ...std])));
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded text-[11px] font-semibold transition"
                      >
                        + Multi-Basement & High Rise (B3, B2, B1, GF, M, L1-L4, RF)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const std = ['Ground Floor', 'First Floor', 'Roof Terrace'];
                          setProjectFloors(Array.from(new Set([...projectFloors, ...std])));
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded text-[11px] font-semibold transition"
                      >
                        + Low-Rise / Villas (GF, 1F, Roof)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const std = ['Track Level (B3)', 'Concourse Level (B2)', 'Plant Room (B1)', 'Street Concourse (L0)', 'Platform Level (L1)', 'Canopy Roof'];
                          setProjectFloors(Array.from(new Set([...projectFloors, ...std])));
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded text-[11px] font-semibold transition"
                      >
                        + Metro Station (Track B3, Concourse B2, Street L0, Roof)
                      </button>
                    </div>
                  </div>

                  {/* Add Individual Custom Floor */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="block text-[11px] text-slate-700 font-bold mb-1">
                      {language === 'ar' ? 'إضافة دور / مستوى مخصص' : 'Add Custom Floor / Level'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFloorInput}
                        onChange={(e) => setCustomFloorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomFloor();
                          }
                        }}
                        placeholder="e.g. Technical Level 14 or Helipad Roof"
                        className="flex-1 border border-slate-300 rounded p-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomFloor}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs transition"
                      >
                        {language === 'ar' ? '+ إضافة الدور' : '+ Add Level'}
                      </button>
                    </div>
                  </div>

                  {/* Active Floors List */}
                  <div>
                    <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>{language === 'ar' ? `الأدوار والمستويات المعتمدة في المشروع (${projectFloors.length})` : `Configured Floor Levels (${projectFloors.length})`}:</span>
                      <span className="text-[11px] text-slate-400">ستظهر كخيارات منسدلة في الرسومات والتفتيشات</span>
                    </div>

                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                      {projectFloors.length === 0 ? (
                        <span className="text-slate-400 italic text-xs">No floors configured yet.</span>
                      ) : (
                        projectFloors.map((floor) => (
                          <span
                            key={floor}
                            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold shadow-2xs group hover:border-purple-400"
                          >
                            <span>{floor}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFloor(floor)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Remove floor"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('buildings')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                    >
                      ← Back to Buildings
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold shadow-xs active:scale-95 transition"
                >
                  {isEditing 
                    ? (language === 'ar' ? 'حفظ تعديلات المشروع والمباني' : 'Save Project & Building Changes')
                    : (language === 'ar' ? 'إنشاء وتفعيل بيئة عمل المشروع' : 'Create & Initialize Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
