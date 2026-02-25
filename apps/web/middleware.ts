export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contacts/:path*',
    '/graph/:path*',
    '/discover/:path*',
    '/members/:path*',
    '/settings/:path*',
  ],
};
