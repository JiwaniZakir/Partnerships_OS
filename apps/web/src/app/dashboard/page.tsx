'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, UserPlus, Handshake, Layers, TrendingUp } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys, api } from '@/lib/queries';
import { formatRelativeTime } from '@/lib/utils';

const PIE_COLORS = ['#ffffff', '#888888', '#555555', '#333333', '#222222', '#1a1a1a', '#141414', '#0f0f0f'];

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
  },
  itemStyle: { color: '#ffffff' },
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: api.admin.stats,
  });

  const { data: interData, isLoading: interLoading } = useQuery({
    queryKey: queryKeys.interactions.list({ limit: 8 }),
    queryFn: () => api.interactions.list({ limit: 8 }),
  });

  const loading = statsLoading || interLoading;
  const interactions = interData?.interactions || [];

  const pieData = stats?.byType?.map((t: any) => ({
    name: t.contactType.replace(/_/g, ' '),
    value: t._count,
  })) || [];

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight lowercase">dashboard</h1>
            <p className="text-sm text-[#555555] font-mono">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).toLowerCase()}
            </p>
          </div>

          {loading ? <DashboardSkeleton /> : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="total contacts" value={stats?.total ?? 0} icon={Users} />
                <StatCard title="added this month" value={stats?.addedThisMonth ?? 0} icon={UserPlus} />
                <StatCard title="total partnerships" value={stats?.byType?.reduce((sum: number, t: any) => sum + t._count, 0) ?? 0} icon={Handshake} />
                <StatCard title="contact types" value={stats?.byType?.length ?? 0} icon={Layers} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Activity Feed */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>recent activity</CardTitle>
                    <TrendingUp className="w-4 h-4 text-[#555555]" />
                  </CardHeader>
                  <CardContent>
                    {interactions.length > 0 ? (
                      <div className="space-y-1">
                        {interactions.map((inter: any) => (
                          <div
                            key={inter.id}
                            className="flex items-start gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0"
                          >
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#888888] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-mono">
                                <span className="font-medium">{inter.member?.name}</span>
                                {' logged a '}
                                <span className="text-xs text-[#888888]">
                                  [{inter.type}]
                                </span>
                                {' with '}
                                <span className="font-medium">{inter.contact?.fullName}</span>
                              </p>
                              {inter.summary && (
                                <p className="text-xs text-[#555555] mt-0.5 truncate">{inter.summary}</p>
                              )}
                            </div>
                            <span className="text-xs text-[#555555] flex-shrink-0 font-mono">
                              {formatRelativeTime(inter.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-8 h-8 text-[#1a1a1a] mx-auto mb-3" />
                        <p className="text-sm text-[#555555] font-mono">[no activity yet]</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card>
                  <CardHeader>
                    <CardTitle>top onboarders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.leaderboard?.length ? (
                      <div className="space-y-1">
                        {stats.leaderboard.map((m: any) => (
                          <div key={m.rank} className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                            <span className={`text-sm font-bold w-6 text-center font-mono ${
                              m.rank === 1 ? 'text-white' : m.rank === 2 ? 'text-[#888888]' : m.rank === 3 ? 'text-[#555555]' : 'text-[#333333]'
                            }`}>
                              #{m.rank}
                            </span>
                            <Avatar name={m.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate font-mono lowercase">{m.name.toLowerCase()}</p>
                              <p className="text-xs text-[#555555] font-mono lowercase">[{m.role?.toLowerCase() ?? 'member'}]</p>
                            </div>
                            <span className="text-sm font-bold text-[#888888] font-mono">{m.contactCount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#555555] py-4 text-center font-mono">[no data yet]</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>contacts by type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {pieData.map((_: any, index: number) => (
                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip {...chartTooltipStyle} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                          {pieData.map((entry: any, i: number) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-xs text-[#888888] capitalize truncate font-mono">{entry.name.toLowerCase()}</span>
                              <span className="text-xs font-semibold text-white ml-auto font-mono">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#555555] py-8 text-center font-mono">[no contacts yet]</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>contacts by member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.leaderboard?.length ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.leaderboard.map((m: any) => ({ name: m.name.split(' ')[0].toLowerCase(), contacts: m.contactCount }))} margin={{ left: -10 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#555555', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#555555', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                          <RTooltip {...chartTooltipStyle} />
                          <Bar dataKey="contacts" fill="#888888" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-[#555555] py-8 text-center font-mono">[no data yet]</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[#888888] font-mono lowercase">{title}</p>
          <div className="p-2 rounded-sm bg-black">
            <Icon className="w-4 h-4 text-[#555555]" />
          </div>
        </div>
        <p className="text-3xl font-bold text-white font-mono">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
