'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Network,
  Users,
  Search,
  UserCircle,
  Settings,
  RefreshCw,
  User,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Network Graph', href: '/graph', icon: Network },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Discover', href: '/discover', icon: Search },
  { label: 'Members', href: '/members', icon: UserCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchContacts = useCallback(async (q: string) => {
    if (q.length < 2) {
      setContacts([]);
      return;
    }
    setSearching(true);
    try {
      const results = await fetchApi(`/graph/search?q=${encodeURIComponent(q)}`);
      setContacts(Array.isArray(results) ? results.slice(0, 5) : []);
    } catch {
      setContacts([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchContacts(query), 200);
    return () => clearTimeout(timer);
  }, [query, searchContacts]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setContacts([]);
    }
  }, [open]);

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  async function triggerNotionSync() {
    try {
      await fetchApi('/notion/sync', { method: 'POST' });
    } catch { /* ignore */ }
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
        <Command
          className="w-full max-w-lg rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-2xl overflow-hidden"
          shouldFilter={false}
        >
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search contacts, navigate, or run actions..."
            className="w-full h-12 px-4 bg-transparent text-[#F1EFE7] placeholder:text-[#6B6560] text-sm border-b border-[#2A2A2A] outline-none"
          />
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[#6B6560]">
              {searching ? 'Searching...' : 'No results found.'}
            </Command.Empty>

            {contacts.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[10px] uppercase tracking-wider text-[#6B6560] px-2">
                    Contacts
                  </span>
                }
              >
                {contacts.map((contact: any) => (
                  <Command.Item
                    key={contact.id}
                    value={contact.fullName}
                    onSelect={() => navigate(`/contacts/${contact.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-[#A0998A] cursor-pointer data-[selected=true]:bg-[#2A2A2A] data-[selected=true]:text-[#F1EFE7]"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate">{contact.fullName}</p>
                      {contact.organization && (
                        <p className="text-xs text-[#6B6560] truncate">
                          {contact.title} at {contact.organization}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading={
                <span className="text-[10px] uppercase tracking-wider text-[#6B6560] px-2">
                  Navigation
                </span>
              }
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => navigate(item.href)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-[#A0998A] cursor-pointer data-[selected=true]:bg-[#2A2A2A] data-[selected=true]:text-[#F1EFE7]"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group
              heading={
                <span className="text-[10px] uppercase tracking-wider text-[#6B6560] px-2">
                  Actions
                </span>
              }
            >
              <Command.Item
                value="Sync Notion"
                onSelect={triggerNotionSync}
                className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-[#A0998A] cursor-pointer data-[selected=true]:bg-[#2A2A2A] data-[selected=true]:text-[#F1EFE7]"
              >
                <RefreshCw className="w-4 h-4 flex-shrink-0" />
                Sync to Notion
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
