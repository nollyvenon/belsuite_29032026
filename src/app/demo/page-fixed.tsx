'use client';

import React from 'react';
import { DemoProvider, useDemo } from '@/components/demo/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { DashboardViewEnhanced } from '@/components/demo/DashboardViewEnhanced';
import { LeadsViewEnhanced } from '@/components/demo/LeadsViewEnhanced';
import { AIViewEnhanced } from '@/components/demo/AIViewEnhanced';
import { AutomationViewEnhanced } from '@/components/demo/AutomationViewEnhanced';
import { AnalyticsViewEnhanced } from '@/components/demo/AnalyticsViewEnhanced';
import { UsageViewEnhanced } from '@/components/demo/UsageViewEnhanced';

const DemoContent = () => {
  const { activeTab } = useDemo();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardViewEnhanced />;
    case 'leads':
      return <LeadsViewEnhanced />;
    case 'ai':
      return <AIViewEnhanced />;
    case 'automation':
      return <AutomationViewEnhanced />;
    case 'analytics':
      return <AnalyticsViewEnhanced />;
    case 'usage':
      return <UsageViewEnhanced />;
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
