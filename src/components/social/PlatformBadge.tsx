import type { SocialPlatform } from '@/hooks/useSocial';

const CONFIG: Record<SocialPlatform, { label: string; color: string; bg: string }> = {
  INSTAGRAM: { label: 'Instagram', color: 'text-pink-400',    bg: 'bg-pink-400/10 border-pink-400/20' },
  FACEBOOK:  { label: 'Facebook',  color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  TIKTOK:    { label: 'TikTok',    color: 'text-white',       bg: 'bg-zinc-700/50 border-zinc-600/30' },
  TWITTER:   { label: 'X / Twitter', color: 'text-sky-400',  bg: 'bg-sky-400/10 border-sky-400/20' },
  LINKEDIN:  { label: 'LinkedIn',  color: 'text-blue-300',    bg: 'bg-blue-300/10 border-blue-300/20' },
  PINTEREST: { label: 'Pinterest', color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
  WHATSAPP:  { label: 'WhatsApp',  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
};

export const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  INSTAGRAM: '📸',
  FACEBOOK:  '👍',
  TIKTOK:    '🎵',
  TWITTER:   '𝕏',
  LINKEDIN:  '💼',
  PINTEREST: '📌',
  WHATSAPP:  '💬',
};

export function PlatformBadge({ platform, size = 'sm' }: { platform: SocialPlatform; size?: 'xs' | 'sm' }) {
  const cfg = CONFIG[platform];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
    }`}>
      <span>{PLATFORM_ICONS[platform]}</span>
      {size !== 'xs' && cfg.label}
    </span>
  );
}

export function PlatformDot({ platform }: { platform: SocialPlatform }) {
  const colors: Record<SocialPlatform, string> = {
    INSTAGRAM: 'bg-pink-400',
    FACEBOOK:  'bg-blue-400',
    TIKTOK:    'bg-zinc-400',
    TWITTER:   'bg-sky-400',
    LINKEDIN:  'bg-blue-300',
    PINTEREST: 'bg-red-400',
    WHATSAPP:  'bg-emerald-400',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[platform]}`} title={platform} />;
}
