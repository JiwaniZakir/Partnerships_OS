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
    <div className="flex min-h-screen items-center justify-center bg-[#F1EFE7] p-6">
      <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-[#6B6560]">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 focus:ring-offset-2 focus:ring-offset-[#F1EFE7]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
