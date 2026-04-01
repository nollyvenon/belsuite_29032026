'use client';

import { useState } from 'react';
import {
  Link2,
  Loader2,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAdConnections } from '@/hooks/useMarketing';
import type { AdAccount } from '@/hooks/useMarketing';

function PlatformLogo({ platform }: { platform: string }) {
  const map: Record<string, { text: string; color: string }> = {
    FACEBOOK: { text: 'f', color: 'bg-blue-600' },
    INSTAGRAM: { text: '■', color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
    GOOGLE: { text: 'G', color: 'bg-red-500' },
    TIKTOK: { text: '◆', color: 'bg-black border border-zinc-700' },
    LINKEDIN: { text: 'in', color: 'bg-blue-700' },
  };
  const m = map[platform] ?? { text: platform[0], color: 'bg-zinc-700' };
  return (
    <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
      {m.text}
    </div>
  );
}

function AccountCard({ account }: { account: AdAccount }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
      <PlatformLogo platform={account.platform} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{account.accountName}</p>
        <p className="text-xs text-zinc-500">
          {account.currencyCode} · ID: {account.accountId}
        </p>
        {account.syncedAt && (
          <p className="text-xs text-zinc-600">
            Synced {new Date(account.syncedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {account.isActive ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-500">
            <AlertCircle className="w-3.5 h-3.5" />
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}

function PlatformSection({
  platform,
  label,
  accounts,
  loadingOAuth,
  onConnect,
  onRefresh,
  loading,
}: {
  platform: string;
  label: string;
  accounts: AdAccount[];
  loadingOAuth: boolean;
  onConnect: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const isConnected = accounts.length > 0;

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlatformLogo platform={platform} />
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-zinc-500">
              {isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Not connected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh accounts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onConnect}
            disabled={loadingOAuth}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isConnected
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {loadingOAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isConnected ? (
              <><Link2 className="w-4 h-4" /> Re-connect</>
            ) : (
              <><ExternalLink className="w-4 h-4" /> Connect</>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="p-3 space-y-2">
          {accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-zinc-600">
          Connect your {label} account to start syncing campaigns.
        </div>
      )}
    </div>
  );
}

export function ConnectionsPanel() {
  const {
    fbAccounts,
    googleAccounts,
    loading,
    getOAuthUrl,
    refreshAccounts,
  } = useAdConnections();

  const [fbOAuthLoading, setFbOAuthLoading] = useState(false);
  const [googleOAuthLoading, setGoogleOAuthLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  async function handleConnect(platform: 'facebook' | 'google') {
    const setLoading = platform === 'facebook' ? setFbOAuthLoading : setGoogleOAuthLoading;
    setLoading(true);
    try {
      const url = await getOAuthUrl(platform);
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh(platform: 'facebook' | 'google') {
    setRefreshing(platform);
    try {
      await refreshAccounts(platform);
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">Ad Platform Connections</h3>
        <p className="text-xs text-zinc-500">
          Connect your advertising accounts to sync campaigns and pull performance data automatically.
        </p>
      </div>

      <div className="space-y-3">
        <PlatformSection
          platform="FACEBOOK"
          label="Facebook Ads"
          accounts={fbAccounts}
          loadingOAuth={fbOAuthLoading}
          onConnect={() => handleConnect('facebook')}
          onRefresh={() => handleRefresh('facebook')}
          loading={loading || refreshing === 'facebook'}
        />

        <PlatformSection
          platform="GOOGLE"
          label="Google Ads"
          accounts={googleAccounts}
          loadingOAuth={googleOAuthLoading}
          onConnect={() => handleConnect('google')}
          onRefresh={() => handleRefresh('google')}
          loading={loading || refreshing === 'google'}
        />
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2 font-medium">Environment Variables Required</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs text-zinc-600">
          {[
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET',
            'GOOGLE_ADS_CLIENT_ID',
            'GOOGLE_ADS_CLIENT_SECRET',
            'GOOGLE_ADS_DEV_TOKEN',
          ].map((v) => (
            <span key={v} className="bg-white/[0.02] px-2 py-1 rounded">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
