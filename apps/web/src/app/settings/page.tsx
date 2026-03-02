'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { queryKeys, api } from '@/lib/queries';
import {
  Settings as SettingsIcon,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  UserPlus,
  Trash2,
  Key,
} from 'lucide-react';

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const { data: notionStatus } = useQuery({
    queryKey: queryKeys.notion.status,
    queryFn: api.notion.status,
  });
  const { data: healthData } = useQuery({
    queryKey: queryKeys.health.ready,
    queryFn: api.health.ready,
  });
  const { data: queues } = useQuery({
    queryKey: queryKeys.health.queues,
    queryFn: api.health.queues,
  });

  const health = healthData?.checks;
  const apiKeys = healthData?.apiKeys;

  const handleSync = async () => {
    setSyncing(true);
    try { await api.notion.sync(); } catch { /* ignore */ }
    finally { setSyncing(false); }
  };

  const addMemberMutation = useMutation({
    mutationFn: (email: string) => api.admin.addMember(email),
    onSuccess: () => setNewEmail(''),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (email: string) => api.admin.removeMember(email),
  });

  return (
    <div className="flex h-screen bg-[#F1EFE7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-6 h-6 text-[#6B6560]" />
            <h1 className="font-serif italic text-2xl text-[#1A1A1A]">Settings</h1>
          </div>

          <div className="max-w-3xl space-y-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#6B6560]" />
                  <CardTitle>System Health</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <HealthRow label="PostgreSQL" status={health?.postgresql} />
                  <HealthRow label="Neo4j Graph DB" status={health?.neo4j} />
                  <HealthRow label="Redis Cache" status={health?.redis} />
                </div>
              </CardContent>
            </Card>

            {/* API Key Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#6B6560]" />
                  <CardTitle>API Keys</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <StatusRow label="Anthropic (Claude)" ok={apiKeys?.anthropic !== false} />
                  <StatusRow label="OpenAI (Embeddings)" ok={apiKeys?.openai !== false} />
                  <StatusRow label="Notion" ok={notionStatus?.apiKeySet} />
                  <StatusRow label="Deepgram (STT)" ok={apiKeys?.deepgram !== false} />
                  <StatusRow label="Tavily (Research)" ok={apiKeys?.tavily !== false} />
                </div>
                <p className="text-xs text-[#6B6560] mt-3">
                  API keys are configured via environment variables on the server.
                </p>
              </CardContent>
            </Card>

            {/* Notion Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#6B6560]" />
                  <CardTitle>Notion Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <StatusRow label="API Key" ok={notionStatus?.apiKeySet} />
                  <StatusRow label="Master Contacts DB" ok={notionStatus?.masterDbIdSet} />
                  <StatusRow label="Interactions DB" ok={notionStatus?.interactionsDbIdSet} />
                  <StatusRow label="Organizations DB" ok={notionStatus?.orgsDbIdSet} />
                </div>
                <Button onClick={handleSync} disabled={syncing} variant="secondary" size="sm">
                  {syncing ? <><Loader2 className="w-4 h-4 animate-spin" />Syncing...</> : <><RefreshCw className="w-4 h-4" />Force Sync</>}
                </Button>
              </CardContent>
            </Card>

            {/* Member Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#6B6560]" />
                  <CardTitle>Member Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@your-domain.com"
                    className="sm:max-w-xs"
                  />
                  <Button
                    onClick={() => { if (newEmail.trim()) addMemberMutation.mutate(newEmail.trim()); }}
                    disabled={addMemberMutation.isPending || !newEmail.trim()}
                    size="sm"
                  >
                    {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Add
                  </Button>
                </div>
                {addMemberMutation.isSuccess && (
                  <p className="text-xs text-[#2D6A4F] mb-3">Member added successfully.</p>
                )}
                {addMemberMutation.isError && (
                  <p className="text-xs text-[#C1121F] mb-3">Failed to add member.</p>
                )}
                <p className="text-xs text-[#6B6560]">
                  Only approved domain email addresses can be added as members.
                </p>
              </CardContent>
            </Card>

            {/* Job Queues */}
            {queues && (
              <Card>
                <CardHeader><CardTitle>Job Queues</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <QueueCard title="Research" counts={queues.research} />
                    <QueueCard title="Notion Sync" counts={queues.notionSync} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E5E0D8] last:border-0">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#C1121F]/10 text-[#C1121F]'
      }`}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {ok ? 'Configured' : 'Not Set'}
      </span>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status?: string }) {
  const ok = status === 'ok';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E5E0D8] last:border-0">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#8B6914]/10 text-[#8B6914]'
      }`}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {ok ? 'Healthy' : status || 'Unknown'}
      </span>
    </div>
  );
}

function QueueCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  return (
    <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E5E0D8]">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white rounded-lg p-2.5"><p className="text-lg font-semibold text-[#1A1A1A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{counts.active || 0}</p><p className="text-[10px] text-[#A09A90] uppercase tracking-wider mt-0.5">Active</p></div>
        <div className="bg-white rounded-lg p-2.5"><p className="text-lg font-semibold text-[#8B6914]" style={{ fontVariantNumeric: 'tabular-nums' }}>{counts.waiting || 0}</p><p className="text-[10px] text-[#A09A90] uppercase tracking-wider mt-0.5">Waiting</p></div>
        <div className="bg-white rounded-lg p-2.5"><p className="text-lg font-semibold text-[#2D6A4F]" style={{ fontVariantNumeric: 'tabular-nums' }}>{counts.completed || 0}</p><p className="text-[10px] text-[#A09A90] uppercase tracking-wider mt-0.5">Done</p></div>
        <div className="bg-white rounded-lg p-2.5"><p className="text-lg font-semibold text-[#C1121F]" style={{ fontVariantNumeric: 'tabular-nums' }}>{counts.failed || 0}</p><p className="text-[10px] text-[#A09A90] uppercase tracking-wider mt-0.5">Failed</p></div>
      </div>
    </div>
  );
}
