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
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-6 h-6 text-[#6B6560]" />
            <h1 className="font-serif italic text-2xl text-[#F1EFE7]">Settings</h1>
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
                    placeholder="email@foundryphl.com"
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
                  <p className="text-xs text-emerald-400 mb-3">Member added successfully.</p>
                )}
                {addMemberMutation.isError && (
                  <p className="text-xs text-red-400 mb-3">Failed to add member.</p>
                )}
                <p className="text-xs text-[#6B6560]">
                  Only @foundryphl.com email addresses can be added as members.
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
    <div className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
      <span className="text-sm text-[#A0998A]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
        ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
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
    <div className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
      <span className="text-sm text-[#A0998A]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
        ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
      }`}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {ok ? 'Healthy' : status || 'Unknown'}
      </span>
    </div>
  );
}

function QueueCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  return (
    <div className="bg-[#141414] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#F1EFE7] mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div><p className="text-lg font-bold text-[#C4B99A]">{counts.active || 0}</p><p className="text-[10px] text-[#6B6560] uppercase">Active</p></div>
        <div><p className="text-lg font-bold text-amber-400">{counts.waiting || 0}</p><p className="text-[10px] text-[#6B6560] uppercase">Waiting</p></div>
        <div><p className="text-lg font-bold text-emerald-400">{counts.completed || 0}</p><p className="text-[10px] text-[#6B6560] uppercase">Done</p></div>
        <div><p className="text-lg font-bold text-red-400">{counts.failed || 0}</p><p className="text-[10px] text-[#6B6560] uppercase">Failed</p></div>
      </div>
    </div>
  );
}
