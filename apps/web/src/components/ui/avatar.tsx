import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[#222222] text-[#F1EFE7] font-medium',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}

export { Avatar };
