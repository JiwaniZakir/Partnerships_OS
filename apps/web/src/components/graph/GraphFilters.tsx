'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Select } from '@/components/ui/select';

const NODE_TYPES = [
  { value: 'member', label: 'Members', color: '#F1EFE7' },
  { value: 'contact', label: 'Contacts', color: '#C4B99A' },
  { value: 'organization', label: 'Organizations', color: '#6B6560' },
];

interface GraphFiltersProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClose: () => void;
}

export function GraphFilters({ selectedTypes, onToggleType, onClose }: GraphFiltersProps) {
  return (
    <div className="absolute top-14 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E5E0D8] shadow-lg p-5 w-56">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#A09A90]">Node Types</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[#F1EFE7] rounded-lg transition-colors">
          <X className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      </div>
      <div className="space-y-2.5">
        {NODE_TYPES.map((type) => (
          <label key={type.value} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.value)}
              onChange={() => onToggleType(type.value)}
              className="w-4 h-4 rounded border-[#E5E0D8] bg-white accent-[#1A1A1A]"
            />
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
            <span className="text-sm text-[#6B6560] group-hover:text-[#1A1A1A] transition-colors">{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
