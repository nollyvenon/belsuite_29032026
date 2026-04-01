'use client';

import { Cloud, Code, Zap, Server, Loader2 } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';

export function SystemHealthDashboard() {
  const { health, loading, error } = useSystemHealth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        Could not load system health
      </div>
    );
  }  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {health.systems.map((system) => {
            const statusColor = {
              online: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              degraded: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              offline: 'bg-red-500/10 border-red-500/20 text-red-400',
            }[system.status];

            const iconMap: Record<string, any> = { api: Server, database: Cloud, 'ai-service': Zap, cdn: Code };
            const Icon = iconMap[system.id] || Server;

            return (
              <div key={system.id} className={`rounded-2xl border ${statusColor} p-5 border-opacity-50`}>
                <div className="flex items-start justify-between mb-4">
                  <Icon className="h-5 w-5" />
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-current" />
                    <span className="text-xs font-semibold capitalize">{system.status}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-3">{system.name}</p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Latency</span>
                    <span className="text-white font-medium">{system.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="text-white font-medium">{system.uptime.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {health.incidents.map((incident, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-sm text-white">{incident.title}</p>
                <p className="text-xs text-slate-500 mt-1">Last incident {incident.days} days ago — resolved</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Resource Usage</h3>
          <div className="space-y-3">
            {[
              { label: 'CPU', usage: health.resources.cpu },
              { label: 'Memory', usage: health.resources.memory },
              { label: 'Storage', usage: health.resources.storage },
            ].map((resource) => (
              <div key={resource.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">{resource.label}</span>
                  <span className="text-sm font-semibold text-white">{resource.usage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-sky-600" style={{ width: `${resource.usage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
