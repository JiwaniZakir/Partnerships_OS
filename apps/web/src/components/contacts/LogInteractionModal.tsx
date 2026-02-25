'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/queries';
import { Loader2 } from 'lucide-react';

interface LogInteractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
}

export function LogInteractionModal({ open, onOpenChange, contactId, contactName }: LogInteractionModalProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState('MEETING');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [sentiment, setSentiment] = useState('POSITIVE');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.interactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      onOpenChange(false);
      setType('MEETING');
      setSummary('');
      setKeyTakeaways('');
      setSentiment('POSITIVE');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      contactId,
      type,
      date: new Date(date).toISOString(),
      summary,
      keyTakeaways: keyTakeaways.split('\n').filter(Boolean),
      sentiment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Interaction with {contactName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MEETING">Meeting</option>
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="EVENT">Event</option>
              <option value="COFFEE_CHAT">Coffee Chat</option>
              <option value="INTRO">Intro</option>
              <option value="OTHER">Other</option>
            </Select>

            <div>
              <label className="block text-xs font-medium text-[#A0998A] mb-1.5">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0998A] mb-1.5">Summary</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What happened in this interaction?"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0998A] mb-1.5">Key Takeaways (one per line)</label>
            <Textarea
              value={keyTakeaways}
              onChange={(e) => setKeyTakeaways(e.target.value)}
              placeholder="Important points from the conversation..."
              rows={2}
            />
          </div>

          <Select label="Sentiment" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
            <option value="VERY_POSITIVE">Very Positive</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="NEGATIVE">Negative</option>
            <option value="VERY_NEGATIVE">Very Negative</option>
          </Select>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !summary.trim()} className="flex-1">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Interaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
