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

const PIE_COLORS = ['#1A1A1A', '#6B6560', '#A09A90', '#C4BEB4', '#E5E0D8', '#F1EFE7', '#FAFAF7', '#FFFFFF'];

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E0D8',
    borderRadius: '8px',
    color: '#1A1A1A',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
  },
  itemStyle: { color: '#1A1A1A' },
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
    <div className="flex h-screen bg-[#F1EFE7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif italic text-2xl text-[#1A1A1A]">Dashboard</h1>
            <p className="text-sm text-[#A09A90]">
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
                <StatCard title="Total Contacts" value={stats?.total ?? 0} icon={Users} />
                <StatCard title="Added This Month" value={stats?.addedThisMonth ?? 0} icon={UserPlus} />
                <StatCard title="Total Partnerships" value={stats?.byType?.reduce((sum: number, t: any) => sum + t._count, 0) ?? 0} icon={Handshake} />
                <StatCard title="Contact Types" value={stats?.byType?.length ?? 0} icon={Layers} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Activity Feed */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <TrendingUp className="w-4 h-4 text-[#A09A90]" />
                  </CardHeader>
                  <CardContent>
                    {interactions.length > 0 ? (
                      <div className="space-y-0.5">
                        {interactions.map((inter: any) => (
                          <div
                            key={inter.id}
                            className="flex items-start gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-[#FAFAF7] transition-colors"
                          >
                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#C4BEB4] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1A1A1A]">
                                <span className="font-medium">{inter.member?.name}</span>
                                {' logged a '}
                                <span className="text-[#6B6560]">
                                  {inter.type.toLowerCase().replace(/_/g, ' ')}
                                </span>
                                {' with '}
                                <span className="font-medium">{inter.contact?.fullName}</span>
                              </p>
                              {inter.summary && (
                                <p className="text-xs text-[#A09A90] mt-0.5 truncate">{inter.summary}</p>
                              )}
                            </div>
                            <span className="text-xs text-[#A09A90] flex-shrink-0 mt-0.5">
                              {formatRelativeTime(inter.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-8 h-8 text-[#A09A90] mx-auto mb-3" />
                        <p className="text-sm text-[#A09A90]">No activity yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Onboarders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.leaderboard?.length ? (
                      <div className="space-y-0.5">
                        {stats.leaderboard.map((m: any) => (
                          <div key={m.rank} className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-[#FAFAF7] transition-colors">
                            <span className={`text-sm font-semibold w-6 text-center ${
                              m.rank === 1 ? 'text-[#1A1A1A]' : 'text-[#A09A90]'
                            }`}>
                              {m.rank}
                            </span>
                            <Avatar name={m.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1A1A1A] truncate">{m.name}</p>
                              <p className="text-xs text-[#A09A90]">{m.role ?? 'Member'}</p>
                            </div>
                            <span className="text-sm font-semibold text-[#1A1A1A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.contactCount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#A09A90] py-4 text-center">No data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contacts by Type</CardTitle>
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
                              <span className="text-xs text-[#6B6560] capitalize truncate">{entry.name.toLowerCase()}</span>
                              <span className="text-xs font-semibold text-[#1A1A1A] ml-auto">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#A09A90] py-8 text-center">No contacts yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contacts by Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.leaderboard?.length ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.leaderboard.map((m: any) => ({ name: m.name.split(' ')[0], contacts: m.contactCount }))} margin={{ left: -10 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B6560', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#A09A90', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                          <RTooltip {...chartTooltipStyle} />
                          <Bar dataKey="contacts" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-[#A09A90] py-8 text-center">No data yet</p>
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#6B6560]">{title}</p>
          <div className="p-2 rounded-lg bg-[#F1EFE7]">
            <Icon className="w-4 h-4 text-[#6B6560]" />
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight text-[#1A1A1A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString()}</p>
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
