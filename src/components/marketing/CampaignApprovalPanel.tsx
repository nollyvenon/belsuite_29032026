'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  Plus,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useCampaignApprovals } from '@/hooks/useMarketing';

interface Props {
  campaignId: string;
}

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  PENDING:  { badge: 'bg-amber-400/10 text-amber-400',   label: 'Pending' },
  APPROVED: { badge: 'bg-emerald-400/10 text-emerald-400', label: 'Approved' },
  REJECTED: { badge: 'bg-red-400/10 text-red-400',        label: 'Rejected' },
  REVOKED:  { badge: 'bg-zinc-700/50 text-zinc-400',      label: 'Revoked' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CampaignApprovalPanel({ campaignId }: Props) {
  const {
    approvals,
    loading,
    error,
    submitting,
    responding,
    submitApproval,
    respondToApproval,
    reload,
  } = useCampaignApprovals(campaignId);

  const [showSubmit, setShowSubmit] = useState(false);
  const [workflowId, setWorkflowId] = useState('');
  const [comments, setComments] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workflowId.trim()) return;
    const ok = await submitApproval({ workflowId: workflowId.trim(), comments: comments.trim() || undefined });
    if (ok) {
      setShowSubmit(false);
      setWorkflowId('');
      setComments('');
    }
  }

  async function handleRespond(approvalId: string, decision: 'APPROVED' | 'REJECTED') {
    await respondToApproval(approvalId, { decision, decisionReason: decisionReason.trim() || undefined });
    setDecisionReason('');
    setExpandedId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-white">Campaign Approvals</h2>
        </div>
        <button
          onClick={() => setShowSubmit((v) => !v)}
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Submit for Review
        </button>
      </div>

      {/* Submit form */}
      <AnimatePresence>
        {showSubmit && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-medium text-white">Submit for Approval</h3>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Workflow ID <span className="text-red-400">*</span>
                </label>
                <input
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  placeholder="Enter a workflow ID from your team settings"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                  required
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  The workflow must have <code>marketing_campaign</code> in its applicable content types.
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Comments (optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Add context for the reviewer..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !workflowId.trim()}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading / error state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4 justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Approvals list */}
      {!loading && !error && approvals.length === 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl py-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No approval requests yet</p>
          <p className="text-xs text-zinc-600 mt-1">Submit this campaign for review to collaborate with your team.</p>
        </div>
      )}

      <div className="space-y-3">
        {approvals.map((approval) => {
          const style = STATUS_STYLES[approval.status] ?? STATUS_STYLES['PENDING'];
          const isExpanded = expandedId === approval.id;
          const isPending = approval.status === 'PENDING';

          return (
            <div
              key={approval.id}
              className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden"
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                  {style.label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <User className="w-3 h-3" />
                    <span>{approval.submittedBy?.email ?? '—'}</span>
                    <span className="text-zinc-600">·</span>
                    <Calendar className="w-3 h-3" />
                    <span>{fmt(approval.submittedAt)}</span>
                  </div>
                  {approval.comments && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{approval.comments}</p>
                  )}
                </div>

                <div className="shrink-0 text-xs text-zinc-500">
                  {approval.receivedApprovals}/{approval.requiredApprovals} approvals
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="px-5 py-4 space-y-4">
                      {/* Individual responses */}
                      {approval.approvals.length > 0 && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">
                            Responses
                          </p>
                          <div className="space-y-2">
                            {approval.approvals.map((resp) => (
                              <div
                                key={resp.id}
                                className="flex items-center gap-3 text-sm"
                              >
                                {resp.decision === 'APPROVED' ? (
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <X className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                                <span className="text-zinc-300 truncate">
                                  {resp.approver?.email ?? '—'}
                                </span>
                                {resp.decisionReason && (
                                  <span className="text-zinc-500 text-xs truncate">
                                    "{resp.decisionReason}"
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Respond section — only show for pending approvals */}
                      {isPending && (
                        <div className="space-y-3">
                          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
                            Your Decision
                          </p>
                          <textarea
                            value={decisionReason}
                            onChange={(e) => setDecisionReason(e.target.value)}
                            rows={2}
                            placeholder="Optional reason..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 resize-none"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              disabled={responding === approval.id}
                              onClick={() => handleRespond(approval.id, 'APPROVED')}
                              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {responding === approval.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              disabled={responding === approval.id}
                              onClick={() => handleRespond(approval.id, 'REJECTED')}
                              className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-1.5 rounded-lg text-sm hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
