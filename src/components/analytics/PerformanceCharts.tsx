'use client';

import type { AnalyticsTimeseriesPoint, EngagementBreakdownItem } from '@/hooks/useAnalytics';

function makePolyline(points: number[], width: number, height: number) {
  const max = Math.max(...points, 1);
  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function LineChartCard({
  title,
  subtitle,
  points,
  color,
}: {
  title: string;
  subtitle: string;
  points: number[];
  color: string;
}) {
  const latest = points[points.length - 1] ?? 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <p className="text-lg font-semibold text-white">{formatCompact(latest)}</p>
      </div>

      <svg viewBox="0 0 240 80" className="w-full h-28">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={makePolyline(points, 240, 80)}
        />
      </svg>
    </div>
  );
}

function BreakdownList({ title, items }: { title: string; items: EngagementBreakdownItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">No tracked data yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-300">{item.label}</span>
                <span className="text-zinc-500">{item.value} · {item.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PerformanceCharts({
  performanceChart,
  byType,
  byChannel,
}: {
  performanceChart: AnalyticsTimeseriesPoint[];
  byType: EngagementBreakdownItem[];
  byChannel: EngagementBreakdownItem[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-6 md:grid-cols-2">
        <LineChartCard
          title="Views Trend"
          subtitle="Daily tracked views over the selected range"
          points={performanceChart.map((item) => item.views)}
          color="#7dd3fc"
        />
        <LineChartCard
          title="Revenue Trend"
          subtitle="Collected revenue from payments"
          points={performanceChart.map((item) => item.revenue)}
          color="#34d399"
        />
        <LineChartCard
          title="Engagement Trend"
          subtitle="Daily interactions across tracked events"
          points={performanceChart.map((item) => item.engagements)}
          color="#f59e0b"
        />
        <LineChartCard
          title="Conversion Trend"
          subtitle="Attributed conversions by day"
          points={performanceChart.map((item) => item.conversions)}
          color="#f472b6"
        />
      </div>

      <div className="space-y-6">
        <BreakdownList title="Engagement by Event Type" items={byType} />
        <BreakdownList title="Engagement by Channel" items={byChannel} />
      </div>
    </div>
  );
}