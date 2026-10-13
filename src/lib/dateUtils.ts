// APEX DC — Standardized Workflow Date Engine & SLA Overdue Calculator
import { DocumentLifecycleDates } from '@/types';

export interface SlaCalculationResult {
  statusGroup: 'AWAITING_SUBMISSION' | 'PENDING_REVIEW' | 'OVERDUE' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  status: 'AWAITING_SUBMISSION' | 'PENDING_REVIEW' | 'OVERDUE' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  category: 'AWAITING_SUBMISSION' | 'PENDING_REVIEW' | 'OVERDUE' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  isOverdue: boolean;
  overdueDays: number;
  daysRemaining: number;
  countdownDays: number;
  badgeLabel: string;
  label: string;
  badgeClass: string;
  dotColor: string;
  turnaroundDays?: number;
  effectiveRequiredDate: string;
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

export function diffInDays(dateAStr: string, dateBStr: string): number {
  try {
    const a = new Date(dateAStr);
    const b = new Date(dateBStr);
    const diffTime = a.getTime() - b.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function calculateSlaStatus(
  dates: DocumentLifecycleDates,
  reviewDurationDays: number = 14,
  status?: string
): SlaCalculationResult {
  const today = todayIso();
  const subDate = dates.submissionDate || '';
  const respDate = dates.consultantResponseDate || dates.approvalDate || '';
  const appDate = dates.approvalDate || '';
  const closeDate = dates.closureDate || '';
  const reqDate = dates.requiredApprovalDate || (subDate ? addDays(subDate, reviewDurationDays) : '');

  const normStatus = (status || '').toLowerCase();
  const isApprovedStatus = 
    normStatus.includes('code a') || 
    normStatus.includes('code b') || 
    normStatus === 'approved' || 
    normStatus === 'accepted';
  const isRejectedStatus = 
    normStatus.includes('code c') || 
    normStatus.includes('code d') || 
    normStatus === 'rejected';
  const isClosedStatus = normStatus === 'closed' || !!closeDate;

  // Case 1: Closed out
  if (isClosedStatus) {
    const turn = subDate && (closeDate || respDate) ? diffInDays(closeDate || respDate, subDate) : undefined;
    const badgeLabel = 'Closed & Archived';
    return {
      statusGroup: 'CLOSED',
      status: 'CLOSED',
      category: 'CLOSED',
      isOverdue: false,
      overdueDays: 0,
      daysRemaining: 0,
      countdownDays: 0,
      badgeLabel,
      label: badgeLabel,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-slate-400',
      turnaroundDays: turn,
      effectiveRequiredDate: reqDate,
    };
  }

  // Case 2: Approved
  if (isApprovedStatus || appDate) {
    const turn = subDate && (appDate || respDate) ? diffInDays(appDate || respDate, subDate) : undefined;
    const badgeLabel = turn !== undefined ? `Approved (${turn}d turnaround)` : 'Approved';
    return {
      statusGroup: 'APPROVED',
      status: 'APPROVED',
      category: 'APPROVED',
      isOverdue: false,
      overdueDays: 0,
      daysRemaining: 0,
      countdownDays: 0,
      badgeLabel,
      label: badgeLabel,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
      dotColor: 'bg-emerald-500',
      turnaroundDays: turn,
      effectiveRequiredDate: reqDate,
    };
  }

  // Case 3: Rejected / Revise
  if (isRejectedStatus) {
    const turn = subDate && respDate ? diffInDays(respDate, subDate) : undefined;
    const badgeLabel = 'Returned with Comments';
    return {
      statusGroup: 'REJECTED',
      status: 'REJECTED',
      category: 'REJECTED',
      isOverdue: false,
      overdueDays: 0,
      daysRemaining: 0,
      countdownDays: 0,
      badgeLabel,
      label: badgeLabel,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
      dotColor: 'bg-orange-500',
      turnaroundDays: turn,
      effectiveRequiredDate: reqDate,
    };
  }

  // Case 4: Awaiting Submission (Draft, Internal Review, or Not Yet Sent)
  if (!subDate || normStatus === 'draft' || normStatus.includes('internal')) {
    const isReady = normStatus.includes('internal') || dates.internalReviewDate;
    const badgeLabel = isReady ? 'Internal Review Ready' : 'Awaiting Submission';
    const overdueDays = dates.plannedSubmissionDate ? Math.max(0, diffInDays(today, dates.plannedSubmissionDate)) : 0;
    const daysRemaining = dates.plannedSubmissionDate ? Math.max(0, diffInDays(dates.plannedSubmissionDate, today)) : 0;
    return {
      statusGroup: 'AWAITING_SUBMISSION',
      status: 'AWAITING_SUBMISSION',
      category: 'AWAITING_SUBMISSION',
      isOverdue: dates.plannedSubmissionDate ? diffInDays(today, dates.plannedSubmissionDate) > 0 : false,
      overdueDays,
      daysRemaining,
      countdownDays: daysRemaining,
      badgeLabel,
      label: badgeLabel,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-amber-400',
      effectiveRequiredDate: reqDate,
    };
  }

  // Case 5: Submitted to Consultant, Awaiting Decision / Response
  if (reqDate) {
    const daysPast = diffInDays(today, reqDate);
    if (daysPast > 0) {
      const badgeLabel = `⚠️ Overdue ${daysPast}d`;
      return {
        statusGroup: 'OVERDUE',
        status: 'OVERDUE',
        category: 'OVERDUE',
        isOverdue: true,
        overdueDays: daysPast,
        daysRemaining: 0,
        countdownDays: -daysPast,
        badgeLabel,
        label: badgeLabel,
        badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
        dotColor: 'bg-red-500',
        effectiveRequiredDate: reqDate,
      };
    } else {
      const remaining = Math.max(0, -daysPast);
      const badgeLabel = `⏱️ ${remaining}d Left to Respond`;
      return {
        statusGroup: 'PENDING_REVIEW',
        status: 'PENDING_REVIEW',
        category: 'PENDING_REVIEW',
        isOverdue: false,
        overdueDays: 0,
        daysRemaining: remaining,
        countdownDays: remaining,
        badgeLabel,
        label: badgeLabel,
        badgeClass: remaining <= 3 
          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
          : 'bg-blue-100 text-blue-800 border-blue-200 font-medium',
        dotColor: remaining <= 3 ? 'bg-amber-500' : 'bg-blue-500',
        effectiveRequiredDate: reqDate,
      };
    }
  }

  // Fallback
  const badgeLabel = 'Under Review';
  return {
    statusGroup: 'PENDING_REVIEW',
    status: 'PENDING_REVIEW',
    category: 'PENDING_REVIEW',
    isOverdue: false,
    overdueDays: 0,
    daysRemaining: reviewDurationDays,
    countdownDays: reviewDurationDays,
    badgeLabel,
    label: badgeLabel,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-400',
    effectiveRequiredDate: reqDate,
  };
}

export function formatDateSafe(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return clean;
  } catch {
    return dateStr;
  }
}
