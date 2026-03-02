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
      <header className="h-14 border-b border-[#E5E0D8] bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4 pl-10 lg:pl-0">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#A09A90] bg-[#F1EFE7] rounded-lg border border-[#E5E0D8] hover:border-[#C4BEB4] hover:text-[#6B6560] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">search...</span>
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E5E0D8] text-[#A09A90] ml-4 hidden sm:inline">
              {'\u2318'}K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#F1EFE7] rounded-lg transition-colors relative">
            <Bell className="w-4 h-4 text-[#A09A90]" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex items-center gap-2.5 hover:bg-[#F1EFE7] rounded-lg p-1.5 pr-3 transition-colors"
            >
              <Avatar name={member?.name || 'FP'} size="sm" />
              {member && (
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-[#1A1A1A] leading-tight">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-[#A09A90] leading-tight">
                    {member.role || 'member'}
                  </p>
                </div>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-[#E5E0D8] shadow-lg py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-[#E5E0D8]">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {member?.name}
                  </p>
                  <p className="text-xs text-[#A09A90] mt-0.5">{member?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#6B6560] hover:bg-[#F1EFE7] hover:text-[#1A1A1A] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
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
