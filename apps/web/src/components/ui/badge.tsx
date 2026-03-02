import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#F1EFE7] text-[#6B6560]',
        sponsor: 'bg-[#F1EFE7] text-[#6B6560]',
        mentor: 'bg-[#F1EFE7] text-[#6B6560]',
        speaker: 'bg-[#F1EFE7] text-[#6B6560]',
        investor: 'bg-[#F1EFE7] text-[#6B6560]',
        corporate: 'bg-[#F1EFE7] text-[#6B6560]',
        media: 'bg-[#F1EFE7] text-[#6B6560]',
        government: 'bg-[#F1EFE7] text-[#6B6560]',
        alumni: 'bg-[#F1EFE7] text-[#6B6560]',
        admin: 'bg-[#1A1A1A] text-white',
        success: 'bg-[#2D6A4F]/10 text-[#2D6A4F]',
        warning: 'bg-[#E9C46A]/20 text-[#8B6914]',
        error: 'bg-[#C1121F]/10 text-[#C1121F]',
        muted: 'bg-[#F1EFE7] text-[#A09A90]',
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
