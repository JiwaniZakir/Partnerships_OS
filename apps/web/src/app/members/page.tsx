'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

interface Member {
  id: string; name: string; email: string; role: string;
  isAdmin: boolean; avatarUrl: string | null;
  contactCount: number; interactionCount: number; joinedAt: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchApi<Member[]>('/members')
      .then(setMembers)
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Members</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-semibold text-indigo-700">
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.name}</h3>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                  {m.isAdmin && <span className="ml-auto px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">Admin</span>}
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg py-3">
                    <p className="text-2xl font-bold text-gray-900">{m.contactCount}</p>
                    <p className="text-xs text-gray-500">Contacts</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-3">
                    <p className="text-2xl font-bold text-gray-900">{m.interactionCount}</p>
                    <p className="text-xs text-gray-500">Interactions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
