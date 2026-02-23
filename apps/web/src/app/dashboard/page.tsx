'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { fetchApi } from '@/lib/api';

interface DashboardStats {
  total: number;
  addedThisMonth: number;
  byType: Array<{ contactType: string; _count: number }>;
  leaderboard: Array<{
    rank: number;
    name: string;
    role: string;
    contactCount: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<DashboardStats>('/admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Contacts"
              value={stats?.total ?? '—'}
              subtitle="In the network"
            />
            <StatCard
              title="Added This Month"
              value={stats?.addedThisMonth ?? '—'}
              subtitle="New contacts"
            />
            <StatCard
              title="Active Partnerships"
              value={stats?.byType?.reduce((sum, t) => sum + t._count, 0) ?? '—'}
              subtitle="Across all types"
            />
            <StatCard
              title="Contact Types"
              value={stats?.byType?.length ?? '—'}
              subtitle="Categories"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <p className="text-gray-500 text-sm">Activity feed will appear as interactions are logged.</p>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Top Onboarders</h2>
              {stats?.leaderboard?.map((m) => (
                <div
                  key={m.rank}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm font-bold text-gray-400 w-6">
                    #{m.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                    {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">
                    {m.contactCount}
                  </span>
                </div>
              )) || <p className="text-gray-500 text-sm">No data yet</p>}
            </div>
          </div>

          {/* Contact Types Chart */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contacts by Type</h2>
            <div className="flex flex-wrap gap-4">
              {stats?.byType?.map((t) => (
                <div
                  key={t.contactType}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium">
                    {t.contactType.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {t._count}
                  </span>
                </div>
              )) || <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
