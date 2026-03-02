'use client';

import React from 'react';
import { Bell, Inbox } from 'lucide-react';

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-[#E5E0D8] shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8]">
        <h3 className="text-sm font-medium text-[#1A1A1A]">Notifications</h3>
        <Bell className="w-4 h-4 text-[#A09A90]" />
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EFE7] mb-3">
          <Inbox className="w-5 h-5 text-[#A09A90]" />
        </div>
        <p className="text-sm text-[#A09A90]">No notifications</p>
      </div>
    </div>
  );
}
