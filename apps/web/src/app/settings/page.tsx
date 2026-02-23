'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

export default function SettingsPage() {
  const [notionStatus, setNotionStatus] = useState<any>(null);

  useEffect(() => {
    fetchApi('/notion/status')
      .then(setNotionStatus)
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Notion Integration</h2>
            <div className="space-y-3">
              <StatusRow label="API Key" ok={notionStatus?.apiKeySet} />
              <StatusRow label="Master Contacts DB" ok={notionStatus?.masterDbIdSet} />
              <StatusRow label="Interactions DB" ok={notionStatus?.interactionsDbIdSet} />
              <StatusRow label="Organizations DB" ok={notionStatus?.orgsDbIdSet} />
            </div>
            <button onClick={() => { fetchApi('/notion/sync', { method: 'POST' }).catch(console.error); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Force Sync
            </button>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
            <p className="text-sm text-gray-500">API keys are configured via environment variables on the server.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {ok ? 'Configured' : 'Not Set'}
      </span>
    </div>
  );
}
