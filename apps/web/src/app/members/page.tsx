'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys, api } from '@/lib/queries';
import { Users } from 'lucide-react';

export default function MembersPage() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: api.members.list,
  });

  return (
    <div className="flex h-screen bg-[#F1EFE7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-serif italic text-2xl text-[#1A1A1A]">
              Members
            </h1>
            <p className="text-[#6B6560] text-sm mt-1">
              East coast college founders network · {Array.isArray(members) ? members.length : 0} members
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-5 p-5 bg-white rounded-xl border border-[#E5E0D8]">
                  <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3.5 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(members) && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((m: any) => (
                <Link key={m.id} href={`/members/${m.id}`}>
                  <div className="flex items-start gap-5 p-5 bg-white rounded-xl border border-[#E5E0D8] hover:border-[#C4BEB4] hover:shadow-sm transition-all cursor-pointer">

                    {/* Circular Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar name={m.name} size="xl" className="rounded-full w-16 h-16 text-base" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">

                      {/* Name + admin badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-[#1A1A1A] tracking-tight">
                          {m.name}
                        </h2>
                        {m.isAdmin && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[#A09A90] bg-[#F1EFE7] px-1.5 py-0.5 rounded">admin</span>
                        )}
                      </div>

                      {/* Role */}
                      <p className="text-sm text-[#6B6560] mt-0.5">
                        {m.role ?? 'Member'}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-[#A09A90]">
                        <span>{m.contactCount ?? 0} contacts</span>
                        <span className="w-px h-3 bg-[#E5E0D8]" />
                        <span>{m.interactionCount ?? 0} interactions</span>
                        <span className="w-px h-3 bg-[#E5E0D8]" />
                        <span>
                          Joined {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Email */}
                      <p className="text-xs text-[#A09A90] mt-1.5">
                        {m.email}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#E5E0D8] mx-auto mb-4">
                <Users className="w-6 h-6 text-[#A09A90]" />
              </div>
              <p className="text-[#1A1A1A] text-sm font-medium mb-1">No members yet</p>
              <p className="text-[#A09A90] text-sm">Members will appear once they sign in.</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-[#E5E0D8] text-center">
            <p className="text-xs text-[#C4BEB4]">Made by student founders, for student founders</p>
          </div>

        </main>
      </div>
    </div>
  );
}
