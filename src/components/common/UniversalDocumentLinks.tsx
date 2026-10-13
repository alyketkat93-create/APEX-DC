'use client';

import React, { useState } from 'react';
import { DocumentLink, LinkedApexRecord, ApexRecordType, DocumentLinkCategory } from '@/types';
import { 
  Link2, ExternalLink, Plus, Edit3, Trash2, Globe, FileText, 
  Layers, CheckCircle2, AlertCircle, Share2, FolderKanban, 
  Compass, FileCheck2, ClipboardList, PackageCheck, Mail, HelpCircle, 
  ShieldAlert, SendHorizontal, X, RefreshCw
} from 'lucide-react';
import { formatDateSafe } from '@/lib/dateUtils';

interface UniversalDocumentLinksProps {
  moduleId: string;
  recordId: string;
  recordRef: string;
  documentLinks?: DocumentLink[];
  linkedApexRecords?: LinkedApexRecord[];
  legacyAttachments?: { name: string; url: string; size?: string }[];
  legacyFileUrl?: string;
  legacyFileName?: string;
  projectId?: string;
  onUpdated?: (updatedRecord: any) => void;
  canEdit?: boolean;
  language?: 'en' | 'ar';
}

const LINK_CATEGORIES: DocumentLinkCategory[] = [
  'Approved Drawing PDF',
  'BIM 360 / ACC Model',
  'Design / IFC Drawing',
  'Technical Specification',
  'Manufacturer Catalog & PDS',
  'Inspection Sheet / Checklist',
  'Testing & Commissioning Report',
  'Method Statement & Risk Assessment',
  'Material Test Certificate (MTC)',
  'Site Photo Log',
  'Contractual Notice / Letter',
  'Calculation Sheet',
  'General Reference',
];

