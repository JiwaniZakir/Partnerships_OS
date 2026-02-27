import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center text-xs font-mono transition-colors',
  {
    variants: {
      variant: {
        default: 'text-[#888888] before:content-["["] after:content-["]"]',
        sponsor: 'text-[#888888] before:content-["["] after:content-["]"]',
        mentor: 'text-[#888888] before:content-["["] after:content-["]"]',
        speaker: 'text-[#888888] before:content-["["] after:content-["]"]',
        investor: 'text-[#888888] before:content-["["] after:content-["]"]',
        corporate: 'text-[#888888] before:content-["["] after:content-["]"]',
        media: 'text-[#888888] before:content-["["] after:content-["]"]',
        government: 'text-[#888888] before:content-["["] after:content-["]"]',
        alumni: 'text-[#888888] before:content-["["] after:content-["]"]',
        admin: 'text-white before:content-["["] after:content-["]"]',
        success: 'text-[#888888] before:content-["["] after:content-["]"]',
        warning: 'text-[#888888] before:content-["["] after:content-["]"]',
        error: 'text-[#ef4444] before:content-["["] after:content-["]"]',
        muted: 'text-[#444444] before:content-["["] after:content-["]"]',
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
