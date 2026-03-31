'use client';

import React from 'react';
import { DemoProvider, useDemo } from '@/components/demo/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { DashboardView } from '@/components/demo/DashboardView';
import { LeadsView } from '@/components/demo/LeadsView';
import { AIView } from '@/components/demo/AIView';
import { AutomationView } from '@/components/demo/AutomationView';
import { AnalyticsView } from '@/components/demo/AnalyticsView';
import { UsageView } from '@/components/demo/UsageView';

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
