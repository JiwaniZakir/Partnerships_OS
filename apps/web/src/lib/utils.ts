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
    SPONSOR: 'bg-[#2D6A4F]/10 text-[#2D6A4F]',
    MENTOR: 'bg-[#3A5A8C]/10 text-[#3A5A8C]',
    SPEAKER: 'bg-[#6B4C8A]/10 text-[#6B4C8A]',
    INVESTOR: 'bg-[#8B6914]/10 text-[#8B6914]',
    CORPORATE_PARTNER: 'bg-[#6B6560]/10 text-[#6B6560]',
    MEDIA: 'bg-[#8C4966]/10 text-[#8C4966]',
    GOVERNMENT: 'bg-[#8C3A3A]/10 text-[#8C3A3A]',
    ALUMNI: 'bg-[#3A7A6B]/10 text-[#3A7A6B]',
    OTHER: 'bg-[#F1EFE7] text-[#6B6560]',
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
