'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({ open, onOpenChange, children }: DropdownMenuProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange]);

  return <div ref={ref} className="relative">{children}</div>;
}

function DropdownMenuTrigger({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>;
}

function DropdownMenuContent({
  className,
  align = 'end',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-1 shadow-xl',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#A0998A] hover:bg-[#2A2A2A] hover:text-[#F1EFE7] transition-colors',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-[#2A2A2A]', className)} />;
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-2 py-1.5 text-xs font-medium text-[#6B6560]', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
