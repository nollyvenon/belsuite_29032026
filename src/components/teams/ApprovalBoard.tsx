'use client';

import React, { useState, useEffect } from 'react';

interface Approval {
  id: string;
  contentId: string;
  contentType: string;
  status: string;
  requiredApprovals: number;
  receivedApprovals: number;
  submittedBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  myDecision: string | null;
  myResponse: string | null;
  submittedAt: string;
  dueAt: string | null;
}

interface ApprovalBoardProps {
  teamId: string;
}

export default function ApprovalBoard({ teamId }: ApprovalBoardProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondReason, setRespondReason] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teams/${teamId}/approvals/pending?page=1&pageSize=50`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch approvals');
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Poll every 10 seconds
    const interval = setInterval(fetchApprovals, 10000);
    return () => clearInterval(interval);
  }, [teamId]);

  const handleRespond = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/teams/${teamId}/approvals/${approvalId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          decision,
          decisionReason: respondReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to respond to approval');
      
      setRespondingId(null);
      setRespondReason('');
      await fetchApprovals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-900/30 text-green-200 border-green-500/50';
      case 'REJECTED':
        return 'bg-red-900/30 text-red-200 border-red-500/50';
      case 'PENDING':
        return 'bg-yellow-900/30 text-yellow-200 border-yellow-500/50';
      default:
        return 'bg-slate-900/30 text-slate-200 border-slate-500/50';
    }
  };

  const getProgressPercent = (received: number, required: number) => {
    return Math.round((received / required) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Approval Workflow</h2>
        <button
          onClick={fetchApprovals}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Approvals List */}
      {!loading && approvals.length > 0 && (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className={`p-6 border rounded-lg ${getStatusColor(approval.status)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">{approval.contentType}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">
                    Submitted by {approval.submittedBy.firstName || approval.submittedBy.email}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(approval.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-2xl font-bold opacity-80">
                  #{approval.contentId.slice(0, 8)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Approvals Progress</span>
                  <span className="text-sm opacity-80">
                    {approval.receivedApprovals}/{approval.requiredApprovals}
                  </span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${getProgressPercent(approval.receivedApprovals, approval.requiredApprovals)}%` }}
                  />
                </div>
              </div>

              {/* Decision Section */}
              {approval.status === 'PENDING' && approval.myDecision === null && (
                <div className="space-y-3 pt-4 border-t border-current opacity-50">
                  {respondingId === approval.id ? (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Optional reason for your decision..."
                        value={respondReason}
                        onChange={(e) => setRespondReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(approval.id, 'APPROVED')}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRespond(approval.id, 'REJECTED')}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setRespondingId(null);
                            setRespondReason('');
                          }}
                          className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingId(approval.id)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Give Your Approval
                    </button>
                  )}
                </div>
              )}

              {approval.myDecision && (
                <div className="pt-4 border-t border-current opacity-50">
                  <p className="text-sm font-medium">Your decision: {approval.myDecision}</p>
                  {approval.myResponse && (
                    <p className="text-sm opacity-80 mt-1">{approval.myResponse}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && approvals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No pending approvals</p>
          <p className="text-slate-500 text-sm">All approvals are up to date</p>
        </div>
      )}
    </div>
  );
}
