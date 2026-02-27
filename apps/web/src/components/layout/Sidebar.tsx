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

  // Auto-collapse sidebar on screens < 1024px
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button - visible on small screens when sidebar is collapsed */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3 z-50 p-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#888888] hover:text-white transition-colors lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-[#0f0f0f] bg-black h-screen transition-all duration-200',
          // Desktop behavior
          collapsed ? 'w-[68px]' : 'w-60',
          // Mobile: hidden by default, shown as overlay when mobileOpen
          'hidden lg:flex',
          mobileOpen && 'fixed inset-y-0 left-0 z-50 flex w-60'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#0f0f0f]">
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight font-mono">partnerships os</h1>
            </div>
          )}
          {collapsed && !mobileOpen && (
            <span className="text-sm font-bold text-white mx-auto font-mono">p</span>
          )}

          {/* Close button for mobile overlay */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 hover:bg-[#0a0a0a] rounded-md text-[#555555] hover:text-white transition-colors flex-shrink-0 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop collapse button */}
          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'p-1.5 hover:bg-[#0a0a0a] rounded-md text-[#555555] hover:text-white transition-colors flex-shrink-0 hidden lg:block',
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
                  'flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors relative font-mono',
                  isActive
                    ? 'bg-[#0a0a0a] text-white font-medium'
                    : 'text-[#888888] hover:bg-[#0a0a0a] hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                )}
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] flex-shrink-0',
                    isActive ? 'text-white' : 'text-[#555555]'
                  )}
                />
                {showLabel && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {collapsed && !mobileOpen && (
          <div className="p-2 border-t border-[#1a1a1a] hidden lg:block">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 hover:bg-[#0a0a0a] rounded-md text-[#555555] hover:text-white transition-colors w-full flex justify-center"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-[#555555] text-center font-mono">v0.1.0</p>
          </div>
        )}
      </aside>
    </>
  );
}
