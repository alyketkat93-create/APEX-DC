'use client';

import React from 'react';
import { DocumentLifecycleDates } from '@/types';
import { calculateSlaStatus, formatDateSafe, SlaCalculationResult } from '@/lib/dateUtils';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, 
  Send, Eye, Stamp, Archive, History, Layers,
  Edit3, X, AlertCircle, ChevronDown, ChevronUp, Check
} from 'lucide-react';

interface DateStatusBadgeProps {
  dates?: DocumentLifecycleDates;
  sla?: SlaCalculationResult;
  reviewDurationDays?: number;
  slaDays?: number;
  status?: string;
  language?: 'en' | 'ar';
}

export function DateStatusBadge({ dates, sla: providedSla, reviewDurationDays = 14, slaDays, status, language = 'en' }: DateStatusBadgeProps) {
  const effectiveDuration = slaDays || reviewDurationDays;
  const sla: SlaCalculationResult = providedSla || (dates ? calculateSlaStatus(dates, effectiveDuration, status) : {
    statusGroup: 'AWAITING_SUBMISSION',
    status: 'AWAITING_SUBMISSION',
    category: 'AWAITING_SUBMISSION',
    isOverdue: false,
    overdueDays: 0,
    daysRemaining: 0,
    countdownDays: 0,
    badgeLabel: 'Draft',
    label: 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
    effectiveRequiredDate: '',
  });

  const subDate = dates?.submissionDate;
  const respDate = dates?.approvalDate || dates?.consultantResponseDate;

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 ${sla.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sla.dotColor}`}></span>
          <span>{sla.badgeLabel}</span>
        </span>
      </div>

      {(subDate || respDate) && (
        <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-2">
          {subDate && (
            <span title="Submission Date">
              <span className="text-slate-400 font-sans">{language === 'ar' ? 'أُرسل:' : 'Sent:'}</span> {formatDateSafe(subDate)}
            </span>
          )}
          {respDate && (
            <span title="Response / Approval Date" className="text-emerald-700 font-semibold">
              <span className="text-slate-400 font-sans">{language === 'ar' ? 'اعتمد:' : 'Resp:'}</span> {formatDateSafe(respDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DateLifecycleCardProps {
  dates: DocumentLifecycleDates;
  reviewDurationDays?: number;
  slaDays?: number;
  status?: string;
  language?: 'en' | 'ar';
  moduleId?: string;
  recordId?: string;
  recordRef?: string;
  onDatesUpdated?: (updatedRecord: any) => void;
  canEdit?: boolean;
  allowEdit?: boolean;
}

export function DateLifecycleCard({ 
  dates, 
  reviewDurationDays = 14, 
  slaDays, 
  status, 
  language = 'en',
  moduleId,
  recordId,
  recordRef,
  onDatesUpdated,
  canEdit = true,
  allowEdit,
}: DateLifecycleCardProps) {
  const isEditable = allowEdit !== undefined ? allowEdit : canEdit;
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  const effectiveDuration = slaDays || reviewDurationDays;
  const sla = calculateSlaStatus(dates, effectiveDuration, status);

  const correctionsCount = dates.dateCorrectionHistory?.length || 0;

  const dateItems = [
    {
      num: 1,
      key: 'preparationDate',
      label: language === 'ar' ? '1. تاريخ الإعداد والصياغة' : '1. Preparation Date',
      value: dates.preparationDate,
      icon: Calendar,
      color: 'text-slate-600',
    },
    {
      num: 2,
      key: 'internalReviewDate',
      label: language === 'ar' ? '2. المراجعة الداخلية' : '2. Internal Review Date',
      value: dates.internalReviewDate,
      icon: Eye,
      color: 'text-indigo-600',
    },
    {
      num: 3,
      key: 'submissionDate',
      label: language === 'ar' ? '3. تاريخ الإرسال / التسليم' : '3. Submission / Sending Date',
      value: dates.submissionDate,
      icon: Send,
      color: 'text-blue-600',
      extra: dates.plannedSubmissionDate ? `(Planned: ${formatDateSafe(dates.plannedSubmissionDate)})` : undefined
    },
    {
      num: 4,
      key: 'consultantReceiptDate',
      label: language === 'ar' ? '4. استلام الاستشاري' : '4. Consultant Receipt Date',
      value: dates.consultantReceiptDate,
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      num: 5,
      key: 'consultantResponseDate',
      label: language === 'ar' ? '5. رد وملاحظات الاستشاري' : '5. Consultant Response Date',
      value: dates.consultantResponseDate,
      icon: Stamp,
      color: 'text-amber-600',
      extra: dates.requiredApprovalDate ? `(Due: ${formatDateSafe(dates.requiredApprovalDate)})` : undefined
    },
    {
      num: 6,
      key: 'approvalDate',
      label: language === 'ar' ? '6. تاريخ الاعتماد الرسمي' : '6. Official Approval Date',
      value: dates.approvalDate,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      num: 7,
      key: 'revisionDate',
      label: language === 'ar' ? '7. تاريخ المراجعة الحالية' : '7. Revision Date',
      value: dates.revisionDate,
      icon: History,
      color: 'text-cyan-600',
    },
    {
      num: 8,
      key: 'closureDate',
      label: language === 'ar' ? '8. تاريخ الإغلاق والأرشفة' : '8. Closure / Archive Date',
      value: dates.closureDate,
      icon: Archive,
      color: 'text-slate-600',
    },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Header with Title, Badges and Edit Dates Action */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <h4 className="font-bold text-xs text-slate-900">
            {language === 'ar' ? 'سجل تتبع المواعيد والمهل التعاقدية (8 محطات)' : 'Mandatory 8-Point Date Tracking & SLA Performance'}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {correctionsCount > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] flex items-center gap-1 hover:bg-amber-200 transition"
              title="View historical date corrections"
            >
              <History className="w-3 h-3 text-amber-700" />
              <span>{language === 'ar' ? `مصححة (${correctionsCount})` : `Corrected (${correctionsCount})`}</span>
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sla.badgeClass}`}>
            {sla.badgeLabel}
          </span>

          {isEditable && moduleId && recordId && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-2xs"
              title="Edit or correct record lifecycle dates"
            >
              <Edit3 className="w-3 h-3" />
              <span>{language === 'ar' ? 'تعديل التواريخ' : 'Edit Dates'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 8-Point Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {dateItems.map((item) => {
          const Icon = item.icon;
          const isFilled = !!item.value;
          return (
            <div 
              key={item.key}
              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition ${
                isFilled 
                  ? 'bg-white border-slate-200 shadow-2xs' 
                  : 'bg-slate-100/60 border-dashed border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="text-[10px] font-bold text-slate-700 truncate">{item.label}</span>
              </div>
              <div>
                <div className="font-mono font-bold text-xs text-slate-900">
                  {formatDateSafe(item.value)}
                </div>
                {item.extra && (
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{item.extra}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Date Corrections Log Accordion */}
      {showHistory && dates.dateCorrectionHistory && dates.dateCorrectionHistory.length > 0 && (
        <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'ar' ? 'سجل تصحيحات وتعديلات التواريخ السابقة' : 'Historical Date Corrections Log'}</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {dates.dateCorrectionHistory.map((log) => (
              <div key={log.id} className="p-2 bg-white rounded border border-amber-200 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800">{log.fieldLabelEn}: </span>
                  <s className="text-slate-400 font-mono mr-1.5">{log.previousDate || 'None'}</s>
                  <span className="text-emerald-700 font-bold font-mono">→ {log.newDate}</span>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    Reason: "{log.reason}"
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono self-end sm:self-auto shrink-0">
                  {log.correctedBy} • {formatDateSafe(log.correctedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Date Correction Modal */}
      {editModalOpen && moduleId && recordId && (
        <DateCorrectionModal
          moduleId={moduleId}
          recordId={recordId}
          recordRef={recordRef || 'Record'}
          initialDates={dates}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={(updated) => {
            setEditModalOpen(false);
            if (onDatesUpdated) onDatesUpdated(updated);
          }}
          language={language}
        />
      )}
    </div>
  );
}

interface DateCorrectionModalProps {
  moduleId: string;
  recordId: string;
  recordRef: string;
  initialDates: DocumentLifecycleDates;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRecord: any) => void;
  language?: 'en' | 'ar';
}

export function DateCorrectionModal({
  moduleId,
  recordId,
  recordRef,
  initialDates,
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
}: DateCorrectionModalProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({
    preparationDate: initialDates.preparationDate || '',
    internalReviewDate: initialDates.internalReviewDate || '',
    submissionDate: initialDates.submissionDate || '',
    plannedSubmissionDate: initialDates.plannedSubmissionDate || '',
    consultantReceiptDate: initialDates.consultantReceiptDate || '',
    requiredApprovalDate: initialDates.requiredApprovalDate || '',
    plannedResponseDate: initialDates.plannedResponseDate || '',
    actualResponseDate: initialDates.actualResponseDate || '',
    consultantResponseDate: initialDates.consultantResponseDate || '',
    approvalDate: initialDates.approvalDate || '',
    revisionDate: initialDates.revisionDate || '',
    inspectionDate: initialDates.inspectionDate || '',
    dispatchDate: initialDates.dispatchDate || '',
    closureDate: initialDates.closureDate || '',
  });

  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  // Determine if official dates are modified
  const officialFields = ['submissionDate', 'consultantReceiptDate', 'consultantResponseDate', 'approvalDate', 'closureDate'];
  const isOfficialModified = officialFields.some(
    (f) => (formData[f] || '') !== ((initialDates as any)[f] || '')
  );

  // Logical checks
  const warnings: string[] = [];
  if (formData.submissionDate && formData.preparationDate && formData.submissionDate < formData.preparationDate) {
    warnings.push('Advisory: Actual submission date is earlier than preparation date.');
  }
  if (formData.approvalDate && formData.submissionDate && formData.approvalDate < formData.submissionDate) {
    warnings.push('Advisory: Approval date is earlier than submission date.');
  }
  if (formData.closureDate && formData.approvalDate && formData.closureDate < formData.approvalDate) {
    warnings.push('Advisory: Closure date is earlier than approval date.');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOfficialModified && (!reason || !reason.trim())) {
      setError('A valid contractual or technical reason is strictly required when modifying official submission, receipt, approval, or closure dates.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/records/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          recordId,
          dateUpdates: formData,
          reason: reason.trim() || 'Authorized date update',
          userId: 'usr-1',
          userName: 'Document Controller',
        }),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess(json.data);
      } else {
        setError(json.error || 'Failed to update dates.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in text-left">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-navy-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xs flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'تعديل وتصحيح التواريخ الرسمية للسجل' : 'Edit & Correct Record Lifecycle Dates'}</span>
            </h3>
            <div className="text-[10px] text-slate-300">
              Record: <b className="font-mono text-amber-300">{recordRef}</b> • Changes will be permanently stamped in Audit Trail
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              {warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
              <div className="text-[10px] text-slate-500 italic mt-1">
                Notice: Logical advisories will not block legitimate corrections.
              </div>
            </div>
          )}

          {/* Date Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">1. Preparation Date</label>
              <input
                type="date"
                value={formData.preparationDate}
                onChange={(e) => setFormData({ ...formData, preparationDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5">2. Internal Review Date</label>
              <input
                type="date"
                value={formData.internalReviewDate}
                onChange={(e) => setFormData({ ...formData, internalReviewDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                <span>3. Actual Submission Date</span>
                <span className="text-[9px] text-blue-600 font-semibold font-mono">[Official]</span>
              </label>
              <input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Planned Submission Date</label>
              <input
                type="date"
                value={formData.plannedSubmissionDate}
                onChange={(e) => setFormData({ ...formData, plannedSubmissionDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                <span>4. Consultant Receipt Date</span>
                <span className="text-[9px] text-purple-600 font-semibold font-mono">[Official]</span>
              </label>
              <input
                type="date"
                value={formData.consultantReceiptDate}
                onChange={(e) => setFormData({ ...formData, consultantReceiptDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                <span>5. Consultant Response Date</span>
                <span className="text-[9px] text-amber-600 font-semibold font-mono">[Official]</span>
              </label>
              <input
                type="date"
                value={formData.consultantResponseDate}
                onChange={(e) => setFormData({ ...formData, consultantResponseDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                <span>6. Official Approval Date</span>
                <span className="text-[9px] text-emerald-600 font-semibold font-mono">[Official]</span>
              </label>
              <input
                type="date"
                value={formData.approvalDate}
                onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5">7. Revision Date</label>
              <input
                type="date"
                value={formData.revisionDate}
                onChange={(e) => setFormData({ ...formData, revisionDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5">8. Closure Date</label>
              <input
                type="date"
                value={formData.closureDate}
                onChange={(e) => setFormData({ ...formData, closureDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Inspection / Dispatch Date</label>
              <input
                type="date"
                value={formData.inspectionDate || formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value, dispatchDate: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>
          </div>

          {/* Mandatory Reason Field when official dates modified */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Reason for Date Correction {isOfficialModified && <span className="text-rose-600 font-bold">* (Mandatory for Official Dates)</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Correcting submission timestamp to align with stamped transmittal receipt acknowledgement APX-TR-0042..."
              rows={2}
              className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-amber-500 font-medium"
              required={isOfficialModified}
            />
          </div>

          <div className="p-2.5 rounded bg-slate-100 text-[11px] text-slate-600 border border-slate-200">
            <b>Governance Invariant:</b> Modifying dates will update the actual database and audit log. It will <b>NEVER</b> automatically alter the document's review status or approval codes.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs shadow-2xs disabled:opacity-50"
            >
              {submitting ? 'Saving to Database...' : 'Save Date Corrections'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DateInputsFormProps {
  dates?: any;
  values?: any;
  onChange: any;
  requireSubmissionDate?: boolean;
  language?: 'en' | 'ar';
}

export function DateInputsFormSection({ dates, values, onChange, requireSubmissionDate, language = 'en' }: DateInputsFormProps) {
  const currentDates = dates || values || {};

  const updateField = (field: keyof DocumentLifecycleDates, val: string) => {
    if (typeof onChange === 'function') {
      if (onChange.length === 2) {
        onChange(field, val);
      } else {
        onChange({
          ...currentDates,
          [field]: val
        });
      }
    }
  };

  return (
    <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <Calendar className="w-3.5 h-3.5 text-amber-600" />
        <span>{language === 'ar' ? 'المواعيد والمهل التعاقدية الإلزامية للمستند' : 'Mandatory Workflow Lifecycle Dates'}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '1. تاريخ الإعداد' : '1. Prep Date'}
          </label>
          <input
            type="date"
            value={currentDates.preparationDate || ''}
            onChange={(e) => updateField('preparationDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '2. المراجعة الداخلية' : '2. Internal Review'}
          </label>
          <input
            type="date"
            value={currentDates.internalReviewDate || ''}
            onChange={(e) => updateField('internalReviewDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '3. تاريخ الإرسال' : '3. Submission Date'}
          </label>
          <input
            type="date"
            value={currentDates.submissionDate || ''}
            onChange={(e) => updateField('submissionDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-blue-900"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '4. استلام الاستشاري' : '4. Consultant Receipt'}
          </label>
          <input
            type="date"
            value={currentDates.consultantReceiptDate || ''}
            onChange={(e) => updateField('consultantReceiptDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '5. رد الاستشاري' : '5. Consultant Response'}
          </label>
          <input
            type="date"
            value={currentDates.consultantResponseDate || ''}
            onChange={(e) => updateField('consultantResponseDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '6. تاريخ الاعتماد' : '6. Approval Date'}
          </label>
          <input
            type="date"
            value={currentDates.approvalDate || ''}
            onChange={(e) => updateField('approvalDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-emerald-900"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '7. تاريخ المراجعة' : '7. Revision Date'}
          </label>
          <input
            type="date"
            value={currentDates.revisionDate || ''}
            onChange={(e) => updateField('revisionDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
            {language === 'ar' ? '8. تاريخ الإغلاق' : '8. Closure Date'}
          </label>
          <input
            type="date"
            value={currentDates.closureDate || ''}
            onChange={(e) => updateField('closureDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}
