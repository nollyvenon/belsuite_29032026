'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Calendar, LayoutGrid, Zap, Users, Plus, AlertCircle,
} from 'lucide-react';
import { AccountsPanel } from '@/components/social/AccountsPanel';
import { PostsView } from '@/components/social/PostsView';
import { CalendarView } from '@/components/social/CalendarView';
import { BulkView } from '@/components/social/BulkView';
import { AICreatorPanel } from '@/components/social/AICreatorPanel';
import { RetryView } from '@/components/social/RetryView';
import { CreatePostModal } from '@/components/social/CreatePostModal';
import { useSocialAccounts } from '@/hooks/useSocial';

type Tab = 'posts' | 'calendar' | 'bulk' | 'ai' | 'retry' | 'accounts';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'posts',    label: 'Posts',    Icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'bulk',     label: 'Bulk',     Icon: Zap },
  { id: 'ai',       label: 'AI Creator', Icon: Zap },
  { id: 'retry',    label: 'Failed',   Icon: AlertCircle },
  { id: 'accounts', label: 'Accounts', Icon: Users },
];

export default function SocialPage() {
  const [tab, setTab]           = useState<Tab>('posts');
  const [showCreate, setCreate] = useState(false);
  const { accounts, loading: accountsLoading, refresh: refreshAccounts } = useSocialAccounts();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Social Scheduler</h1>
              <p className="text-xs text-zinc-500">Schedule & publish across all platforms</p>
            </div>
          </div>

          <button
            onClick={() => setCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
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
            {tab === 'posts'    && <PostsView accounts={accounts} />}
            {tab === 'calendar' && <CalendarView />}
            {tab === 'bulk'     && <BulkView accounts={accounts} />}
            {tab === 'ai'       && <AICreatorPanel accounts={accounts} />}
            {tab === 'retry'    && <RetryView />}
            {tab === 'accounts' && (
              <AccountsPanel
                accounts={accounts}
                loading={accountsLoading}
                onRefresh={refreshAccounts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create post modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            accounts={accounts}
            onClose={() => setCreate(false)}
            onCreated={() => { setCreate(false); setTab('posts'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
