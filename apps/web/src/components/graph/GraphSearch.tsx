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
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A]/95 backdrop-blur text-sm text-[#F1EFE7] placeholder:text-[#6B6560] focus:outline-none focus:ring-2 focus:ring-[#F1EFE7]/20"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#2A2A2A] rounded"
          >
            <X className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
        )}
      </div>
    </div>
  );
}
