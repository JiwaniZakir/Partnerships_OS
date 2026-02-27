'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys, api } from '@/lib/queries';

export default function MembersPage() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: api.members.list,
  });

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">

          {/* Header — bos.network style */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white tracking-tight lowercase">
              partnerships os
            </h1>
            <p className="text-[#888888] text-sm mt-1">
              east coast college founders network · {Array.isArray(members) ? members.length : 0} members
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-5 py-6 border-b border-[#1a1a1a]">
                  <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(members) && members.length > 0 ? (
            <div className="divide-y divide-[#1a1a1a]">
              {members.map((m: any) => (
                <Link key={m.id} href={`/members/${m.id}`}>
                  <div className="flex items-start gap-5 py-7 hover:bg-[#080808] transition-colors cursor-pointer px-2 -mx-2 rounded">

                    {/* Circular Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar name={m.name} size="xl" className="rounded-full w-20 h-20 text-base" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">

                      {/* Name + admin badge */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-white lowercase tracking-tight">
                          {m.name.toLowerCase()}
                        </h2>
                        {m.isAdmin && (
                          <span className="text-xs text-[#888888]">[admin]</span>
                        )}
                      </div>

                      {/* Role in brackets */}
                      <p className="text-sm text-[#888888] mt-0.5 lowercase">
                        [{m.role?.toLowerCase() ?? 'member'}]
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#555555]">
                        <span>[{m.contactCount ?? 0} contacts]</span>
                        <span>[{m.interactionCount ?? 0} interactions]</span>
                        <span>
                          joined {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase()}
                        </span>
                      </div>

                      {/* Email */}
                      <p className="text-xs text-[#555555] mt-1.5 font-normal">
                        {m.email}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#444444] text-sm">[no members yet]</p>
              <p className="text-[#333333] text-xs mt-2">members will appear once they sign in.</p>
            </div>
          )}

          {/* Footer — bos.network style */}
          <div className="mt-16 pt-8 border-t border-[#1a1a1a] text-center">
            <p className="text-xs text-[#333333]">made by student founders, for student founders</p>
          </div>

        </main>
      </div>
    </div>
  );
}
