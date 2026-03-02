'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface GraphSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function GraphSearch({ value, onChange }: GraphSearchProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search nodes..."
          className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E5E0D8] bg-white/95 backdrop-blur-sm text-sm text-[#1A1A1A] placeholder:text-[#A09A90] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#C4BEB4] shadow-sm transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#F1EFE7] rounded"
          >
            <X className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
        )}
      </div>
    </div>
  );
}
