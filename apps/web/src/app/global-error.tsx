'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#F1EFE7' }}>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C1121F]/10">
              <svg
                className="h-6 w-6 text-[#C1121F]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-[#6B6560]">
              A critical error occurred. Please try again or refresh the page.
            </p>
            <button
              onClick={reset}
              className="rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
