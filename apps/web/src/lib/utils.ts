import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function warmthToStars(score: number): string {
  const stars = Math.round(score * 5);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function contactTypeColor(type: string): string {
  const colors: Record<string, string> = {
    SPONSOR: 'bg-emerald-500/15 text-emerald-400',
    MENTOR: 'bg-blue-500/15 text-blue-400',
    SPEAKER: 'bg-purple-500/15 text-purple-400',
    INVESTOR: 'bg-amber-500/15 text-amber-400',
    CORPORATE_PARTNER: 'bg-[#C4B99A]/15 text-[#C4B99A]',
    MEDIA: 'bg-pink-500/15 text-pink-400',
    GOVERNMENT: 'bg-red-500/15 text-red-400',
    ALUMNI: 'bg-teal-500/15 text-teal-400',
    OTHER: 'bg-[#2A2A2A] text-[#6B6560]',
  };
  return colors[type] || colors.OTHER;
}

export function contactTypeBadgeVariant(type: string): string {
  const map: Record<string, string> = {
    SPONSOR: 'sponsor',
    MENTOR: 'mentor',
    SPEAKER: 'speaker',
    INVESTOR: 'investor',
    CORPORATE_PARTNER: 'corporate',
    MEDIA: 'media',
    GOVERNMENT: 'government',
    ALUMNI: 'alumni',
  };
  return map[type] || 'muted';
}
