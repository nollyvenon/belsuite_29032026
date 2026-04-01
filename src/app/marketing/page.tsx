'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  LayoutDashboard,
  Target,
  Sparkles,
  FlaskConical,
  Zap,
  Layers,
  Link2,
  Loader2,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';
import { MarketingDashboard } from '@/components/marketing/MarketingDashboard';
import { CampaignsView } from '@/components/marketing/CampaignsView';
import { AdGeneratorPanel } from '@/components/marketing/AdGeneratorPanel';
import { ABTestView } from '@/components/marketing/ABTestView';
import { BudgetOptimizerPanel } from '@/components/marketing/BudgetOptimizerPanel';
import { FunnelsView } from '@/components/marketing/FunnelsView';
import { ConnectionsPanel } from '@/components/marketing/ConnectionsPanel';
import { CampaignROIView } from '@/components/marketing/CampaignROIView';
import { CampaignApprovalPanel } from '@/components/marketing/CampaignApprovalPanel';
import { useMarketingDashboard, useCampaigns } from '@/hooks/useMarketing';

type Tab =
  | 'dashboard'
  | 'campaigns'
  | 'ai-generator'
  | 'ab-tests'
  | 'budget'
  | 'funnels'
  | 'connections'
  | 'roi'
  | 'approvals';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campaigns', Icon: Target },
  { id: 'ai-generator', label: 'AI Generator', Icon: Sparkles },
  { id: 'ab-tests', label: 'A/B Tests', Icon: FlaskConical },
  { id: 'budget', label: 'Budget AI', Icon: Zap },
  { id: 'funnels', label: 'Funnels', Icon: Layers },
  { id: 'connections', label: 'Connections', Icon: Link2 },
  { id: 'roi', label: 'ROI', Icon: TrendingUp },
  { id: 'approvals', label: 'Approvals', Icon: ClipboardCheck },
];

function CampaignSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { campaigns } = useCampaigns();
  const [open, setOpen] = useState(false);
  const selected = campaigns.find((c) => c.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Target className="w-4 h-4 text-zinc-400" />
        <span className="max-w-[180px] truncate">
          {selected ? selected.name : 'Select campaign'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-1 right-0 z-20 bg-[#111] border border-white/10 rounded-xl p-1 min-w-[220px] shadow-2xl"
          >
            {campaigns.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-500">No campaigns yet</div>
            ) : (
              campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                    c.id === selectedId ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span
                    className={`text-xs shrink-0 ${
                      c.status === 'ACTIVE' ? 'text-emerald-400' : 'text-zinc-600'
                    }`}
                  >
                    {c.status}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const { overview, loading: dashLoading, error: dashError } = useMarketingDashboard(30);

  const needsCampaign = tab === 'ab-tests' || tab === 'budget' || tab === 'roi' || tab === 'approvals';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Marketing Engine</h1>
              <p className="text-xs text-zinc-500">AI-powered ads, A/B tests &amp; funnels</p>
            </div>
          </div>

          {needsCampaign && (
            <CampaignSelector
              selectedId={selectedCampaignId}
              onSelect={setSelectedCampaignId}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? 'border-primary text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'dashboard' && (
              dashLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                </div>
              ) : dashError ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-8 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  {dashError}
                </div>
              ) : overview ? (
                <MarketingDashboard overview={overview} />
              ) : null
            )}

            {tab === 'campaigns' && <CampaignsView />}

            {tab === 'ai-generator' && <AdGeneratorPanel />}

            {tab === 'ab-tests' && (
              selectedCampaignId ? (
                <ABTestView campaignId={selectedCampaignId} />
              ) : (
                <NoCampaignSelected label="A/B Tests" />
              )
            )}

            {tab === 'budget' && (
              selectedCampaignId ? (
                <BudgetOptimizerPanel campaignId={selectedCampaignId} />
              ) : (
                <NoCampaignSelected label="Budget AI" />
              )
            )}

            {tab === 'funnels' && <FunnelsView />}

            {tab === 'connections' && <ConnectionsPanel />}

            {tab === 'roi' && (
              selectedCampaignId ? (
                <CampaignROIView campaignId={selectedCampaignId} />
              ) : (
                <NoCampaignSelected label="ROI" />
              )
            )}

            {tab === 'approvals' && (
              selectedCampaignId ? (
                <CampaignApprovalPanel campaignId={selectedCampaignId} />
              ) : (
                <NoCampaignSelected label="Approvals" />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function NoCampaignSelected({ label }: { label: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
      <Target className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-400 mb-1">Select a campaign to use {label}</p>
      <p className="text-xs text-zinc-600">Use the campaign selector in the top-right corner.</p>
    </div>
  );
}
