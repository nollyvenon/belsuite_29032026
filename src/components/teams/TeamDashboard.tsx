'use client';

import React, { useState, useEffect } from 'react';
import { useTeamNotifications } from '@/hooks/useTeamNotifications';
import TeamList from './TeamList';
import CreateTeamModal from './CreateTeamModal';
import TeamMembers from './TeamMembers';
import ApprovalBoard from './ApprovalBoard';

export default function TeamDashboard() {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'approvals'>('teams');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time notifications
  const { isConnected, notifications, subscribe, unsubscribe } = useTeamNotifications();

  useEffect(() => {
    if (activeTeamId) {
      subscribe(activeTeamId);
      return () => unsubscribe(activeTeamId);
    }
  }, [activeTeamId, subscribe, unsubscribe]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Team Management</h1>
              <p className="text-slate-400 mt-1">Manage teams, members, and approvals</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection status indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + New Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {(['teams', 'members', 'approvals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">Recent Activity</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-sm text-slate-200"
                >
                  {notif.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'teams' && <TeamList onSelectTeam={setActiveTeamId} />}
        {activeTab === 'members' && activeTeamId && (
          <TeamMembers teamId={activeTeamId} />
        )}
        {activeTab === 'approvals' && activeTeamId && (
          <ApprovalBoard teamId={activeTeamId} />
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
