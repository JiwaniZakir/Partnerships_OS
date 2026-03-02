'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface PathNode {
  id: string;
  name: string;
  title?: string;
  organization?: string;
  type: string;
}

interface WarmIntroPathwayProps {
  path: PathNode[];
}

export function WarmIntroPathway({ path }: WarmIntroPathwayProps) {
  if (!path.length) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {path.map((node, i) => (
        <React.Fragment key={node.id}>
          <div className="flex items-center gap-2.5 bg-white border border-[#E5E0D8] rounded-xl px-4 py-3 shadow-sm">
            <Avatar name={node.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{node.name}</p>
              {node.title && (
                <p className="text-xs text-[#A09A90] truncate">
                  {node.title}{node.organization ? ` at ${node.organization}` : ''}
                </p>
              )}
            </div>
          </div>
          {i < path.length - 1 && (
            <ArrowRight className="w-4 h-4 text-[#C4BEB4] flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
