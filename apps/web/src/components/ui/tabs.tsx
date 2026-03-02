'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value: value,
            _onValueChange: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  _value?: string;
  _onValueChange?: (value: string) => void;
}

function TabsList({ className, children, _value, _onValueChange, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-white border border-[#E5E0D8] p-1',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value,
            _onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  _value?: string;
  _onValueChange?: (value: string) => void;
}

function TabsTrigger({
  className,
  value,
  _value,
  _onValueChange,
  children,
  ...props
}: TabsTriggerProps) {
  const isActive = _value === value;
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-[#F1EFE7] text-[#1A1A1A] shadow-sm'
          : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#FAFAF7]',
        className
      )}
      onClick={() => _onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  _value?: string;
}

function TabsContent({ className, value, _value, children, ...props }: TabsContentProps) {
  if (_value !== value) return null;
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
