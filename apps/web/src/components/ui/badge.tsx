import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#F1EFE7]/10 text-[#F1EFE7]',
        sponsor: 'bg-emerald-500/15 text-emerald-400',
        mentor: 'bg-blue-500/15 text-blue-400',
        speaker: 'bg-purple-500/15 text-purple-400',
        investor: 'bg-amber-500/15 text-amber-400',
        corporate: 'bg-[#C4B99A]/15 text-[#C4B99A]',
        media: 'bg-pink-500/15 text-pink-400',
        government: 'bg-red-500/15 text-red-400',
        alumni: 'bg-teal-500/15 text-teal-400',
        admin: 'bg-[#F1EFE7]/10 text-[#F1EFE7] border border-[#F1EFE7]/20',
        success: 'bg-emerald-500/15 text-emerald-400',
        warning: 'bg-amber-500/15 text-amber-400',
        error: 'bg-red-500/15 text-red-400',
        muted: 'bg-[#2A2A2A] text-[#6B6560]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
