'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { queryKeys, api } from '@/lib/queries';
import { warmthToStars, formatDate, contactTypeColor, contactTypeBadgeVariant } from '@/lib/utils';
import { exportToCsv } from '@/lib/export';
import { useDebounce } from '@/hooks/use-debounce';
import { Users, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.contacts.list({ page, search: debouncedSearch, type: typeFilter }),
    queryFn: () => api.contacts.list({ page, limit: 20, search: debouncedSearch, type: typeFilter || undefined }),
  });

  const contacts = data?.contacts || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 0 };

  const handleExport = useCallback(() => {
    if (!contacts.length) return;
    const rows = contacts.map((c: any) => ({
      Name: c.fullName,
      Title: c.title,
      Organization: c.organization,
      Type: c.contactType,
      Email: c.email || '',
      Phone: c.phone || '',
      Warmth: c.warmthScore,
      Status: c.status,
      'Onboarded By': c.onboardedBy?.name || '',
      Added: c.createdAt,
    }));
    exportToCsv(rows, `foundry-contacts-${new Date().toISOString().split('T')[0]}`);
  }, [contacts]);

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif italic text-2xl text-[#F1EFE7]">Contacts</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6B6560]">{pagination.total} total</span>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search contacts by name, organization, or title..."
              className="max-w-md"
            />
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="SPONSOR">Sponsor</option>
              <option value="MENTOR">Mentor</option>
              <option value="SPEAKER">Speaker</option>
              <option value="INVESTOR">Investor</option>
              <option value="CORPORATE_PARTNER">Corporate Partner</option>
              <option value="MEDIA">Media</option>
              <option value="GOVERNMENT">Government</option>
              <option value="ALUMNI">Alumni</option>
            </Select>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">Organization</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider hidden lg:table-cell">Onboarded By</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider hidden md:table-cell">Warmth</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6B6560] uppercase tracking-wider hidden md:table-cell">Added</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#2A2A2A]">
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-20" /></div></div></td>
                      <td className="px-4 py-4"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-3.5 w-16" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-3.5 w-16" /></td>
                    </tr>
                  ))
                ) : contacts.map((c: any) => (
                  <tr key={c.id} className="border-b border-[#2A2A2A] last:border-0 hover:bg-[#141414] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
                        <Avatar name={c.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[#F1EFE7] group-hover:text-[#C4B99A] transition-colors">{c.fullName}</p>
                          <p className="text-xs text-[#6B6560]">{c.title}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A0998A]">{c.organization}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${contactTypeColor(c.contactType)}`}>
                        {c.contactType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A0998A] hidden lg:table-cell">{c.onboardedBy?.name || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-[#C4B99A] hidden md:table-cell">{warmthToStars(c.warmthScore)}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6560] hidden md:table-cell">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
                {!isLoading && contacts.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={Users}
                        title={search ? 'No matches found' : 'No contacts yet'}
                        description={search ? 'Try adjusting your search terms' : 'Add contacts to get started'}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-[#6B6560]">Page {pagination.page} of {pagination.totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-[#2A2A2A] hover:bg-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#A0998A]" />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        page === p ? 'bg-[#F1EFE7] text-[#0A0A0A]' : 'hover:bg-[#1A1A1A] text-[#A0998A]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg border border-[#2A2A2A] hover:bg-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[#A0998A]" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
