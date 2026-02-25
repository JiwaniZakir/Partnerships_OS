'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { queryKeys, api } from '@/lib/queries';
import { UserCircle, Mail, Calendar } from 'lucide-react';

export default function MembersPage() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: api.members.list,
  });

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif italic text-2xl text-[#F1EFE7]">Members</h1>
            <span className="text-sm text-[#6B6560]">
              {Array.isArray(members) ? members.length : 0} team member{Array.isArray(members) && members.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : Array.isArray(members) && members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m: any) => (
                <Link key={m.id} href={`/members/${m.id}`}>
                  <Card className="p-6 hover:border-[#3A3A3A] transition-colors cursor-pointer h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar name={m.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#F1EFE7] truncate">{m.name}</h3>
                        <p className="text-xs text-[#6B6560]">{m.role}</p>
                      </div>
                      {m.isAdmin && <Badge variant="admin">Admin</Badge>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#141414] rounded-lg py-3 text-center">
                        <p className="text-2xl font-bold text-[#F1EFE7]">{m.contactCount}</p>
                        <p className="text-xs text-[#6B6560]">Contacts</p>
                      </div>
                      <div className="bg-[#141414] rounded-lg py-3 text-center">
                        <p className="text-2xl font-bold text-[#F1EFE7]">{m.interactionCount}</p>
                        <p className="text-xs text-[#6B6560]">Interactions</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#6B6560]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={UserCircle} title="No members yet" description="Members will appear once they sign in." />
          )}
        </main>
      </div>
    </div>
  );
}
