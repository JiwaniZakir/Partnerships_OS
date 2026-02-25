import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-[#F1EFE7] placeholder:text-[#6B6560] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1EFE7]/30 focus-visible:border-[#F1EFE7]/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
