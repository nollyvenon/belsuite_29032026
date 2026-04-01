'use client';

import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAnalyticsTrends } from '@/hooks/useAnalyticsInsights';

export function UsageTrendsChart() {
  const { trends, loading, error } = useAnalyticsTrends();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !trends || trends.length === 0) {
    return (
      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        Could not load analytics trends
      </div>
    );
  }

  const pipelineData = [
    { stage: 'Uploaded', count: 1240, fill: '#60a5fa' },
    { stage: 'Processing', count: 380, fill: '#fbbf24' },
    { stage: 'Review', count: 220, fill: '#34d399' },
    { stage: 'Published', count: 2290, fill: '#10b981' },
    { stage: 'Archived', count: 1080, fill: '#6b7280' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Module Activity Trends</h3>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="analytics" stroke="#fbbf24" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marketing" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="social" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="video" stroke="#c084fc" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ugc" stroke="#f87171" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ai" stroke="#fca5a5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Content Production Pipeline</h3>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="stage" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
