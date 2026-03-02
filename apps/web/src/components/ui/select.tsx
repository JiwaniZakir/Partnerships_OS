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
          <label className="block text-xs font-medium text-[#6B6560] mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-10 w-full appearance-none rounded-xl border border-[#E5E0D8] bg-white px-3 pr-8 text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/10 focus-visible:border-[#C4BEB4] transition-colors',
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
