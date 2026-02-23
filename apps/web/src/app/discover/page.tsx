'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

interface DiscoveryContact {
  contact: { id: string; fullName: string; organization: string; title: string };
  score: number;
  reason: string;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveryContact[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDiscover = async () => {
    if (!query.trim() || query.length < 20) return;
    setLoading(true);
    try {
      const data = await fetchApi<{ contacts: DiscoveryContact[] }>('/graph/discover', {
        method: 'POST',
        body: JSON.stringify({ description: query, maxResults: 10 }),
      });
      setResults(data.contacts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Discovery</h1>
          <div className="bg-white rounded-xl border p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe your event, initiative, or what you&apos;re looking for:</label>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., We're hosting a fintech demo day in March targeting Series A founders and angel investors..."
              className="w-full h-32 px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            {query.length > 0 && query.length < 20 && (
              <p className="mt-1 text-xs text-amber-600">
                Please provide at least 20 characters for a meaningful discovery query ({20 - query.length} more needed).
              </p>
            )}
            <button onClick={handleDiscover} disabled={loading || query.length < 20}
              className="mt-3 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Analyzing...' : 'Find Best Contacts'}
            </button>
          </div>
          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Top {results.length} Recommendations</h2>
              {results.map((r, i) => (
                <div key={r.contact.id} className="bg-white rounded-xl border p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{r.contact.fullName}</h3>
                      <span className="text-xs text-gray-500">Score: {(r.score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{r.contact.title} at {r.contact.organization}</p>
                    <p className="text-sm text-gray-700">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
