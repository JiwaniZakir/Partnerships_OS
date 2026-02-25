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
    <div className="flex items-center gap-2 flex-wrap">
      {path.map((node, i) => (
        <React.Fragment key={node.id}>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2">
            <Avatar name={node.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F1EFE7] truncate">{node.name}</p>
              {node.title && (
                <p className="text-xs text-[#6B6560] truncate">
                  {node.title}{node.organization ? ` at ${node.organization}` : ''}
                </p>
              )}
            </div>
          </div>
          {i < path.length - 1 && (
            <ArrowRight className="w-4 h-4 text-[#C4B99A] flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
