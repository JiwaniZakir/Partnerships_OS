'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { queryKeys, api } from '@/lib/queries';
import { formatDate, warmthToStars, contactTypeColor } from '@/lib/utils';
import { ArrowLeft, Mail, Calendar, Users, MessageSquare } from 'lucide-react';

const chartTooltipStyle = {
  contentStyle: { backgroundColor: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', color: '#1A1A1A', fontSize: '12px', fontFamily: 'Inter, sans-serif' },
  itemStyle: { color: '#1A1A1A' },
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: () => api.members.get(memberId),
    enabled: !!memberId,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: queryKeys.members.contacts(memberId),
    queryFn: () => api.members.getContacts(memberId),
    enabled: !!memberId,
  });

  const contacts = contactsData?.contacts || contactsData || [];
  const isLoading = memberLoading || contactsLoading;

  // Compute genre breakdown from contacts
  const genreCounts: Record<string, number> = {};
  if (Array.isArray(contacts)) {
    contacts.forEach((c: any) => {
      (c.genres || []).forEach((g: string) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
  }
  const genreData = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#F1EFE7]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-40 mb-6" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen bg-[#F1EFE7]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#6B6560] mb-4">Member not found</p>
            <Button variant="link" onClick={() => router.push('/members')}>Back to members</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F1EFE7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => router.push('/members')}
            className="inline-flex items-center gap-1.5 text-sm text-[#6B6560] hover:text-[#1A1A1A] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to members
          </button>

          {/* Hero */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar name={member.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-serif italic text-2xl text-[#1A1A1A]">{member.name}</h1>
                  {member.isAdmin && <Badge variant="admin">Admin</Badge>}
                </div>
                <p className="text-[#6B6560] mt-1">{member.role}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#6B6560]">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /><span className="truncate max-w-[200px]">{member.email}</span></span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {formatDate(member.joinedAt)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-shrink-0 w-full sm:w-auto">
                <div className="bg-[#F1EFE7] rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-semibold text-[#1A1A1A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{member.contactCount || 0}</p>
                  <p className="text-xs text-[#A09A90] flex items-center justify-center gap-1 mt-1"><Users className="w-3 h-3" />Contacts</p>
                </div>
                <div className="bg-[#F1EFE7] rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-semibold text-[#1A1A1A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{member.interactionCount || 0}</p>
                  <p className="text-xs text-[#A09A90] flex items-center justify-center gap-1 mt-1"><MessageSquare className="w-3 h-3" />Interactions</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Genre Breakdown */}
            <Card>
              <CardHeader><CardTitle>Genre Breakdown</CardTitle></CardHeader>
              <CardContent>
                {genreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={genreData} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#A09A90' }} axisLine={false} tickLine={false} width={80} />
                      <RTooltip {...chartTooltipStyle} />
                      <Bar dataKey="count" fill="#1A1A1A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[#6B6560] py-8 text-center">No genre data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Contacts */}
            <Card>
              <CardHeader><CardTitle>Recent Contacts</CardTitle></CardHeader>
              <CardContent>
                {Array.isArray(contacts) && contacts.length > 0 ? (
                  <div className="space-y-1">
                    {contacts.slice(0, 8).map((c: any) => (
                      <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 py-2 hover:bg-white rounded-lg px-2 transition-colors">
                        <Avatar name={c.fullName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{c.fullName}</p>
                          <p className="text-xs text-[#6B6560] truncate">{c.title} at {c.organization}</p>
                        </div>
                        <span className="text-xs text-[#6B6560]">{warmthToStars(c.warmthScore)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6560] py-8 text-center">No contacts onboarded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Contacts Table */}
          {Array.isArray(contacts) && contacts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>All Onboarded Contacts ({contacts.length})</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E0D8]">
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#A09A90] uppercase tracking-wider">Name</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#A09A90] uppercase tracking-wider">Organization</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#A09A90] uppercase tracking-wider">Type</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#A09A90] uppercase tracking-wider">Warmth</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#A09A90] uppercase tracking-wider">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c: any) => (
                      <tr key={c.id} className="border-b border-[#E5E0D8] last:border-0 hover:bg-[#FAFAF7] transition-colors">
                        <td className="px-3 py-2.5">
                          <Link href={`/contacts/${c.id}`} className="text-sm font-medium text-[#1A1A1A] hover:text-[#6B6560] transition-colors">{c.fullName}</Link>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-[#6B6560]">{c.organization}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${contactTypeColor(c.contactType)}`}>
                            {c.contactType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-[#6B6560]">{warmthToStars(c.warmthScore)}</td>
                        <td className="px-3 py-2.5 text-sm text-[#6B6560]">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
