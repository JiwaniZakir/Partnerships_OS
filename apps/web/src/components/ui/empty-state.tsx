import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EFE7] mb-5">
        <Icon className="h-6 w-6 text-[#A09A90]" />
      </div>
      <h3 className="text-base font-medium text-[#1A1A1A] mb-1.5">{title}</h3>
      <p className="text-sm text-[#A09A90] text-center max-w-sm leading-relaxed">{description}</p>
      {action && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
