'use client';

import React from 'react';
import { DemoProvider, useDemo } from '@/components/demo/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { DashboardViewEnhanced } from '@/components/demo/DashboardViewEnhanced';
import { LeadsView } from '@/components/demo/LeadsView';
import { AIViewEnhanced } from '@/components/demo/AIViewEnhanced';
import { AutomationView } from '@/components/demo/AutomationView';
import { AnalyticsView } from '@/components/demo/AnalyticsView';
import { UsageView } from '@/components/demo/UsageView';

const DemoContent = () => {
  const { activeTab } = useDemo();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardViewEnhanced />;
    case 'leads':
      return <LeadsView />;
    case 'ai':
      return <AIViewEnhanced />;
    case 'automation':
      return <AutomationView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'usage':
      return <UsageView />;
    default:
      return <DashboardViewEnhanced />;
  }
};

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoLayout>
        <DemoContent />
      </DemoLayout>
    </DemoProvider>
  );
}
