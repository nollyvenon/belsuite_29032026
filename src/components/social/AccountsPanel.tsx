'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle, ExternalLink, Users,
} from 'lucide-react';
import type { SocialAccount, SocialPlatform } from '@/hooks/useSocial';
import { useSocialAccounts } from '@/hooks/useSocial';
import { passthroughImageLoader } from '@/lib/image-loader';
import { PlatformBadge, PLATFORM_ICONS } from './PlatformBadge';
import { WhatsAppRecipientsModal } from './WhatsAppRecipientsModal';

const ALL_PLATFORMS: SocialPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'PINTEREST', 'WHATSAPP'];

function ConnectModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (platform: SocialPlatform) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm glass rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-1">Connect Account</h2>
        <p className="text-sm text-zinc-400 mb-5">Choose a platform to connect your account.</p>

        <div className="space-y-2">
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => onConnect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20 transition-colors text-left"
            >
              <span className="text-xl">{PLATFORM_ICONS[p]}</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {p === 'TWITTER' ? 'X / Twitter' : p === 'WHATSAPP' ? 'WhatsApp' : p.charAt(0) + p.slice(1).toLowerCase()}
                </p>
                <p className="text-[10px] text-zinc-500">Connect via OAuth</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

function AccountCard({
  account,
  onDisconnect,
  onManageRecipients,
}: {
  account: SocialAccount;
  onDisconnect: () => Promise<void>;
  onManageRecipients?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const isExpired = account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="relative">
        {account.avatar ? (
          <Image
            src={account.avatar!}
            alt={account.displayName ?? ''}
            width={48}
            height={48}
            className="rounded-full object-cover"
            loader={passthroughImageLoader}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
            {PLATFORM_ICONS[account.platform]}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1">
          <span className="text-sm">{PLATFORM_ICONS[account.platform]}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white truncate">{account.displayName || account.platformUsername}</p>
          {account.isActive && !isExpired ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <PlatformBadge platform={account.platform} size="xs" />
          {account.pageName && (
            <span className="text-[10px] text-zinc-500">{account.pageName}</span>
          )}
          {isExpired && (
            <span className="text-[10px] text-red-400">Token expired</span>
          )}
        </div>
        {account._count && (
          <p className="text-[10px] text-zinc-600 mt-1">{account._count.posts} posts</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {account.platform === 'WHATSAPP' && onManageRecipients && (
          <button
            onClick={onManageRecipients}
            className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            title="Manage recipients"
          >
            <Users className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={async () => {
            setDeleting(true);
            try { await onDisconnect(); } finally { setDeleting(false); }
          }}
          disabled={deleting}
          className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

export function AccountsPanel({
  accounts,
  loading,
  onRefresh,
}: {
  accounts: SocialAccount[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showConnect, setShowConnect] = useState(false);
  const [whatsAppAccount, setWhatsAppAccount] = useState<SocialAccount | null>(null);
  const { disconnect, getOAuthUrl } = useSocialAccounts();

  const handleConnect = async (platform: SocialPlatform) => {
    setShowConnect(false);
    const redirectUri = `${window.location.origin}/api/social/oauth/callback/${platform}`;
    const url = await getOAuthUrl(platform, redirectUri);
    window.location.href = url;
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{accounts.length} of {ALL_PLATFORMS.length} platforms connected</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConnect(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Connect Account
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onDisconnect={() => disconnect(a.id)}
                onManageRecipients={a.platform === 'WHATSAPP' ? () => setWhatsAppAccount(a) : undefined}
              />
            ))}
          </AnimatePresence>

          {/* Unconnected platform placeholders */}
          {ALL_PLATFORMS.filter((p) => !connectedPlatforms.has(p)).map((p) => (
            <button
              key={p}
              onClick={() => setShowConnect(true)}
              className="glass rounded-2xl border border-dashed border-white/10 p-5 flex items-center gap-4 hover:border-primary/30 hover:bg-primary/3 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                {PLATFORM_ICONS[p]}
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">
                  {p === 'TWITTER' ? 'X / Twitter' : p.charAt(0) + p.slice(1).toLowerCase()}
                </p>
                <p className="text-xs text-zinc-600">Click to connect</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showConnect && (
          <ConnectModal onClose={() => setShowConnect(false)} onConnect={handleConnect} />
        )}
      </AnimatePresence>

      {whatsAppAccount && (
        <WhatsAppRecipientsModal
          account={whatsAppAccount}
          onClose={() => setWhatsAppAccount(null)}
        />
      )}
    </div>
  );
}
