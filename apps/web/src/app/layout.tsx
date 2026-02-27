import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Partnerships OS',
  description: 'Partnership intelligence platform',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace' }}>
        <SessionProvider>
          <QueryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
