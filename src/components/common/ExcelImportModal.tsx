'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useProject } from '@/context/ProjectContext';
import { 
  X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  Download, ArrowRight, RefreshCw, AlertCircle 
} from 'lucide-react';

interface ExcelImportModalProps {
  module: 'drawings' | 'submittals' | 'irs' | 'mirs' | 'correspondence';
  moduleTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExcelImportModal({ module, moduleTitle, isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const { currentProjectId, language } = useProject();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  if (!isOpen) return null;

  const downloadBlankTemplate = () => {
    let headers: string[] = [];
    let sampleData: any[] = [];

    if (module === 'drawings') {
      headers = ['Drawing Number', 'Drawing Title', 'Discipline', 'System', 'Building / Zone', 'Floor / Level', 'Drawing Type', 'Originator', 'Revision'];
      sampleData = [
        ['APX-KSP-03-MEP-HVAC-0101-P01', 'Primary Chilled Water Pump Station Piping Layout', 'MEP-HVAC', 'Chilled Water Plant', 'Energy Center B3', 'Basement Level 3', 'Shop Drawing', 'APEX Technical Office', 'P01'],
        ['APX-KSP-03-MEP-ELE-0205-P01', 'Main LV Switchboard Single Line Diagram', 'MEP-Electrical', 'LV Power Distribution', 'Substation 01', 'Ground Floor', 'Shop Drawing', 'APEX Electrical Dept', 'P01']
      ];
    } else if (module === 'submittals') {
      headers = ['Submittal Number', 'Submittal Title', 'Type', 'Discipline', 'System', 'Manufacturer', 'Supplier', 'Country of Origin'];
      sampleData = [
        ['APX-KSP-03-MEP-MAT-0050-00', 'UL/FM Fire Damper Motorized Actuators (Belimo)', 'Material Submittal', 'MEP-HVAC', 'Fire & Smoke Dampers', 'Belimo Aircontrols', 'Belimo Middle East', 'Switzerland'],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `APEX_DC_${module.toUpperCase()}_IMPORT_TEMPLATE.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setParsedRows(data);
        setStep('preview');
      } catch (err) {
        alert('Error parsing Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const runValidation = async (dryRun: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module,
          projectId: currentProjectId,
          rows: parsedRows,
          dryRun,
        }),
      });
      const json = await res.json();
      if (json.success && json.summary) {
        setValidationSummary(json.summary);
        setStep('result');
        if (!dryRun) {
          onSuccess();
        }
      } else {
        alert(json.error || 'Validation failed');
      }
    } catch (e) {
      alert('Network error during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-navy-900 text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {language === 'ar' ? `استيراد سجل ${moduleTitle} عبر إكسل` : `Import ${moduleTitle} from Excel`}
              </h2>
              <div className="text-[11px] text-slate-300">
                Validated duplicate detection & error reporting
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-slate-800">Need standard register template?</div>
                  <div className="text-[11px] text-slate-500">Download formatted blank Excel sheet with column definitions.</div>
                </div>
                <button
                  onClick={downloadBlankTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-xs transition"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Blank Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-amber-500 hover:bg-amber-50/20 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <div className="font-bold text-sm text-slate-800">
                  Click or drag Excel register file here
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV files
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    File Loaded: <span className="text-amber-700">{file?.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {parsedRows.length} rows detected ready for validation.
                  </div>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Change File
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60 text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      {parsedRows[0] && Object.keys(parsedRows[0]).slice(0, 5).map((col, i) => (
                        <th key={i} className="p-2 border-b text-left">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        {Object.values(row).slice(0, 5).map((val: any, i) => (
                          <td key={i} className="p-2 text-slate-700 truncate max-w-[160px]">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  onClick={() => runValidation(true)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                >
                  Run Dry-Run Check Only
                </button>
                <button
                  onClick={() => runValidation(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold rounded bg-amber-500 hover:bg-amber-600 text-navy-950 transition flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Validate & Commit Import
                </button>
              </div>
            </div>
          )}

          {step === 'result' && validationSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Processed</div>
                  <div className="text-xl font-bold text-slate-900">{validationSummary.totalProcessed}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Valid Rows</div>
                  <div className="text-xl font-bold text-emerald-700">{validationSummary.validRowsCount}</div>
                </div>
                <div className={`p-3 rounded-lg border ${
                  validationSummary.rejectedRowsCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] uppercase font-bold text-red-700">Rejected / Duplicates</div>
                  <div className="text-xl font-bold text-red-700">{validationSummary.rejectedRowsCount}</div>
                </div>
              </div>

              {validationSummary.errors.length > 0 && (
                <div className="border border-red-200 bg-red-50/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Errors Detected (Records Not Overwritten):</span>
                  </div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {validationSummary.errors.map((err: any, i: number) => (
                      <li key={i} className="flex items-start gap-1 font-mono text-[11px]">
                        <span>Row {err.row}:</span>
                        <span>{err.docNumber ? `[${err.docNumber}] ` : ''}{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationSummary.committedCount > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Successfully committed {validationSummary.committedCount} new records to project database!
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded bg-navy-900 hover:bg-navy-800 text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
