'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { CustomFieldDef } from '@/types';
import { 
  Wrench, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, 
  Sparkles, Layers, Zap, Wind, ShieldCheck, Settings, Eye
} from 'lucide-react';

interface CustomModuleBuilderViewProps {
  onPublished: (moduleId: string) => void;
}

export function CustomModuleBuilderView({ onPublished }: CustomModuleBuilderViewProps) {
  const { currentProjectId, currentProject, language, refreshCustomModules } = useProject();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 & 2: Names & Identity
  const [nameEn, setNameEn] = useState('Fire Fighting Flow & Pressure Test Register');
  const [nameAr, setNameAr] = useState('سجل اختبار تدفق وضغط شبكة الإطفاء');
  const [key, setKey] = useState('fire-flow-test');
  const [icon, setIcon] = useState('ShieldCheck');
  const [category, setCategory] = useState('MEP Fire Protection');
  const [recordType, setRecordType] = useState('Fire Life Safety Test');
  const [numberingPrefix, setNumberingPrefix] = useState('FFT');

  // Step 3: Fields
  const [fields, setFields] = useState<CustomFieldDef[]>([
    { id: 'f1', name: 'hydrantTag', label: 'Hydrant / Valve Tag', labelAr: 'رقم المحبس أو الحنفية', type: 'text', required: true, placeholder: 'e.g. HYD-ZONE-A-01' },
    { id: 'f2', name: 'staticPressurePsi', label: 'Static Pressure (PSI)', labelAr: 'الضغط الاستاتيكي (PSI)', type: 'number', required: true },
    { id: 'f3', name: 'residualPressurePsi', label: 'Residual Pressure (PSI)', labelAr: 'الضغط المتبقي (PSI)', type: 'number', required: true },
    { id: 'f4', name: 'flowRateGpm', label: 'Actual Measured Flow (GPM)', labelAr: 'التدفق الفعلي المقاس (GPM)', type: 'number', required: true },
    { id: 'f5', name: 'testDate', label: 'Test Witness Date', labelAr: 'تاريخ الفحص', type: 'date', required: true },
    { id: 'f6', name: 'civilDefenseWitness', label: 'Civil Defense Inspector Name', labelAr: 'اسم مفتش الدفاع المدني', type: 'text', required: false, placeholder: 'e.g. Capt. Fahad Al-Harbi' },
  ]);

  // New field input
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldLabelAr, setNewFieldLabelAr] = useState('');
  const [newFieldType, setNewFieldType] = useState<any>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);

  // Step 4: Statuses
  const [statuses, setStatuses] = useState([
    { code: 'DRAFT', label: 'Draft', labelAr: 'مسودة', color: 'gray', isClosed: false },
    { code: 'WITNESSED', label: 'Witnessed On-Site', labelAr: 'تم الفحص بحضور الاستشاري', color: 'blue', isClosed: false },
    { code: 'CERTIFIED', label: 'Certified Compliant', labelAr: 'معتمد ومطابق للمعايير', color: 'green', isClosed: true },
  ]);

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const cleanName = (newFieldName.trim() || newFieldLabel.trim())
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '');

    const newF: CustomFieldDef = {
      id: `f-${Date.now()}`,
      name: cleanName,
      label: newFieldLabel,
      labelAr: newFieldLabelAr || newFieldLabel,
      type: newFieldType,
      required: newFieldRequired,
    };

    setFields([...fields, newF]);
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldLabelAr('');
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          name: nameEn,
          nameAr,
          icon,
          category,
          recordType,
          numberingPrefix,
          workflowStatuses: statuses,
          fields,
          active: true,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        refreshCustomModules();
        alert(`Successfully published module "${nameEn}"! It is now accessible in the sidebar.`);
        onPublished(json.data.id);
      } else {
        alert(json.error || 'Failed to publish custom module');
      }
    } catch (err) {
      alert('Network error publishing custom module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'منشئ السجلات والوحدات المخصصة بدون برمجة' : 'No-Code Custom Module & Register Builder'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Visual Designer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create completely custom engineering screens, registers, form fields, and numbering prefixes without touching code
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
          <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-amber-500 text-navy-950' : 'bg-slate-100 text-slate-600'}`}>1. Identity</span>
          <span className="text-slate-300">→</span>
          <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-amber-500 text-navy-950' : 'bg-slate-100 text-slate-600'}`}>2. Fields ({fields.length})</span>
          <span className="text-slate-300">→</span>
          <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-amber-500 text-navy-950' : 'bg-slate-100 text-slate-600'}`}>3. Workflow</span>
          <span className="text-slate-300">→</span>
          <span className={`px-2 py-1 rounded ${step === 4 ? 'bg-amber-500 text-navy-950' : 'bg-slate-100 text-slate-600'}`}>4. Preview & Publish</span>
        </div>
      </div>

      {/* Step 1: Module Identity */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Step 1: Module Identity & Category</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Module Name (English)</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => {
                  setNameEn(e.target.value);
                  setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                className="w-full border border-slate-300 rounded p-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Module Name (Arabic - الاسم بالعربية)</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs text-right font-arabic"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unique Key</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Numbering Prefix</label>
              <input
                type="text"
                value={numberingPrefix}
                onChange={(e) => setNumberingPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. FFT"
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
              >
                <option value="ShieldCheck">Shield / Safety</option>
                <option value="Zap">Zap / Electrical</option>
                <option value="Wind">Wind / HVAC</option>
                <option value="Sparkles">Sparkles / General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Discipline Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Record Type Description</label>
              <input
                type="text"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded text-xs transition"
            >
              <span>Next: Configure Custom Fields</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Custom Form Fields */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Step 2: Add Custom Fields to {nameEn}</h3>
              <p className="text-[11px] text-slate-500">Define data types, mandatory rules, and labels in English & Arabic</p>
            </div>
            <span className="font-mono text-xs font-bold text-amber-700">{fields.length} Fields Configured</span>
          </div>

          {/* Existing Fields List */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Field Name</th>
                  <th className="p-2.5">Label (EN)</th>
                  <th className="p-2.5">Label (AR)</th>
                  <th className="p-2.5">Data Type</th>
                  <th className="p-2.5 text-center">Required</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{f.name}</td>
                    <td className="p-2.5 font-medium text-slate-900">{f.label}</td>
                    <td className="p-2.5 font-arabic text-slate-700">{f.labelAr}</td>
                    <td className="p-2.5 font-mono uppercase text-[10px] text-amber-800 font-bold">{f.type}</td>
                    <td className="p-2.5 text-center">
                      {f.required ? <span className="text-emerald-700 font-bold">YES</span> : <span className="text-slate-400">NO</span>}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleRemoveField(f.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Field Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="font-bold text-slate-800">Add New Field to Form</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Label (English)</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Pump Serial Number"
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Label (Arabic)</label>
                <input
                  type="text"
                  value={newFieldLabelAr}
                  onChange={(e) => setNewFieldLabelAr(e.target.value)}
                  placeholder="الرقم التسلسلي للمضخة"
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right font-arabic"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Data Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white font-medium"
                >
                  <option value="text">Short Text</option>
                  <option value="longtext">Long Text / Notes</option>
                  <option value="number">Number</option>
                  <option value="decimal">Decimal</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="datetime">Date & Time</option>
                  <option value="select">Dropdown Options</option>
                  <option value="checkbox">Checkbox / Boolean</option>
                  <option value="user">User Selector</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs mb-2">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>Mandatory</span>
                </label>

                <button
                  type="button"
                  onClick={handleAddField}
                  className="ml-auto mb-1 flex items-center gap-1 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded text-xs transition"
            >
              <span>Next: Workflow Statuses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Workflow Statuses */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Step 3: Workflow States</h3>
          <p className="text-slate-500 text-[11px]">Define the progression stages from initial drafting to certified closure.</p>

          <div className="space-y-2">
            {statuses.map((st, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700">{st.code}</span>
                  <span className="text-slate-400">—</span>
                  <span className="font-semibold text-slate-900">{st.label} ({st.labelAr})</span>
                </div>
                <div className="flex items-center gap-2">
                  {st.isClosed && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Closing State</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded text-xs transition"
            >
              <span>Next: Preview & Publish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Publish */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs max-w-3xl">
          <div className="border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Step 4: Live Module Preview & Publish Confirmation</h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Review configuration. Upon publishing, this module will dynamically appear in the navigation bar!
            </p>
          </div>

          {/* Module Summary Card */}
          <div className="p-4 bg-navy-900 text-white rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold text-base">{nameEn}</span>
              <span className="font-mono text-xs bg-navy-800 px-2 py-0.5 rounded text-amber-300">Prefix: {numberingPrefix}</span>
            </div>
            <div className="text-slate-300 font-arabic text-sm">{nameAr}</div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-navy-800">
              Category: {category} • Record Type: {recordType} • Fields: {fields.length}
            </div>
          </div>

          {/* Live Form Preview */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Generated Form Preview:</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.id} className="p-2 bg-white rounded border border-slate-200">
                  <div className="font-bold text-slate-700 flex justify-between">
                    <span>{f.label}</span>
                    {f.required && <span className="text-red-500 text-[10px]">*</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">[{f.type}] placeholder: {f.placeholder || 'Value'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black rounded-lg text-xs shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Publishing...' : 'Publish Module to Sidebar & Projects'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
