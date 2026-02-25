import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Foundry Partnerships OS',
  description: 'Partnership intelligence platform for The Foundry PHL',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased font-sans" style={{ fontFamily: 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <SessionProvider>
          <QueryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
