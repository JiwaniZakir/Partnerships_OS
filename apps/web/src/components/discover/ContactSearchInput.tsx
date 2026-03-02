'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { User } from 'lucide-react';

interface ContactSearchInputProps {
  label: string;
  value: { id: string; name: string } | null;
  onChange: (contact: { id: string; name: string } | null) => void;
}

export function ContactSearchInput({ label, value, onChange }: ContactSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await fetchApi(`/graph/search?q=${encodeURIComponent(query)}`);
        setResults(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch { setResults([]); }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-[#6B6560] mb-1.5">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[#E5E0D8] bg-white">
          <User className="w-3.5 h-3.5 text-[#A09A90]" />
          <span className="text-sm text-[#1A1A1A] flex-1">{value.name}</span>
          <button onClick={() => { onChange(null); setQuery(''); }} className="text-[#A09A90] hover:text-[#1A1A1A] transition-colors p-0.5">
            &times;
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search contacts..."
          className="h-10 w-full rounded-xl border border-[#E5E0D8] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#A09A90] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#C4BEB4] transition-colors"
        />
      )}
      {open && results.length > 0 && !value && (
        <div className="absolute z-10 mt-1.5 w-full rounded-xl border border-[#E5E0D8] bg-white shadow-lg py-1.5">
          {results.map((r: any) => (
            <button
              key={r.id}
              onClick={() => { onChange({ id: r.id, name: r.fullName }); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#6B6560] hover:bg-[#F1EFE7] hover:text-[#1A1A1A] transition-colors rounded-lg mx-1"
              style={{ width: 'calc(100% - 0.5rem)' }}
            >
              <User className="w-3.5 h-3.5 flex-shrink-0 text-[#A09A90]" />
              <span className="truncate">{r.fullName}</span>
              {r.organization && <span className="text-xs text-[#A09A90] ml-auto truncate">{r.organization}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
