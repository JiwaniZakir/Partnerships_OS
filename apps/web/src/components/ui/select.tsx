'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-xs font-medium text-[#A0998A] mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 pr-8 text-sm text-[#F1EFE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1EFE7]/30 transition-colors',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
