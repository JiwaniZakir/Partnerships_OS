'use client';

import React from 'react';
import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';
import { warmthToStars } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NodeDetailPanelProps {
  node: {
    id: string;
    label: string;
    type: string;
    properties: Record<string, any>;
  };
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const p = node.properties;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-[#E5E0D8] z-30 overflow-y-auto shadow-lg">
      <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-sm border-b border-[#E5E0D8]">
        <h3 className="text-sm font-medium text-[#1A1A1A] truncate">{node.label}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[#F1EFE7] rounded-lg transition-colors">
          <X className="w-4 h-4 text-[#6B6560]" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E5E0D8] flex items-center justify-center text-sm font-medium text-[#1A1A1A]">
            {node.label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{node.label}</p>
            <p className="text-xs text-[#6B6560] capitalize">{node.type}</p>
          </div>
        </div>

        {p.title && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] mb-1">Title</p>
            <p className="text-sm text-[#1A1A1A]">{p.title}</p>
          </div>
        )}

        {p.organization && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] mb-1">Organization</p>
            <p className="text-sm text-[#1A1A1A]">{p.organization}</p>
          </div>
        )}

        {p.contactType && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] mb-1">Type</p>
            <Badge>{p.contactType.replace(/_/g, ' ')}</Badge>
          </div>
        )}

        {p.warmthScore != null && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] mb-1">Warmth</p>
            <p className="text-sm text-[#1A1A1A]">{warmthToStars(p.warmthScore)}</p>
          </div>
        )}

        {p.researchSummary && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] mb-1">Research Preview</p>
            <p className="text-xs text-[#6B6560] leading-relaxed line-clamp-4">{p.researchSummary}</p>
          </div>
        )}

        {node.type === 'contact' && (
          <Link href={`/contacts/${node.id}`}>
            <Button variant="secondary" size="sm" className="w-full mt-2">
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
