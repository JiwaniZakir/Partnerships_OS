import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Foundry Partnerships OS',
  description: 'Partnership intelligence platform for The Foundry PHL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
