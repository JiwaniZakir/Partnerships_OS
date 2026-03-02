'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

const isDev = process.env.NEXT_PUBLIC_API_URL?.includes('localhost') ||
  process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDevLogin() {
    setLoading(true);
    setError('');
    const result = await signIn('dev-login', {
      email,
      callbackUrl: '/dashboard',
      redirect: false,
    });
    if (result?.error) {
      setError('Login failed — check that the API is running and email is approved.');
      setLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1EFE7]">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <span className="text-[120px] leading-none text-[#1A1A1A] select-none" style={{ fontFamily: 'var(--font-serif), Playfair Display, serif', fontStyle: 'italic' }}>
            f
          </span>
        </div>

        <h1 className="text-3xl text-[#1A1A1A] mb-1" style={{ fontFamily: 'var(--font-serif), Playfair Display, serif', fontStyle: 'italic' }}>
          the foundry
        </h1>
        <p className="text-[11px] text-[#A09A90] font-medium uppercase tracking-[0.25em] mb-10">
          partnerships os
        </p>

        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1A1A1A] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 focus:ring-offset-2 focus:ring-offset-[#F1EFE7]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {isDev && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E0D8]" />
              <span className="text-xs text-[#A09A90]">or</span>
              <div className="h-px flex-1 bg-[#E5E0D8]" />
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@your-domain.com"
                className="w-full rounded-xl border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#A09A90] focus:border-[#C4BEB4] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
              />
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full rounded-xl border border-[#E5E0D8] bg-white px-4 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#FAFAF7] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Dev Login'}
              </button>
              {error && (
                <p className="text-xs text-[#C1121F]">{error}</p>
              )}
            </div>
          </>
        )}

        <p className="mt-6 text-xs text-[#A09A90]">
          Only approved domain accounts can access this platform
        </p>
      </div>
    </div>
  );
}