export function UniversalDocumentLinks({
  moduleId,
  recordId,
  recordRef,
  documentLinks = [],
  linkedApexRecords = [],
  legacyAttachments = [],
  legacyFileUrl,
  legacyFileName,
  projectId,
  onUpdated,
  canEdit = true,
  language = 'en',
}: UniversalDocumentLinksProps) {
  // Modal states
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false);
  const [editLinkModalOpen, setEditLinkModalOpen] = useState(false);
  const [selectedLinkToEdit, setSelectedLinkToEdit] = useState<DocumentLink | null>(null);

  const [linkApexModalOpen, setLinkApexModalOpen] = useState(false);

  // Add Link Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentLinkCategory>('General Reference');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newRevision, setNewRevision] = useState('');
  const [newDocDate, setNewDocDate] = useState('');
  const [newSubmissionDate, setNewSubmissionDate] = useState('');
  const [newApprovalDate, setNewApprovalDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Link APEX Record Form State
  const [targetType, setTargetType] = useState<ApexRecordType>('drawing');
  const [availableApexRecords, setAvailableApexRecords] = useState<any[]>([]);
  const [selectedApexRecordId, setSelectedApexRecordId] = useState('');
  const [apexRelationship, setApexRelationship] = useState<'Referenced In' | 'Superseded By' | 'Supported By' | 'Related Action' | 'General Link'>('Referenced In');
  const [apexNotes, setApexNotes] = useState('');
  const [apexLoading, setApexLoading] = useState(false);
  const [apexSubmitting, setApexSubmitting] = useState(false);

  // Detect Link Platform / Icon
  const getPlatformBadge = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes('autodesk') || lower.includes('bim360') || lower.includes('acc.autodesk')) {
      return { name: 'Autodesk Construction Cloud', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    if (lower.includes('sharepoint.com') || lower.includes('onedrive')) {
      return { name: 'Microsoft SharePoint / OneDrive', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (lower.includes('drive.google.com')) {
      return { name: 'Google Drive', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (lower.includes('procore')) {
      return { name: 'Procore DMS', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return { name: 'Secure HTTPS Document', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  // Open Add Link Modal
  const openAddLinkModal = () => {
    setNewTitle('');
    setNewUrl('');
    setNewCategory('General Reference');
    setNewDocNumber('');
    setNewRevision('');
    setNewDocDate('');
    setNewSubmissionDate('');
    setNewApprovalDate('');
    setNewDescription('');
    setLinkError(null);
    setAddLinkModalOpen(true);
  };

  // Open Edit Link Modal
  const openEditLinkModal = (link: DocumentLink) => {
    setSelectedLinkToEdit(link);
    setNewTitle(link.title);
    setNewUrl(link.url);
    setNewCategory((link.category as DocumentLinkCategory) || 'General Reference');
    setNewDocNumber(link.docNumber || '');
    setNewRevision(link.revision || '');
    setNewDocDate(link.docDate || '');
    setNewSubmissionDate(link.submissionDate || '');
    setNewApprovalDate(link.approvalDate || '');
    setNewDescription(link.description || '');
    setLinkError(null);
    setEditLinkModalOpen(true);
  };

  // Handle Add Link Submission
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) {
      setLinkError('Title and valid document URL are required.');
      return;
    }

    if (!/^https?:\/\/.+/i.test(newUrl.trim())) {
      setLinkError('URL must begin with http:// or https://');
      return;
    }

    setLinkSubmitting(true);
    setLinkError(null);

    try {
      const res = await fetch('/api/records/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          recordId,
          action: 'addDocumentLink',
          link: {
            title: newTitle.trim(),
            url: newUrl.trim(),
            category: newCategory,
            docNumber: newDocNumber.trim() || undefined,
            revision: newRevision.trim() || undefined,
            docDate: newDocDate || undefined,
            submissionDate: newSubmissionDate || undefined,
            approvalDate: newApprovalDate || undefined,
            description: newDescription.trim() || undefined,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAddLinkModalOpen(false);
        if (onUpdated) onUpdated(json.data.record);
      } else {
        setLinkError(json.error || 'Failed to save document link.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'Network error.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  // Handle Edit Link Submission
  const handleEditLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLinkToEdit) return;

    if (!newUrl.trim() || !newTitle.trim()) {
      setLinkError('Title and valid document URL are required.');
      return;
    }

    if (!/^https?:\/\/.+/i.test(newUrl.trim())) {
      setLinkError('URL must begin with http:// or https://');
      return;
    }

    setLinkSubmitting(true);
    setLinkError(null);

    try {
      const res = await fetch('/api/records/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          recordId,
          linkId: selectedLinkToEdit.id,
          updates: {
            title: newTitle.trim(),
            url: newUrl.trim(),
            category: newCategory,
            docNumber: newDocNumber.trim() || undefined,
            revision: newRevision.trim() || undefined,
            docDate: newDocDate || undefined,
            submissionDate: newSubmissionDate || undefined,
            approvalDate: newApprovalDate || undefined,
            description: newDescription.trim() || undefined,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditLinkModalOpen(false);
        if (onUpdated) onUpdated(json.data.record);
      } else {
        setLinkError(json.error || 'Failed to update document link.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'Network error.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  // Handle Remove Link
  const handleRemoveLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to remove this document link? This action is recorded in the audit trail.')) return;

    try {
      const res = await fetch('/api/records/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, recordId, linkId }),
      });
      const json = await res.json();
      if (json.success) {
        if (onUpdated) onUpdated(json.data);
      } else {
        alert(json.error || 'Failed to remove link');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  // Open Link APEX Record Modal
  const openLinkApexModal = async () => {
    setLinkApexModalOpen(true);
    await fetchRecordsForType(targetType);
  };

  const fetchRecordsForType = async (type: ApexRecordType) => {
    setApexLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'drawing': endpoint = '/api/drawings'; break;
        case 'submittal': endpoint = '/api/submittals'; break;
        case 'ir': endpoint = '/api/irs'; break;
        case 'mir': endpoint = '/api/mirs'; break;
        case 'rfi': endpoint = '/api/rfis'; break;
        case 'correspondence': endpoint = '/api/correspondence'; break;
        case 'quality': endpoint = '/api/quality'; break;
        case 'transmittal': endpoint = '/api/transmittals'; break;
        case 'handover': endpoint = '/api/handover'; break;
        default: endpoint = '/api/drawings';
      }

      const res = await fetch(`${endpoint}?projectId=${projectId || ''}`);
      const json = await res.json();
      if (json.success && json.data) {
        // Exclude the current record itself if same type
        const filtered = json.data.filter((r: any) => r.id !== recordId);
        setAvailableApexRecords(filtered);
        if (filtered.length > 0) {
          setSelectedApexRecordId(filtered[0].id);
        } else {
          setSelectedApexRecordId('');
        }
      }
    } catch (e) {
      console.error('Error fetching records', e);
    } finally {
      setApexLoading(false);
    }
  };

  // Handle Link APEX Record Submission
  const handleLinkApexSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApexRecordId) return;

    setApexSubmitting(true);
    try {
      const res = await fetch('/api/records/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          recordId,
          action: 'linkApexRecord',
          targetInfo: {
            recordType: targetType,
            recordId: selectedApexRecordId,
            relationship: apexRelationship,
            notes: apexNotes.trim() || undefined,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setLinkApexModalOpen(false);
        if (onUpdated) onUpdated(json.data.record);
      } else {
        alert(json.error || 'Failed to link record');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setApexSubmitting(false);
    }
  };

  // Handle Unlink APEX Record
  const handleUnlinkApex = async (linkedApexRecordId: string) => {
    if (!confirm('Are you sure you want to unlink this APEX record?')) return;

    try {
      const res = await fetch('/api/records/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, recordId, linkedApexRecordId }),
      });
      const json = await res.json();
      if (json.success) {
        if (onUpdated) onUpdated(json.data);
      } else {
        alert(json.error || 'Failed to unlink record');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const hasLegacyFiles = legacyAttachments.length > 0 || !!legacyFileUrl;

  return (
    <div className="space-y-4">
      {/* ===================================================================== */}
      {/* SECTION 1: EXTERNAL DOCUMENTS & REFERENCES (UNIVERSAL LINKS) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">
                {language === 'ar' ? 'الوثائق والمراجع الخارجية (Universal Document Links)' : 'Documents & References'}
              </h4>
              <p className="text-[10px] text-slate-500">
                SharePoint, BIM 360 / ACC, Google Drive, Procore & secure cloud document links
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={openAddLinkModal}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '+ إضافة رابط وثيقة' : 'Add Document Link'}</span>
            </button>
          )}
        </div>

        {documentLinks.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-lg mt-3 border border-dashed border-slate-200">
            <Globe className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-600">No external document links attached</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Attach controlled links to Autodesk Construction Cloud, SharePoint, OneDrive, or technical portals.
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {documentLinks.map((link) => {
              const platform = getPlatformBadge(link.url);
              return (
                <div 
                  key={link.id} 
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/40 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {link.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {link.category}
                      </span>
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${platform.bg}`}>
                        {platform.name}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      {link.docNumber && (
                        <span>Doc No: <b className="font-mono text-slate-700">{link.docNumber}</b></span>
                      )}
                      {link.revision && (
                        <span>Rev: <b className="font-mono text-amber-700">{link.revision}</b></span>
                      )}
                      {link.submissionDate && (
                        <span>Sent: <b className="font-mono">{formatDateSafe(link.submissionDate)}</b></span>
                      )}
                      {link.approvalDate && (
                        <span>Approved: <b className="font-mono text-emerald-700">{formatDateSafe(link.approvalDate)}</b></span>
                      )}
                      {link.addedBy && (
                        <span className="text-[10px] text-slate-400">by {link.addedBy}</span>
                      )}
                    </div>

                    {link.description && (
                      <div className="text-[11px] text-slate-600 mt-1 italic">
                        "{link.description}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                      title="Open external document in new browser tab safely"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ar' ? 'فتح الوثيقة' : 'Open Document'}</span>
                    </a>

                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEditLinkModal(link)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-amber-700 transition"
                          title="Edit details or replace URL"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-1.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition"
                          title="Remove document link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: LINKED APEX DC RECORDS (NO DUPLICATION) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-600" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">
                {language === 'ar' ? 'السجلات الهندسية المرتبطة في النظام' : 'Linked APEX DC Records'}
              </h4>
              <p className="text-[10px] text-slate-500">
                Cross-link Drawings, Submittals, IRs, MIRs, RFIs, and Transmittals without record duplication
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={openLinkApexModal}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '+ ربط سجل هندسي' : 'Link Existing Record'}</span>
            </button>
          )}
        </div>

        {linkedApexRecords.length === 0 ? (
          <div className="py-5 text-center text-slate-400 bg-slate-50/50 rounded-lg mt-3 border border-dashed border-slate-200">
            <Layers className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <div className="text-xs font-semibold text-slate-600">No linked system records</div>
            <div className="text-[11px] text-slate-400">
              Link related inspection requests, approved shop drawings, or technical queries.
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {linkedApexRecords.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-lg border border-purple-100 bg-purple-50/20 hover:bg-purple-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                      {item.recordNumber}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{item.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Rev {item.revision || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="text-purple-700 font-semibold">Relation: {item.relationship}</span>
                    {item.submissionDate && <span>Sent: <b>{formatDateSafe(item.submissionDate)}</b></span>}
                    {item.approvalDate && <span>Approved: <b>{formatDateSafe(item.approvalDate)}</b></span>}
                    {item.notes && <span className="italic">"{item.notes}"</span>}
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleUnlinkApex(item.id)}
                    className="p-1.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition self-end sm:self-center"
                    title="Unlink record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: LEGACY ATTACHMENTS (READ-ONLY PRESERVATION ARCHIVE) */}
      {/* ===================================================================== */}
      {hasLegacyFiles && (
        <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-900 text-[11px]">
                {language === 'ar' ? 'الملفات المرفقة السابقة (أرشيف للقراءة والتحميل فقط)' : 'Legacy File Attachments (Preserved Archive)'}
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-semibold">
              Read-Only
            </span>
          </div>

          <p className="text-[11px] text-amber-800/80 mb-2.5">
            Notice: Per document control governance, direct file uploads are deprecated. Existing attachments remain accessible below.
          </p>

          <div className="space-y-1.5">
            {legacyFileUrl && (
              <div className="flex items-center justify-between p-2 bg-white rounded border border-amber-200 text-xs">
                <span className="font-mono text-slate-800">{legacyFileName || 'Primary File Reference'}</span>
                <a
                  href={legacyFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Download / View</span>
                </a>
              </div>
            )}
            {legacyAttachments.map((att, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200 text-xs">
                <span className="font-mono text-slate-800">{att.name}</span>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Download / View</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD DOCUMENT LINK */}
      {/* ===================================================================== */}
      {addLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>Add Controlled Document Link</span>
                </h3>
                <div className="text-[10px] text-slate-300">
                  Target Record: <b className="font-mono text-amber-300">{recordRef}</b>
                </div>
              </div>
              <button onClick={() => setAddLinkModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLink} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {linkError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Approved Shop Drawing PDF & BIM Coordination Model"
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document URL (HTTPS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://company.sharepoint.com/... or https://acc.autodesk.com/..."
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Support SharePoint, OneDrive, Autodesk ACC / BIM 360, Google Drive, or company DMS.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DocumentLinkCategory)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                  >
                    {LINK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Number</label>
                  <input
                    type="text"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    placeholder="e.g. ACC-DWG-0042"
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision</label>
                  <input
                    type="text"
                    value={newRevision}
                    onChange={(e) => setNewRevision(e.target.value)}
                    placeholder="e.g. P02 / 01"
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={newSubmissionDate}
                    onChange={(e) => setNewSubmissionDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approval Date</label>
                  <input
                    type="date"
                    value={newApprovalDate}
                    onChange={(e) => setNewApprovalDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Remarks</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Additional contractual or technical context..."
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddLinkModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkSubmitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs disabled:opacity-50"
                >
                  {linkSubmitting ? 'Saving...' : 'Save Document Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT DOCUMENT LINK / REPLACE URL */}
      {/* ===================================================================== */}
      {editLinkModalOpen && selectedLinkToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Document Link & Replace URL</span>
                </h3>
                <div className="text-[10px] text-slate-300">
                  Target: <b className="font-mono text-amber-300">{selectedLinkToEdit.title}</b>
                </div>
              </div>
              <button onClick={() => setEditLinkModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditLink} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {linkError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Replace Document URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DocumentLinkCategory)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    {LINK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Number</label>
                  <input
                    type="text"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision</label>
                  <input
                    type="text"
                    value={newRevision}
                    onChange={(e) => setNewRevision(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={newSubmissionDate}
                    onChange={(e) => setNewSubmissionDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approval Date</label>
                  <input
                    type="date"
                    value={newApprovalDate}
                    onChange={(e) => setNewApprovalDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditLinkModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkSubmitting}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs disabled:opacity-50"
                >
                  {linkSubmitting ? 'Updating...' : 'Update & Replace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: LINK EXISTING APEX DC RECORD */}
      {/* ===================================================================== */}
      {linkApexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <span>Link Existing APEX DC Record</span>
                </h3>
                <div className="text-[10px] text-slate-300">
                  Target Record: <b className="font-mono text-amber-300">{recordRef}</b>
                </div>
              </div>
              <button onClick={() => setLinkApexModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkApexSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Module to Link From</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    const t = e.target.value as ApexRecordType;
                    setTargetType(t);
                    fetchRecordsForType(t);
                  }}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-semibold"
                >
                  <option value="drawing">Drawings & Shop Drawings (DWG)</option>
                  <option value="submittal">Technical Material Submittals (SUB)</option>
                  <option value="ir">Inspection Requests (IR / WIR)</option>
                  <option value="mir">Material Inspection Requests (MIR)</option>
                  <option value="rfi">Requests for Information (RFI)</option>
                  <option value="transmittal">Document Transmittals (TR)</option>
                  <option value="correspondence">Correspondence & Letters (COR)</option>
                  <option value="quality">Quality & NCRs (QA/QC)</option>
                  <option value="handover">Handover & Closeout Dossiers (HO)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Record to Link</label>
                {apexLoading ? (
                  <div className="p-3 text-center text-slate-400 bg-slate-50 rounded">Loading records...</div>
                ) : availableApexRecords.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 bg-slate-50 rounded">No available records found in this module.</div>
                ) : (
                  <select
                    value={selectedApexRecordId}
                    onChange={(e) => setSelectedApexRecordId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono"
                    required
                  >
                    {availableApexRecords.map((r: any) => {
                      const num = r.drawingNumber || r.submittalNumber || r.irNumber || r.mirNumber || r.rfiNumber || r.transmittalNumber || r.correspondenceNumber || r.recordNumber || r.itemNumber;
                      const title = r.title || r.subject || r.workDescription || r.materialDescription || r.description || '';
                      return (
                        <option key={r.id} value={r.id}>
                          {num} — {title.substring(0, 45)} ({r.currentRevision || r.revisionNumber || 'Active'})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relationship Type</label>
                <select
                  value={apexRelationship}
                  onChange={(e) => setApexRelationship(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                >
                  <option value="Referenced In">Referenced In (إشارة استدلالية)</option>
                  <option value="Supported By">Supported By (معزز بوثيقة داعمة)</option>
                  <option value="Superseded By">Superseded By (مستبدل بوثيقة أحدث)</option>
                  <option value="Related Action">Related Action (إجراء تصحيحي مرتبط)</option>
                  <option value="General Link">General Link (رابط عام)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relationship Notes</label>
                <textarea
                  value={apexNotes}
                  onChange={(e) => setApexNotes(e.target.value)}
                  placeholder="e.g. As-built layout approved under Code A in IR-0012"
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setLinkApexModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apexSubmitting || !selectedApexRecordId}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs disabled:opacity-50"
                >
                  {apexSubmitting ? 'Linking...' : 'Establish Record Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
