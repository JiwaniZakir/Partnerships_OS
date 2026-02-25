'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Bell, Search } from 'lucide-react';
import type { ExtendedSession } from '@/lib/auth';
import { Avatar } from '@/components/ui/avatar';
import { CommandPalette } from './CommandPalette';

export function Header() {
  const { data: session } = useSession();
  const extSession = session as ExtendedSession | null;
  const member = extSession?.member;
  const [showMenu, setShowMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showMenu]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 border-b border-[#2A2A2A] bg-[#0A0A0A] flex items-center justify-between px-6">
        <div className="flex items-center gap-4 pl-10 lg:pl-0">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#6B6560] bg-[#141414] rounded-lg border border-[#2A2A2A] hover:border-[#3A3A3A] hover:text-[#A0998A] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="text-[10px] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#2A2A2A] text-[#6B6560] font-mono ml-4 hidden sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors relative">
            <Bell className="w-4 h-4 text-[#6B6560]" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex items-center gap-2.5 hover:bg-[#1A1A1A] rounded-lg p-1.5 pr-3 transition-colors"
            >
              <Avatar name={member?.name || 'FP'} size="sm" />
              {member && (
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-[#F1EFE7] leading-tight">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-[#6B6560] leading-tight">
                    {member.role || 'Member'}
                  </p>
                </div>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] shadow-xl py-1 z-50">
                <div className="px-3 py-2 border-b border-[#2A2A2A]">
                  <p className="text-sm font-medium text-[#F1EFE7]">
                    {member?.name}
                  </p>
                  <p className="text-xs text-[#6B6560]">{member?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#A0998A] hover:bg-[#2A2A2A] hover:text-[#F1EFE7] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
      />
    </>
  );
}
