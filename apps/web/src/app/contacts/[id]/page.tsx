'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

const TYPE_COLORS: Record<string, string> = {
  SPONSOR: 'bg-green-100 text-green-800', INVESTOR: 'bg-amber-100 text-amber-800',
  SPEAKER: 'bg-purple-100 text-purple-800', MENTOR: 'bg-blue-100 text-blue-800',
  CORPORATE_PARTNER: 'bg-indigo-100 text-indigo-800', OTHER: 'bg-gray-100 text-gray-800',
};

function warmthStars(s: number) { const n = Math.round(s * 5); return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function ContactDetailPage() {
  const params = useParams();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/contacts/${params.id}`)
      .then(setContact)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div></div>;
  if (!contact) return <div className="flex h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center text-gray-500">Contact not found</div></div>;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {/* Hero */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                {contact.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{contact.fullName}</h1>
                <p className="text-gray-600 mt-1">{contact.title} at {contact.organization}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[contact.contactType] || TYPE_COLORS.OTHER}`}>
                    {contact.contactType?.replace('_', ' ')}
                  </span>
                  <span className="text-amber-500 text-sm">{warmthStars(contact.warmthScore)}</span>
                  {contact.linkedinUrl && <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">LinkedIn</a>}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Research */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">AI Research Profile</h2>
                {contact.researchSummary
                  ? <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{contact.researchSummary}</p>
                  : <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">Research pending</div>}
              </div>
              {/* Achievements */}
              {contact.keyAchievements?.length > 0 && (
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold mb-4">Key Achievements</h2>
                  <ul className="space-y-2">{contact.keyAchievements.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-indigo-500 mt-0.5">&bull;</span>{a}</li>
                  ))}</ul>
                </div>
              )}
              {/* Interactions */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Interaction History</h2>
                {contact.interactions?.length > 0 ? (
                  <div className="space-y-4">{contact.interactions.map((inter: any) => (
                    <div key={inter.id} className="border-l-2 border-indigo-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{inter.type}</span>
                        <span className="text-xs text-gray-500">{fmtDate(inter.date)} &mdash; {inter.member?.name}</span>
                      </div>
                      <p className="text-sm text-gray-700">{inter.summary}</p>
                    </div>
                  ))}</div>
                ) : <p className="text-sm text-gray-500">No interactions logged yet.</p>}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quick Info</h2>
                <dl className="space-y-3 text-sm">
                  {contact.email && <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{contact.email}</dd></div>}
                  {contact.phone && <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{contact.phone}</dd></div>}
                  <div className="flex justify-between"><dt className="text-gray-500">Industry</dt><dd className="font-medium">{contact.industry || 'N/A'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium">{contact.status}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Added</dt><dd className="font-medium">{fmtDate(contact.createdAt)}</dd></div>
                </dl>
              </div>
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Onboarded By</h2>
                <p className="text-sm font-medium">{contact.onboardedBy?.name}</p>
                <p className="text-xs text-gray-500">{contact.onboardedBy?.role}</p>
              </div>
              {contact.potentialValue && (
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Why They Matter</h2>
                  <p className="text-sm text-gray-700">{contact.potentialValue}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
