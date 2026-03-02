import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#A09A90] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/10 focus-visible:border-[#C4BEB4] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
