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

export function warmthToStars(score: number): string {
  const stars = Math.round(score * 5);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function contactTypeColor(type: string): string {
  const colors: Record<string, string> = {
    SPONSOR: 'bg-green-100 text-green-800',
    MENTOR: 'bg-blue-100 text-blue-800',
    SPEAKER: 'bg-purple-100 text-purple-800',
    INVESTOR: 'bg-amber-100 text-amber-800',
    CORPORATE_PARTNER: 'bg-indigo-100 text-indigo-800',
    MEDIA: 'bg-pink-100 text-pink-800',
    GOVERNMENT: 'bg-red-100 text-red-800',
    ALUMNI: 'bg-teal-100 text-teal-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.OTHER;
}
