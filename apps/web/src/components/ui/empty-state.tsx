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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1A1A] mb-4">
        <Icon className="h-6 w-6 text-[#6B6560]" />
      </div>
      <h3 className="text-base font-medium text-[#F1EFE7] mb-1">{title}</h3>
      <p className="text-sm text-[#6B6560] text-center max-w-sm">{description}</p>
      {action && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
