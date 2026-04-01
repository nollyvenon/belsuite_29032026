'use client';

import { MarketingAutomationDashboard } from '@/components/marketing-automation/MarketingAutomationDashboard';

export default function MarketingAutomationPage() {
  return (
    <main className="min-h-screen bg-[#10131b] text-zinc-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <MarketingAutomationDashboard />
      </div>
    </main>
  );
}
