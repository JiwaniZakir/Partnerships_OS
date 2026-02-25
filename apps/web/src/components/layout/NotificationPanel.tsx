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
    <div className="absolute right-0 top-full mt-1 w-80 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
        <h3 className="text-sm font-medium text-[#F1EFE7]">Notifications</h3>
        <Bell className="w-4 h-4 text-[#6B6560]" />
      </div>
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <Inbox className="w-8 h-8 text-[#6B6560] mb-2" />
        <p className="text-sm text-[#6B6560]">No notifications</p>
      </div>
    </div>
  );
}
