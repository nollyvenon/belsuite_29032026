'use client';

import React from 'react';
import { DemoProvider, useDemo } from '@/src/components/demo/DemoContext';
import { DemoLayout } from '@/src/components/demo/DemoLayout';
import { DashboardView } from '@/src/components/demo/DashboardView';
import { LeadsView } from '@/src/components/demo/LeadsView';
import { AIView } from '@/src/components/demo/AIView';
import { AutomationView } from '@/src/components/demo/AutomationView';
import { AnalyticsView } from '@/src/components/demo/AnalyticsView';
import { UsageView } from '@/src/components/demo/UsageView';

const DemoContent = () => {
  const { activeTab } = useDemo();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'leads':
      return <LeadsView />;
    case 'ai':
      return <AIView />;
    case 'automation':
      return <AutomationView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'usage':
      return <UsageView />;
    default:
      return <DashboardView />;
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
