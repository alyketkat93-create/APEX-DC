'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Correspondence, Discipline } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Mail, Plus, Search, Download, Upload, Printer, 
  Send, Inbox, FileText, CheckCircle2, Clock, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function CorrespondenceView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [letters, setLetters] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Correspondence | null>(null);

  // Form State
  const [newDirection, setNewDirection] = useState<'Outgoing' | 'Incoming'>('Outgoing');
  const [newSubject, setNewSubject] = useState('');
  const [newRecipient, setNewRecipient] = useState('Dar Al-Handasah Consultants');
  const [newSender, setNewSender] = useState('APEX Engineering & Construction JV');
  const [newClause, setNewClause] = useState('FIDIC Cl. 1.9 (Delayed Instructions)');
  const [newDiscipline, setNewDiscipline] = useState<Discipline>('MEP-HVAC');
  const [newBody, setNewBody] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/correspondence?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLetters(json.data);
      }
    } catch (e) {
      console.error('Error fetching correspondence', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentProjectId]);

  const generateNumber = async (dir: string) => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'COR',
          discipline: dir === 'Outgoing' ? 'OUT' : 'INC',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating letter number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber(newDirection);
    setCreateModalOpen(true);
  };

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const res = await fetch('/api/correspondence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          correspondenceNumber: generatedDocNum,
          direction: newDirection,
          letterRef: `${generatedDocNum}/2026`,
          letterDate: new Date().toISOString().split('T')[0],
          receivedDispatchedDate: new Date().toISOString().split('T')[0],
          sender: newSender,
          recipient: newRecipient,
          subject: newSubject,
          discipline: newDiscipline,
          contractClauseRef: newClause,
          responsiblePerson: 'Eng. Aly Ketkat',
          responseDeadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Dispatched',
          confidentiality: 'Normal',
          letterBody: newBody || 'Please find enclosed formal technical communication regarding project site operations.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewSubject('');
        setNewBody('');
        fetchLetters();
      }
    } catch (err) {
      alert('Error recording letter');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredLetters.map((l, index) => ({
      '#': index + 1,
      'Number': l.correspondenceNumber,
      'Direction': l.direction,
      'Date': l.letterDate,
      'Sender': l.sender,
      'Recipient': l.recipient,
      'Subject': l.subject,
      'Clause': l.contractClauseRef || 'N/A',
      'Status': l.status,
      'Deadline': l.responseDeadline || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Correspondence_Log');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_CORRESPONDENCE_LOG.xlsx`);
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = searchQuery === '' || 
      l.correspondenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDir = directionFilter === 'ALL' || l.direction === directionFilter;
    return matchSearch && matchDir;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل الخطابات والمراسلات الفنية الرسمية' : 'Technical Correspondence & Official Letters'}
            </h2>
            <span className="font-mono text-xs font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
              {filteredLetters.length} Letters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming & outgoing contractual communications, notices, deadlines & formal letterheads
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إنشاء خطاب جديد' : 'New Letter'}</span>
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
            placeholder="Search letters by number, subject, sender, or recipient..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Directions</option>
          <option value="Outgoing">Outgoing (صادر)</option>
          <option value="Incoming">Incoming (وارد)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Letter Number</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Subject & Scope</th>
                <th className="py-3 px-3">Sender & Recipient</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Contract Clause</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No correspondence records found.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {l.correspondenceNumber}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        l.direction === 'Outgoing' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {l.direction === 'Outgoing' ? <Send className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
                        <span>{l.direction}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{l.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{l.discipline}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold">{l.recipient}</div>
                      <div className="text-[10px] text-slate-400">From: {l.sender}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      {l.letterDate}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {l.contractClauseRef || 'General'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLetter(l);
                          setPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                        title="Print Formal Project Letterhead"
                      >
                        <Printer className="w-4 h-4" />
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
                <h3 className="font-bold text-sm">Compose Formal Contractual Letter</h3>
                <div className="text-[11px] text-slate-300">Generated on official project header</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLetter} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Direction</label>
                  <select
                    value={newDirection}
                    onChange={(e) => {
                      const dir = e.target.value as any;
                      setNewDirection(dir);
                      generateNumber(dir);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Outgoing">Outgoing (صادر)</option>
                    <option value="Incoming">Incoming (وارد)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generated Letter Ref</label>
                  <input
                    type="text"
                    value={generatedDocNum}
                    onChange={(e) => setGeneratedDocNum(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Letter Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Urgent Clarification on Chilled Water Riser Penetrations"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Entity</label>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Clause Reference</label>
                  <input
                    type="text"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Formal Letter Body Text</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Dear Sirs, We refer to contractual subclause... Yours faithfully, Project Management."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-sky-500 font-sans"
                  rows={4}
                  required
                />
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
                  className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Issue & Dispatch Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Letterhead Modal */}
      <PrintableDocumentModal
        docType="LETTER_HEAD"
        title="FORMAL PROJECT CORRESPONDENCE"
        data={selectedLetter}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
