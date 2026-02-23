'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NetworkGraph } from '@/components/graph/NetworkGraph';

export default function GraphPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 relative">
          <NetworkGraph />
        </main>
      </div>
    </div>
  );
}
