'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { MaterialInspectionRequest } from '@/types';
import * as XLSX from 'xlsx';
import { 
  PackageCheck, Plus, Search, Download, Upload, Printer, 
  CheckCircle2, AlertTriangle, ShieldAlert, Layers, MapPin
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function MaterialInspectionsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [mirs, setMirs] = useState<MaterialInspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedMir, setSelectedMir] = useState<MaterialInspectionRequest | null>(null);

  // New MIR Form State
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Fire Protection Piping');
  const [newManufacturer, setNewManufacturer] = useState('Jindal Saw / Arabian Pipes');
  const [newSupplier, setNewSupplier] = useState('Al-Jazira Industrial Supplies');
  const [newSubmittalRef, setNewSubmittalRef] = useState('APX-KSP-03-MEP-MAT-0018-00');
  const [newDeliveryNote, setNewDeliveryNote] = useState('DN-2026-9912');
  const [newDeliveredQty, setNewDeliveredQty] = useState<number>(1000);
  const [newAcceptedQty, setNewAcceptedQty] = useState<number>(950);
  const [newRejectedQty, setNewRejectedQty] = useState<number>(50);
  const [newUnit, setNewUnit] = useState('Linear Meters');
  const [newNcrRef, setNewNcrRef] = useState('APX-KSP-03-QAQC-NCR-0014');
  const [newRemarks, setNewRemarks] = useState('');
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchMirs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mirs?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMirs(json.data);
      }
    } catch (e) {
      console.error('Error fetching MIRs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMirs();
  }, [currentProjectId]);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'MIR',
          discipline: 'MEP-FF',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating MIR number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setCreateModalOpen(true);
  };

  const handleCreateMir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const pendingQty = Math.max(0, newDeliveredQty - newAcceptedQty - newRejectedQty);
    let result: any = 'Accepted';
    if (newRejectedQty > 0 && newAcceptedQty > 0) result = 'Partially Accepted';
    else if (newRejectedQty > 0 && newAcceptedQty === 0) result = 'Rejected';

    try {
      const res = await fetch('/api/mirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          mirNumber: generatedDocNum,
          materialCategory: newCategory,
          materialDescription: newDesc,
          manufacturer: newManufacturer,
          supplier: newSupplier,
          approvedSubmittalRef: newSubmittalRef,
          deliveryNoteNumber: newDeliveryNote,
          deliveryDate: new Date().toISOString().split('T')[0],
          deliveryLocation: 'Laydown Yard 2',
          storageLocation: 'Warehouse Bay 4B',
          quantityDelivered: newDeliveredQty,
          unitOfMeasure: newUnit,
          quantityInspected: newDeliveredQty,
          quantityAccepted: newAcceptedQty,
          quantityRejected: newRejectedQty,
          quantityPending: pendingQty,
          countryOfOrigin: 'Saudi Arabia',
          inspector: 'Eng. Sarah Al-Ghamdi',
          consultantRep: 'Eng. Tariq Al-Mansoor',
          result,
          ncrRef: newRejectedQty > 0 ? newNcrRef : undefined,
          remarks: newRemarks || (newRejectedQty > 0 ? `${newRejectedQty} units rejected due to damage. NCR linked.` : 'Inspected and verified against approved submittal.'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewDesc('');
        fetchMirs();
      }
    } catch (err) {
      alert('Error creating MIR record');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredMirs.map((m, index) => ({
      '#': index + 1,
      'MIR Number': m.mirNumber,
      'Category': m.materialCategory,
      'Description': m.materialDescription,
      'Manufacturer': m.manufacturer,
      'Delivered': m.quantityDelivered,
      'Accepted': m.quantityAccepted,
      'Rejected': m.quantityRejected,
      'Unit': m.unitOfMeasure,
      'Submittal Ref': m.approvedSubmittalRef,
      'Result': m.result,
      'Linked NCR': m.ncrRef || 'None',
      'Delivery Date': m.deliveryDate,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MIR_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_MIR_REGISTER.xlsx`);
  };

  const filteredMirs = mirs.filter(m => {
    const matchSearch = searchQuery === '' || 
      m.mirNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchResult = resultFilter === 'ALL' || m.result === resultFilter;
    return matchSearch && matchResult;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'سجل فحص وتوريد المواد بالموقع (MIR)' : 'Material Inspection Requests (MIR)'}
            </h2>
            <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {filteredMirs.length} Consignments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Material deliveries, accepted vs rejected quantity tracking, MTC validation, and NCR linkage
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'طلب فحص مواد جديد' : 'New MIR'}</span>
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
            placeholder="Search MIR number, description, manufacturer, or delivery note..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
        >
          <option value="ALL">All Inspection Decisions</option>
          <option value="Accepted">Accepted</option>
          <option value="Partially Accepted">Partially Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* MIR Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th className="py-3 px-3">MIR Number</th>
                <th className="py-3 px-3">Material Description</th>
                <th className="py-3 px-3">Manufacturer & Supplier</th>
                <th className="py-3 px-3">Delivery Date & Note</th>
                <th className="py-3 px-3 text-center">Quantities (Del / Acc / Rej)</th>
                <th className="py-3 px-3">Inspection Result</th>
                <th className="py-3 px-3">Linked NCR</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMirs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No MIR records found.
                  </td>
                </tr>
              ) : (
                filteredMirs.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {m.mirNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{m.materialDescription}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">Submittal: {m.approvedSubmittalRef}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{m.manufacturer}</div>
                      <div className="text-[10px] text-slate-400">{m.supplier}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      <div>{m.deliveryDate}</div>
                      <span className="text-[10px] text-slate-400">DN: {m.deliveryNoteNumber}</span>
                    </td>

                    {/* Quantities Breakdown */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                        <span className="text-slate-800" title="Delivered">{m.quantityDelivered}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-emerald-700 font-bold" title="Accepted">{m.quantityAccepted}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-red-600 font-bold" title="Rejected">{m.quantityRejected}</span>
                        <span className="text-[9px] text-slate-500 font-normal ml-0.5">{m.unitOfMeasure}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        m.result === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        m.result === 'Partially Accepted' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {m.result}
                      </span>
                    </td>

                    {/* Linked NCR */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {m.ncrRef ? (
                        <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {m.ncrRef}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMir(m);
                          setPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                        title="Print Formal MIR Sheet"
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
                <h3 className="font-bold text-sm">Create Material Inspection Request (MIR)</h3>
                <div className="text-[11px] text-slate-300">Record incoming site delivery & quantity verification</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMir} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated MIR Number</label>
                <input
                  type="text"
                  value={generatedDocNum}
                  onChange={(e) => setGeneratedDocNum(e.target.value)}
                  className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Material Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. ASTM A53 Grade B Seamless Carbon Steel Firefighting Pipes"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Submittal Ref</label>
                  <input
                    type="text"
                    value={newSubmittalRef}
                    onChange={(e) => setNewSubmittalRef(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Note Number</label>
                  <input
                    type="text"
                    value={newDeliveryNote}
                    onChange={(e) => setNewDeliveryNote(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Quantities Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivered Qty</label>
                  <input
                    type="number"
                    value={newDeliveredQty}
                    onChange={(e) => setNewDeliveredQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    value={newAcceptedQty}
                    onChange={(e) => setNewAcceptedQty(Number(e.target.value))}
                    className="w-full border border-emerald-300 rounded p-1.5 text-xs font-mono font-bold text-emerald-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-red-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    value={newRejectedQty}
                    onChange={(e) => setNewRejectedQty(Number(e.target.value))}
                    className="w-full border border-red-300 rounded p-1.5 text-xs font-mono font-bold text-red-800"
                    required
                  />
                </div>
              </div>

              {newRejectedQty > 0 && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded">
                  <label className="block font-bold text-red-800 mb-1">Auto-Linked NCR Number</label>
                  <input
                    type="text"
                    value={newNcrRef}
                    onChange={(e) => setNewNcrRef(e.target.value)}
                    className="w-full bg-white border border-red-300 rounded p-1.5 text-xs font-mono font-bold text-red-800"
                  />
                </div>
              )}

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
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold"
                >
                  Record Inspection & Issue MIR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <PrintableDocumentModal
        docType="MIR_FORM"
        title="MATERIAL INSPECTION REQUEST (MIR)"
        data={selectedMir}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
