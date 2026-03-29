'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, MOCK_LEADS, MOCK_STATS, MOCK_ACTIVITY } from '@/src/lib/demo-data';

type Tab = 'dashboard' | 'leads' | 'ai' | 'automation' | 'analytics' | 'usage';

interface DemoContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  stats: typeof MOCK_STATS;
  activity: typeof MOCK_ACTIVITY;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generatedContent: string;
  setGeneratedContent: (val: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // Simulate new leads coming in
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newLead: Lead = {
          id: Math.random().toString(36).substr(2, 9),
          name: ['Alex Rivera', 'Jordan Lee', 'Taylor Smith', 'Casey Jones'][Math.floor(Math.random() * 4)],
          email: 'new.lead@example.com',
          status: 'New',
          score: Math.floor(Math.random() * 40) + 60,
          source: ['TikTok', 'Instagram', 'Google Search', 'Direct'][Math.floor(Math.random() * 4)],
          lastActive: 'Just now',
        };
        setLeads(prev => [newLead, ...prev.slice(0, 7)]);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DemoContext.Provider value={{
      activeTab,
      setActiveTab,
      leads,
      setLeads,
      stats: MOCK_STATS,
      activity: MOCK_ACTIVITY,
      isGenerating,
      setIsGenerating,
      generatedContent,
      setGeneratedContent,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
