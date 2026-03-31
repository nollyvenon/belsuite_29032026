import { Clock, CheckCircle2, AlertCircle, Loader2, Edit3, XCircle } from 'lucide-react';
import type { PostStatus } from '@/hooks/useSocial';

const CONFIG: Record<PostStatus, { label: string; color: string; Icon: React.ElementType; spin?: boolean }> = {
  DRAFT:      { label: 'Draft',      color: 'text-zinc-400 bg-zinc-400/10',     Icon: Edit3 },
  SCHEDULED:  { label: 'Scheduled',  color: 'text-amber-400 bg-amber-400/10',   Icon: Clock },
  PUBLISHING: { label: 'Publishing', color: 'text-blue-400 bg-blue-400/10',     Icon: Loader2, spin: true },
  PUBLISHED:  { label: 'Published',  color: 'text-emerald-400 bg-emerald-400/10', Icon: CheckCircle2 },
  FAILED:     { label: 'Failed',     color: 'text-red-400 bg-red-400/10',       Icon: AlertCircle },
  CANCELLED:  { label: 'Cancelled',  color: 'text-zinc-600 bg-zinc-600/10',     Icon: XCircle },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const cfg = CONFIG[status];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}
