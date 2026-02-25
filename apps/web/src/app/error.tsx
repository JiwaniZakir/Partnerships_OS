'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6">
      <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#F1EFE7]">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-[#6B6560]">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#F1EFE7] px-5 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#F1EFE7]/50"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
