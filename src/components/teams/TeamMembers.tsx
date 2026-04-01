'use client';

import React, { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
  permissions: string[];
}

interface TeamMembersProps {
  teamId: string;
}

const ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'APPROVER', 'VIEWER'];

export default function TeamMembers({ teamId }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teams/${teamId}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to invite member');
      }

      setInviteEmail('');
      setInviteRole('EDITOR');
      setShowInviteForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      
      setEditingMemberId(null);
      await fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member from the team?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to remove member');
      await fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Team Members</h2>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviteLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {inviteLoading ? 'Sending...' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Members Table */}
      {!loading && members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Joined</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{member.userName}</td>
                  <td className="px-6 py-4 text-slate-300">{member.userEmail}</td>
                  <td className="px-6 py-4">
                    {editingMemberId === member.id ? (
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        onBlur={() => handleUpdateRole(member.id, editingRole)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateRole(member.id, editingRole);
                          if (e.key === 'Escape') setEditingMemberId(null);
                        }}
                        autoFocus
                        className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        onClick={() => {
                          setEditingMemberId(member.id);
                          setEditingRole(member.role);
                        }}
                        className="cursor-pointer px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No members yet</p>
          <button
            onClick={() => setShowInviteForm(true)}
            className="text-blue-400 hover:text-blue-300 mt-2 text-sm"
          >
            Invite your first member
          </button>
        </div>
      )}
    </div>
  );
}
