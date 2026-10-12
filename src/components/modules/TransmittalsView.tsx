'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Transmittal } from '@/types';
import * as XLSX from 'xlsx';
import { 
  SendHorizontal, Plus, Search, Download, Upload, Printer, 
  CheckCircle2, Clock, FileText, ArrowRight, Layers
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function TransmittalsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [transmittals, setTransmittals] = useState<Transmittal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedTransmittal, setSelectedTransmittal] = useState<Transmittal | null>(null);

  // Form State
  const [newRecipient, setNewRecipient] = useState('Dar Al-Handasah Consultants');
  const [newPurpose, setNewPurpose] = useState<any>('For Approval');
  const [newAction, setNewAction] = useState('Review and return with approval code within 14 calendar days.');
  const [doc1Num, setDoc1Num] = useState('APX-KSP-03-MEP-HVAC-0042-P02');
  const [doc1Title, setDoc1Title] = useState('Central Chiller Plant — Piping Layout');
  const [doc1Rev, setDoc1Rev] = useState('P02');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchTransmittals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transmittals?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTransmittals(json.data);
      }
    } catch (e) {
      console.error('Error fetching transmittals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransmittals();
  }, [currentProjectId]);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'TR',
          discipline: 'DC',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating transmittal number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setCreateModalOpen(true);
  };

  const handleCreateTransmittal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/transmittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          transmittalNumber: generatedDocNum,
          category: 'Shop Drawings',
          sender: 'APEX Engineering & Construction JV',
          recipient: newRecipient,
          submissionDate: new Date().toISOString().split('T')[0],
          purpose: newPurpose,
          requiredAction: newAction,
          deliveryMethod: 'System Transmittal',
          receiptAcknowledged: false,
          status: 'Issued / Dispatched',
          documentList: [
            {
              docNumber: doc1Num,
              docTitle: doc1Title,
              revision: doc1Rev,
              docType: 'Shop Drawing',
              copies: 1,
              format: 'PDF',
              notes: 'Enclosed with complete submittal package'
            }
          ]
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        fetchTransmittals();
      }
    } catch (err) {
      alert('Error creating transmittal');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTransmittals.map((t, index) => ({
      '#': index + 1,
      'Transmittal Number': t.transmittalNumber,
      'Sender': t.sender,
      'Recipient': t.recipient,
      'Date': t.submissionDate,
      'Purpose': t.purpose,
      'Documents Count': t.documentList.length,
      'Status': t.status,
      'Acknowledged': t.receiptAcknowledged ? `YES (${t.acknowledgedBy})` : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transmittals_Log');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_TRANSMITTALS_LOG.xlsx`);
  };

  const filteredTransmittals = transmittals.filter(t => {
    return searchQuery === '' ||
      t.transmittalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.purpose.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل مذكرات إرسال المستندات (Transmittals)' : 'Formal Document Transmittals'}
            </h2>
            <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              {filteredTransmittals.length} Transmittals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlled multi-document dispatch slips, transmission purposes, delivery tracking & receipt acknowledgments
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'مذكرة إرسال جديدة' : 'New Transmittal'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transmittal number, recipient, purpose..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">Transmittal Number</th>
                <th className="py-3 px-3">Sender & Recipient</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Purpose</th>
                <th className="py-3 px-3 text-center">Enclosed Docs</th>
                <th className="py-3 px-3">Receipt Acknowledgment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransmittals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transmittals found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransmittals.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {tr.transmittalNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs text-slate-700">
                      <div className="font-semibold">{tr.recipient}</div>
                      <div className="text-[10px] text-slate-400">From: {tr.sender}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      {tr.submissionDate}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      {tr.purpose}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {tr.documentList.length} docs
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      {tr.receiptAcknowledged ? (
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Signed ({tr.acknowledgedBy})</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Pending Receipt Sign-off</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        {tr.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTransmittal(tr);
                          setPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                        title="Print Formal Transmittal Slip"
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
                <h3 className="font-bold text-sm">Create Formal Document Transmittal</h3>
                <div className="text-[11px] text-slate-300">Bundle drawings or submittals into formal transmission slip</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransmittal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated Transmittal Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
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
                  <label className="block font-bold text-slate-700 mb-1">Purpose of Submission</label>
                  <select
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="For Approval">For Approval</option>
                    <option value="For Information">For Information</option>
                    <option value="For Construction">For Construction</option>
                    <option value="For Review & Comment">For Review & Comment</option>
                    <option value="As-Built Records">As-Built Records</option>
                  </select>
                </div>
              </div>

              {/* Enclosed Document Sample Row */}
              <div className="p-3 bg-slate-50 border rounded space-y-2">
                <div className="font-bold text-slate-700">Enclosed Document Details</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500">Document Number</label>
                    <input
                      type="text"
                      value={doc1Num}
                      onChange={(e) => setDoc1Num(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Rev</label>
                    <input
                      type="text"
                      value={doc1Rev}
                      onChange={(e) => setDoc1Rev(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Title / Description</label>
                  <input
                    type="text"
                    value={doc1Title}
                    onChange={(e) => setDoc1Title(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Action / Response Period</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
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
                  className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Issue Transmittal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Transmittal Sheet Modal */}
      <PrintableDocumentModal
        docType="TRANSMITTAL_SLIP"
        title="FORMAL DOCUMENT TRANSMITTAL SLIP"
        data={selectedTransmittal}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
