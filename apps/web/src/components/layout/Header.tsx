'use client';

import React from 'react';

export function Header() {
  return (
    <header className="h-14 border-b border-[var(--border)] bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100">
          <span>Search...</span>
          <kbd className="text-xs bg-white px-1.5 py-0.5 rounded border">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-indigo-700">FP</span>
        </div>
      </div>
    </header>
  );
}
