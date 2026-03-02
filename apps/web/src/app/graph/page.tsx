'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NetworkGraph } from '@/components/graph/NetworkGraph';
import { GraphFilters } from '@/components/graph/GraphFilters';
import { GraphSearch } from '@/components/graph/GraphSearch';
import { NodeDetailPanel } from '@/components/graph/NodeDetailPanel';
import { Filter } from 'lucide-react';

export default function GraphPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['member', 'contact', 'organization']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="flex h-screen bg-[#F1EFE7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 relative">
          <NetworkGraph
            filterTypes={selectedTypes}
            searchHighlight={searchQuery || null}
            onNodeClick={(node) => setSelectedNode(node)}
          />

          <GraphSearch value={searchQuery} onChange={setSearchQuery} />

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E5E0D8] px-3.5 py-2 text-sm font-medium text-[#6B6560] hover:text-[#1A1A1A] hover:border-[#C4BEB4] transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {showFilters && (
            <GraphFilters
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              onClose={() => setShowFilters(false)}
            />
          )}

          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
