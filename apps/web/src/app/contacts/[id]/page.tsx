'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogInteractionModal } from '@/components/contacts/LogInteractionModal';
import { MiniGraph } from '@/components/contacts/MiniGraph';
import { queryKeys, api } from '@/lib/queries';
import { warmthToStars, formatDate, contactTypeColor } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Globe,
  Linkedin,
  Twitter,
  MessageSquarePlus,
} from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: queryKeys.contacts.detail(params.id as string),
    queryFn: () => api.contacts.get(params.id as string),
    enabled: !!params.id,
  });

  const researchMutation = useMutation({
    mutationFn: () => api.contacts.triggerResearch(params.id as string),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-32 mb-6" />
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-2 h-48" />
              <Skeleton className="h-48" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-screen bg-[#0A0A0A]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#6B6560] mb-4">Contact not found</p>
            <Button variant="link" onClick={() => router.push('/contacts')}>Back to contacts</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => router.push('/contacts')}
            className="inline-flex items-center gap-1.5 text-sm text-[#6B6560] hover:text-[#F1EFE7] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to contacts
          </button>

          {/* Hero */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <Avatar name={contact.fullName} size="xl" />
              <div className="flex-1 min-w-0">
                <h1 className="font-serif italic text-2xl text-[#F1EFE7]">{contact.fullName}</h1>
                <p className="text-[#A0998A] mt-1">{contact.title} at {contact.organization}</p>
                <div className="flex flex-wrap items-center gap-2.5 mt-3">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-md ${contactTypeColor(contact.contactType)}`}>
                    {contact.contactType?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[#C4B99A] text-sm">{warmthToStars(contact.warmthScore)}</span>
                  {contact.linkedinUrl && (
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#A0998A] text-xs hover:text-[#F1EFE7] transition-colors">
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  )}
                  {contact.twitterUrl && (
                    <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#A0998A] text-xs hover:text-[#F1EFE7] transition-colors">
                      <Twitter className="w-3.5 h-3.5" /> Twitter
                    </a>
                  )}
                  {contact.personalWebsite && (
                    <a href={contact.personalWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#A0998A] text-xs hover:text-[#F1EFE7] transition-colors">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <Button variant="secondary" size="sm" onClick={() => setShowLogModal(true)} className="flex-1 sm:flex-none">
                  <MessageSquarePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Interaction</span>
                  <span className="sm:hidden">Log</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => researchMutation.mutate()} disabled={researchMutation.isPending} className="flex-1 sm:flex-none">
                  {researchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="hidden sm:inline">{researchMutation.isPending ? 'Researching...' : 'Update Research'}</span>
                  <span className="sm:hidden">{researchMutation.isPending ? '...' : 'Research'}</span>
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Research */}
              <Card>
                <CardHeader><CardTitle>AI Research Profile</CardTitle></CardHeader>
                <CardContent>
                  {contact.researchSummary ? (
                    <p className="text-[#A0998A] text-sm leading-relaxed whitespace-pre-wrap">{contact.researchSummary}</p>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-400">
                      Research pending. Click &quot;Update Research&quot; to trigger the AI research pipeline.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievements */}
              {contact.keyAchievements?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Key Achievements</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {contact.keyAchievements.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#A0998A]">
                          <span className="text-[#C4B99A] mt-0.5 flex-shrink-0">&bull;</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Interactions */}
              <Card>
                <CardHeader><CardTitle>Interaction History</CardTitle></CardHeader>
                <CardContent>
                  {contact.interactions?.length > 0 ? (
                    <div className="space-y-4">
                      {contact.interactions.map((inter: any) => (
                        <div key={inter.id} className="border-l-2 border-[#2A2A2A] pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[#C4B99A] bg-[#C4B99A]/10 px-2 py-0.5 rounded">{inter.type}</span>
                            <span className="text-xs text-[#6B6560]">{formatDate(inter.date)} &mdash; {inter.member?.name}</span>
                          </div>
                          <p className="text-sm text-[#A0998A]">{inter.summary}</p>
                          {inter.keyTakeaways?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-[#6B6560] mb-1">Key Takeaways:</p>
                              <ul className="text-xs text-[#A0998A] space-y-0.5">
                                {inter.keyTakeaways.map((t: string, i: number) => <li key={i}>- {t}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6560]">No interactions logged yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <p className="text-[10px] font-semibold text-[#6B6560] uppercase tracking-wider">Quick Info</p>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    {contact.email && <InfoRow label="Email" value={contact.email} />}
                    {contact.phone && <InfoRow label="Phone" value={contact.phone} />}
                    <InfoRow label="Industry" value={contact.industry || 'N/A'} />
                    <InfoRow label="Status" value={contact.status?.toLowerCase()} />
                    <InfoRow label="Added" value={formatDate(contact.createdAt)} />
                    {contact.genres?.length > 0 && (
                      <div>
                        <dt className="text-[#6B6560] mb-1.5">Genres</dt>
                        <dd className="flex flex-wrap gap-1">
                          {contact.genres.map((g: string) => (
                            <Badge key={g} variant="muted">{g}</Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Mini Graph */}
              <Card>
                <CardHeader>
                  <p className="text-[10px] font-semibold text-[#6B6560] uppercase tracking-wider">Network Context</p>
                </CardHeader>
                <CardContent>
                  <MiniGraph contactId={params.id as string} />
                </CardContent>
              </Card>

              {/* Onboarded By */}
              <Card>
                <CardHeader>
                  <p className="text-[10px] font-semibold text-[#6B6560] uppercase tracking-wider">Onboarded By</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-[#F1EFE7]">{contact.onboardedBy?.name}</p>
                  <p className="text-xs text-[#6B6560]">{contact.onboardedBy?.role}</p>
                </CardContent>
              </Card>

              {/* Why They Matter */}
              {contact.potentialValue && (
                <Card>
                  <CardHeader>
                    <p className="text-[10px] font-semibold text-[#6B6560] uppercase tracking-wider">Why They Matter</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#A0998A] leading-relaxed">{contact.potentialValue}</p>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Intros */}
              {contact.suggestedIntroductions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <p className="text-[10px] font-semibold text-[#6B6560] uppercase tracking-wider">Suggested Introductions</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {contact.suggestedIntroductions.map((intro: string, i: number) => (
                        <li key={i} className="text-sm text-[#A0998A]">{intro}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      <LogInteractionModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        contactId={params.id as string}
        contactName={contact.fullName}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[#6B6560]">{label}</dt>
      <dd className="font-medium text-[#F1EFE7] text-right truncate ml-2 capitalize">{value}</dd>
    </div>
  );
}
