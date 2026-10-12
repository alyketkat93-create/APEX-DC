'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { User, UserRole } from '@/types';
import { 
  Users, Shield, Check, X, ShieldCheck, Lock, 
  Key, UserCheck, AlertCircle
} from 'lucide-react';

export function UsersView() {
  const { users, currentUser, setCurrentUser, language, t } = useProject();

  const [selectedRole, setSelectedRole] = useState<UserRole>('Document Control Manager');

  // Comprehensive RBAC Matrix by Module and Action
  const modulesList = [
    'Drawings Management',
    'Technical Submittals',
    'Inspection Requests (IR)',
    'Material Inspections (MIR)',
    'Quality & NCRs',
    'Technical Correspondence',
    'RFIs',
    'Transmittals',
    'Site Instructions & VOs',
    'Handover Closeout',
    'Custom Modules Builder',
    'Settings & Numbering',
  ];

  const rolePermissions: Record<string, { view: boolean; create: boolean; review: boolean; approve: boolean; export: boolean }> = {
    'Super Administrator': { view: true, create: true, review: true, approve: true, export: true },
    'Project Director': { view: true, create: true, review: true, approve: true, export: true },
    'Project Manager': { view: true, create: true, review: true, approve: true, export: true },
    'Document Control Manager': { view: true, create: true, review: true, approve: false, export: true },
    'Document Controller': { view: true, create: true, review: false, approve: false, export: true },
    'MEP Construction Manager': { view: true, create: true, review: true, approve: false, export: true },
    'QA/QC Manager': { view: true, create: true, review: true, approve: false, export: true },
    'Consultant Reviewer': { view: true, create: false, review: true, approve: true, export: true },
    'Client Representative': { view: true, create: false, review: true, approve: true, export: true },
    'Auditor': { view: true, create: false, review: false, approve: false, export: true },
  };

  const currentPerms = rolePermissions[selectedRole] || { view: true, create: false, review: false, approve: false, export: true };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'المستخدمون والأدوار ومصفوفة الصلاحيات (RBAC)' : 'User Roles & Security Permissions Matrix (RBAC)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Enterprise Role Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict separation between administrative document controllers, contractor engineers, and consultant approval authority
          </p>
        </div>
      </div>

      {/* Users Quick-Switch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {users.map((u) => {
          const isCurrent = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              onClick={() => {
                setCurrentUser(u);
                setSelectedRole(u.role);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isCurrent ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-full bg-navy-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {u.name.charAt(0)}
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-bold bg-amber-500 text-navy-950 px-1.5 py-0.2 rounded">
                      ACTIVE USER
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900 leading-tight">
                  {language === 'ar' && u.nameAr ? u.nameAr : u.name}
                </div>
                <div className="text-[10px] text-amber-800 font-semibold mt-0.5">{u.role}</div>
                <div className="text-[10px] text-slate-500 truncate mt-1">{u.company}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-bold text-navy-900">
                {isCurrent ? 'Logged In Session' : 'Click to Switch Session →'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-navy-900" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Functional Access Matrix for Role: <span className="text-amber-700">{selectedRole}</span>
              </h3>
              <div className="text-[11px] text-slate-500">
                Permissions enforced across API routes and client interfaces
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Select Role to Inspect:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white font-bold text-slate-800"
            >
              <option value="Document Control Manager">Document Control Manager</option>
              <option value="Document Controller">Document Controller</option>
              <option value="MEP Construction Manager">MEP Construction Manager</option>
              <option value="QA/QC Manager">QA/QC Manager</option>
              <option value="Consultant Reviewer">Consultant Reviewer</option>
              <option value="Super Administrator">Super Administrator</option>
              <option value="Auditor">Auditor</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Module Name</th>
                <th className="p-3 text-center">View / Search</th>
                <th className="p-3 text-center">Create Record</th>
                <th className="p-3 text-center">Internal Review</th>
                <th className="p-3 text-center">Consultant Code Approval</th>
                <th className="p-3 text-center">Excel Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modulesList.map((mod, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{mod}</td>

                  {/* View */}
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </td>

                  {/* Create */}
                  <td className="p-3 text-center">
                    {currentPerms.create ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Review */}
                  <td className="p-3 text-center">
                    {currentPerms.review ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Approve */}
                  <td className="p-3 text-center">
                    {currentPerms.approve ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Export */}
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
