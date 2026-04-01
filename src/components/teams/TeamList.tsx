'use client';

import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberCount: number;
  maxMembers?: number;
  requiresApproval: boolean;
  isPublic: boolean;
  createdAt: string;
}

interface TeamListProps {
  onSelectTeam: (teamId: string) => void;
}

export default function TeamList({ onSelectTeam }: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name'>('createdAt');

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/teams?page=1&pageSize=50&sortBy=${sortBy}&sortOrder=desc&search=${searchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchQuery]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
        </select>
        <button
          onClick={fetchTeams}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 mt-2">Loading teams...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Teams Grid */}
      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className="p-6 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-slate-500 cursor-pointer transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                  <p className="text-sm text-slate-400">/{team.slug}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  team.isPublic
                    ? 'bg-green-900/30 text-green-200'
                    : 'bg-slate-600 text-slate-200'
                }`}>
                  {team.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {team.description && (
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex justify-between items-center text-sm text-slate-400">
                <div className="flex gap-4">
                  <span>👥 {team.memberCount}{team.maxMembers ? `/${team.maxMembers}` : ''}</span>
                  <span>
                    {team.requiresApproval ? '✓ Approval' : 'No Approval'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(team.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No teams found</p>
          <p className="text-slate-500 text-sm">Create your first team to get started</p>
        </div>
      )}
    </div>
  );
}
