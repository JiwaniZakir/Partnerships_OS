'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

const TYPE_COLORS: Record<string, string> = {
  SPONSOR: 'bg-green-100 text-green-800',
  MENTOR: 'bg-blue-100 text-blue-800',
  SPEAKER: 'bg-purple-100 text-purple-800',
  INVESTOR: 'bg-amber-100 text-amber-800',
  CORPORATE_PARTNER: 'bg-indigo-100 text-indigo-800',
  MEDIA: 'bg-pink-100 text-pink-800',
  GOVERNMENT: 'bg-red-100 text-red-800',
  ALUMNI: 'bg-teal-100 text-teal-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

function warmthStars(score: number): string {
  const s = Math.round(score * 5);
  return '\u2605'.repeat(s) + '\u2606'.repeat(5 - s);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Contact {
  id: string;
  fullName: string;
  organization: string;
  title: string;
  contactType: string;
  warmthScore: number;
  status: string;
  genres: string[];
  researchDepthScore: number;
  createdAt: string;
  onboardedBy: { name: string };
  _count: { interactions: number };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchContacts = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const data = await fetchApi<{ contacts: Contact[]; pagination: typeof pagination }>(`/contacts?${params}`);
      setContacts(data.contacts || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchContacts(), 300);
    return () => clearTimeout(t);
  }, [fetchContacts]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <span className="text-sm text-gray-500">{pagination.total} total</span>
          </div>
          <div className="mb-4">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name, organization, or title..."
              className="w-full max-w-md px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Onboarded By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Warmth</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Added</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                          {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                          <p className="text-xs text-gray-500">{c.title}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.organization}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[c.contactType] || TYPE_COLORS.OTHER}`}>
                        {c.contactType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.onboardedBy?.name || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-amber-500">{warmthStars(c.warmthScore)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
                {contacts.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {search ? 'No contacts match your search' : 'No contacts yet'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
                <button key={i} onClick={() => fetchContacts(i + 1)}
                  className={`px-3 py-1 text-sm rounded ${pagination.page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
