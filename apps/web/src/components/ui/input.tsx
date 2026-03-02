import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#A09A90] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/10 focus-visible:border-[#C4BEB4] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
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
