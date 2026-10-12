'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Rfi, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  HelpCircle, Plus, Search, Download, Clock, AlertTriangle, 
  CheckCircle2, DollarSign, Calendar, FileText
} from 'lucide-react';

export function RfisView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedRfi, setSelectedRfi] = useState<Rfi | null>(null);

  // Form State
  const [newSubject, setNewSubject] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newLocation, setNewLocation] = useState('Energy Center B3');
  const [newDwgRef, setNewDwgRef] = useState('');
  const [newPriority, setNewPriority] = useState<any>('High');
  const [newCostImpact, setNewCostImpact] = useState(false);
  const [newScheduleImpact, setNewScheduleImpact] = useState(true);
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  // Response Form State
  const [consultantReply, setConsultantReply] = useState('');

  const fetchRfis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfis?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRfis(json.data);
      }
    } catch (e) {
      console.error('Error fetching RFIs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfis();
  }, [currentProjectId]);

  const generateNumber = async (disc: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'RFI',
          discipline: disc,
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating RFI number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber(newDiscipline);
    setCreateModalOpen(true);
  };

  const handleCreateRfi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim()) return;

    try {
      const res = await fetch('/api/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          rfiNumber: generatedDocNum,
          subject: newSubject,
          technicalQuestion: newQuestion,
          discipline: newDiscipline,
          location: newLocation,
          drawingRefs: newDwgRef,
          originator: 'Eng. Hisham Al-Husseini (MEP CM)',
          recipient: 'Dar Al-Handasah Structural Lead',
          dateRaised: new Date().toISOString().split('T')[0],
          requiredResponseDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          priority: newPriority,
          potentialCostImpact: newCostImpact,
          potentialScheduleImpact: newScheduleImpact,
          status: 'Open',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewSubject('');
        setNewQuestion('');
        fetchRfis();
      }
    } catch (err) {
      alert('Error creating RFI');
    }
  };

  const handleRecordResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfi) return;

    try {
      const res = await fetch('/api/rfis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRfi.id,
          consultantResponse: consultantReply,
          status: 'Answered',
          actualResponseDate: new Date().toISOString().split('T')[0],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResponseModalOpen(false);
        fetchRfis();
      }
    } catch (err) {
      alert('Error recording RFI response');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRfis.map((r, index) => ({
      '#': index + 1,
      'RFI Number': r.rfiNumber,
      'Subject': r.subject,
      'Discipline': r.discipline,
      'Date Raised': r.dateRaised,
      'Required Date': r.requiredResponseDate,
      'Priority': r.priority,
      'Cost Impact': r.potentialCostImpact ? 'YES' : 'NO',
      'Schedule Impact': r.potentialScheduleImpact ? 'YES' : 'NO',
      'Status': r.status,
      'Response': r.consultantResponse || 'Pending',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFI_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_RFI_REGISTER.xlsx`);
  };

  const filteredRfis = rfis.filter(r => {
    const matchSearch = searchQuery === '' || 
      r.rfiNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technicalQuestion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل طلبات الاستفسار الفني (RFI)' : 'Requests for Information (RFI) Register'}
            </h2>
            <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
              {filteredRfis.length} Queries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical queries, schedule & cost impact indicators, response aging & consultant replies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'استفسار جديد' : 'Raise RFI'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search RFI number, technical question, subject..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All RFI Statuses</option>
          <option value="Open">Open (Pending Reply)</option>
          <option value="Answered">Answered</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">RFI Number</th>
                <th className="py-3 px-3">Subject & Technical Query</th>
                <th className="py-3 px-3">Discipline & Location</th>
                <th className="py-3 px-3">Impact Flags</th>
                <th className="py-3 px-3">Raised / Due Date</th>
                <th className="py-3 px-3">Consultant Response</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRfis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No RFIs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRfis.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.rfiNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{r.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2">{r.technicalQuestion}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <div className="font-semibold">{r.discipline}</div>
                      <div className="text-[10px] text-slate-400">{r.location}</div>
                    </td>

                    {/* Impact Flags */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {r.potentialScheduleImpact && (
                          <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Time Impact
                          </span>
                        )}
                        {r.potentialCostImpact && (
                          <span className="font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                            Cost Impact
                          </span>
                        )}
                        {!r.potentialScheduleImpact && !r.potentialCostImpact && (
                          <span className="text-slate-400">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      <div>Raised: {r.dateRaised}</div>
                      <span className="text-slate-500">Due: {r.requiredResponseDate}</span>
                    </td>

                    {/* Response Status */}
                    <td className="py-3 px-3 max-w-xs text-[11px]">
                      {r.consultantResponse ? (
                        <div className="text-emerald-800 font-medium line-clamp-2 bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                          {r.consultantResponse}
                        </div>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending Consultant Reply
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRfi(r);
                          setConsultantReply(r.consultantResponse || '');
                          setResponseModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                      >
                        {r.consultantResponse ? 'Edit Reply' : 'Record Reply'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Raise Technical RFI</h3>
                <div className="text-[11px] text-slate-300">Contractual request for information & clarification</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRfi} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated RFI Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">RFI Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Clash between 450mm Chilled Water Riser and Post-Tensioned Wall"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discipline</label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => {
                      const disc = e.target.value as Discipline;
                      setNewDiscipline(disc);
                      generateNumber(disc);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    <option value="MEP-HVAC">MEP-HVAC</option>
                    <option value="MEP-Firefighting">MEP-Firefighting</option>
                    <option value="MEP-Plumbing">MEP-Plumbing</option>
                    <option value="MEP-Electrical">MEP-Electrical</option>
                    <option value="Structural">Structural</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Urgent">Urgent (48 Hours)</option>
                    <option value="High">High (7 Days)</option>
                    <option value="Medium">Medium (14 Days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Technical Query</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Detail exact standard, drawing conflicts, or site condition requiring instruction..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-6 p-3 bg-slate-50 border rounded">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newScheduleImpact}
                    onChange={(e) => setNewScheduleImpact(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Potential Schedule / Time Impact</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newCostImpact}
                    onChange={(e) => setNewCostImpact(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Potential Cost Impact</span>
                </label>
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
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Issue Formal RFI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Response Modal */}
      {responseModalOpen && selectedRfi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Record Consultant RFI Response</h3>
                <div className="text-[11px] text-slate-300 font-mono">{selectedRfi.rfiNumber}</div>
              </div>
              <button onClick={() => setResponseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordResponse} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded text-[11px]">
                <div className="font-bold text-slate-800">Query: {selectedRfi.subject}</div>
                <p className="text-slate-600 mt-1">{selectedRfi.technicalQuestion}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultant Official Reply / Instruction</label>
                <textarea
                  value={consultantReply}
                  onChange={(e) => setConsultantReply(e.target.value)}
                  placeholder="Enter the engineering directive or clarification from consultant..."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResponseModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Formal Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
