'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { ContactSearchInput } from '@/components/discover/ContactSearchInput';
import { WarmIntroPathway } from '@/components/discover/WarmIntroPathway';
import { fetchApi } from '@/lib/api';
import { Sparkles, Target, PieChart, Route, Loader2 } from 'lucide-react';

interface DiscoveryContact {
  contact: { id: string; fullName: string; organization: string; title: string };
  score: number;
  reason: string;
}

interface GapAnalysis {
  underrepresented: Array<{ category: string; count: number; suggestion: string }>;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState('event');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveryContact[]>([]);
  const [gaps, setGaps] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Warm Intro state
  const [fromContact, setFromContact] = useState<{ id: string; name: string } | null>(null);
  const [toContact, setToContact] = useState<{ id: string; name: string } | null>(null);
  const [pathResult, setPathResult] = useState<any[] | null>(null);
  const [pathLoading, setPathLoading] = useState(false);

  const handleDiscover = async () => {
    if (!query.trim() || query.length < 20) return;
    setLoading(true);
    setResults([]);
    try {
      const data = await fetchApi<{ contacts: DiscoveryContact[] }>('/graph/discover', {
        method: 'POST',
        body: JSON.stringify({ description: query, maxResults: 10 }),
      });
      setResults(data.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGapAnalysis = async () => {
    setLoading(true);
    setGaps(null);
    try {
      const data = await fetchApi<GapAnalysis>('/graph/gaps');
      setGaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindPath = async () => {
    if (!fromContact || !toContact) return;
    setPathLoading(true);
    setPathResult(null);
    try {
      const data = await fetchApi<{ path: any[] }>(`/graph/path/${fromContact.id}/${toContact.id}`);
      setPathResult(data.path || []);
    } catch (err) {
      console.error(err);
      setPathResult([]);
    } finally {
      setPathLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-[#C4B99A]" />
            <h1 className="font-serif italic text-2xl text-[#F1EFE7]">AI Discovery</h1>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            if (v === 'gaps' && !gaps) handleGapAnalysis();
          }}>
            <TabsList>
              <TabsTrigger value="event"><Target className="w-4 h-4 mr-1.5" />Event Planner</TabsTrigger>
              <TabsTrigger value="gaps"><PieChart className="w-4 h-4 mr-1.5" />Gap Analysis</TabsTrigger>
              <TabsTrigger value="intros"><Route className="w-4 h-4 mr-1.5" />Warm Intros</TabsTrigger>
            </TabsList>

            <TabsContent value="event">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <label className="block text-sm font-medium text-[#A0998A] mb-2">
                    Describe your event, initiative, or what you&apos;re looking for:
                  </label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., We're hosting a fintech demo day in March targeting Series A founders and angel investors..."
                    className="h-32"
                  />
                  {query.length > 0 && query.length < 20 && (
                    <p className="mt-1 text-xs text-amber-400">
                      Please provide at least 20 characters ({20 - query.length} more needed).
                    </p>
                  )}
                  <Button onClick={handleDiscover} disabled={loading || query.length < 20} className="mt-3">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing network...</> : <><Sparkles className="w-4 h-4" />Find Best Contacts</>}
                  </Button>
                </CardContent>
              </Card>

              {results.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-[#F1EFE7]">Top {results.length} Recommendations</h2>
                  {results.map((r, i) => (
                    <Link key={r.contact.id} href={`/contacts/${r.contact.id}`}>
                      <Card className="p-5 hover:border-[#3A3A3A] transition-colors cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#F1EFE7] text-[#0A0A0A] flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-[#F1EFE7]">{r.contact.fullName}</h3>
                              <span className="px-2 py-0.5 bg-[#C4B99A]/15 text-[#C4B99A] text-xs rounded-md font-medium">
                                {(r.score * 100).toFixed(0)}% match
                              </span>
                            </div>
                            <p className="text-sm text-[#A0998A] mb-2">{r.contact.title} at {r.contact.organization}</p>
                            <p className="text-sm text-[#A0998A]">{r.reason}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {!loading && results.length === 0 && query.length >= 20 && (
                <div className="text-center py-16">
                  <Target className="w-10 h-10 text-[#2A2A2A] mx-auto mb-3" />
                  <p className="text-sm text-[#6B6560]">Click &quot;Find Best Contacts&quot; to discover relevant people in your network</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gaps">
              <Card>
                <CardHeader><CardTitle>Network Gap Analysis</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#C4B99A] mr-2" />
                      <span className="text-sm text-[#6B6560]">Analyzing your network...</span>
                    </div>
                  ) : gaps?.underrepresented?.length ? (
                    <div className="space-y-3">
                      {gaps.underrepresented.map((gap) => (
                        <div key={gap.category} className="flex items-center justify-between p-4 bg-[#141414] rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-[#F1EFE7]">{gap.category}</p>
                            <p className="text-xs text-[#6B6560] mt-0.5">{gap.suggestion}</p>
                          </div>
                          <span className="text-sm font-bold text-[#6B6560]">{gap.count} contacts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6560] py-8 text-center">No gap data available yet. Add more contacts to see network insights.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intros">
              <Card>
                <CardHeader><CardTitle>Find Warm Introduction Pathways</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <ContactSearchInput label="From" value={fromContact} onChange={setFromContact} />
                    <ContactSearchInput label="To" value={toContact} onChange={setToContact} />
                  </div>
                  <Button onClick={handleFindPath} disabled={!fromContact || !toContact || pathLoading}>
                    {pathLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Finding path...</> : <><Route className="w-4 h-4" />Find Path</>}
                  </Button>

                  {pathResult !== null && (
                    <div className="mt-6">
                      {pathResult.length > 0 ? (
                        <>
                          <p className="text-sm text-[#A0998A] mb-3">{pathResult.length}-step connection found:</p>
                          <WarmIntroPathway path={pathResult} />
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Route className="w-8 h-8 text-[#2A2A2A] mx-auto mb-2" />
                          <p className="text-sm text-[#6B6560]">No connection path found between these contacts.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
