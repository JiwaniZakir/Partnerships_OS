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
    <div className="absolute top-14 left-4 z-20 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] shadow-xl p-4 w-56">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F1EFE7]">Node Types</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#2A2A2A] rounded transition-colors">
          <X className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      </div>
      <div className="space-y-2">
        {NODE_TYPES.map((type) => (
          <label key={type.value} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.value)}
              onChange={() => onToggleType(type.value)}
              className="w-4 h-4 rounded border-[#2A2A2A] bg-[#141414] accent-[#F1EFE7]"
            />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
            <span className="text-sm text-[#A0998A]">{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
