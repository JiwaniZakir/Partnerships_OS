'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Network,
  Users,
  Search,
  UserCircle,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Network Graph', href: '/graph', icon: Network },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Discover', href: '/discover', icon: Search },
  { label: 'Members', href: '/members', icon: UserCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3 z-50 p-2 rounded-lg bg-white border border-[#E5E0D8] text-[#6B6560] hover:text-[#1A1A1A] transition-colors lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r border-[#E5E0D8] bg-white h-screen transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-60',
          'hidden lg:flex',
          mobileOpen && 'fixed inset-y-0 left-0 z-50 flex w-60'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#E5E0D8]">
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: 'var(--font-serif), Playfair Display, serif', fontStyle: 'italic' }}>the foundry</h1>
            </div>
          )}
          {collapsed && !mobileOpen && (
            <span className="text-base font-semibold text-[#1A1A1A] mx-auto" style={{ fontFamily: 'var(--font-serif), Playfair Display, serif', fontStyle: 'italic' }}>f</span>
          )}

          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 hover:bg-[#F1EFE7] rounded-md text-[#A09A90] hover:text-[#1A1A1A] transition-colors flex-shrink-0 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'p-1.5 hover:bg-[#F1EFE7] rounded-md text-[#A09A90] hover:text-[#1A1A1A] transition-colors flex-shrink-0 hidden lg:block',
                collapsed && 'hidden'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const showLabel = !collapsed || mobileOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showLabel ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors relative',
                  isActive
                    ? 'bg-[#F1EFE7] text-[#1A1A1A] font-medium'
                    : 'text-[#6B6560] hover:bg-[#F1EFE7] hover:text-[#1A1A1A]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1A1A1A] rounded-r" />
                )}
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] flex-shrink-0',
                    isActive ? 'text-[#1A1A1A]' : 'text-[#A09A90]'
                  )}
                />
                {showLabel && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {collapsed && !mobileOpen && (
          <div className="p-2 border-t border-[#E5E0D8] hidden lg:block">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 hover:bg-[#F1EFE7] rounded-md text-[#A09A90] hover:text-[#1A1A1A] transition-colors w-full flex justify-center"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-[#E5E0D8]">
            <p className="text-[10px] text-[#C4BEB4] text-center tracking-wide">v0.1.0</p>
          </div>
        )}
      </aside>
    </>
  );
}
