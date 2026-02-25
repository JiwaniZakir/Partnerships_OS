import NextAuth from 'next-auth';
import type { Session, NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

/** Extended session type that includes the backend access token. */
export interface ExtendedSession extends Session {
  accessToken?: string;
  backendToken?: string;
  member?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isAdmin: boolean;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: 'dev-login',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;

        try {
          const response = await fetch(`${API_URL}/auth/dev-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) return null;

          const data = await response.json();
          return {
            id: data.member.id,
            email: data.member.email,
            name: data.member.name,
            backendToken: data.accessToken,
            backendRefreshToken: data.refreshToken,
            member: data.member,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/contacts') ||
        request.nextUrl.pathname.startsWith('/graph') ||
        request.nextUrl.pathname.startsWith('/discover') ||
        request.nextUrl.pathname.startsWith('/members') ||
        request.nextUrl.pathname.startsWith('/settings');

      if (isOnDashboard) {
        return isLoggedIn;
      }
      return true;
    },
    async signIn({ user }) {
      const email = user.email || '';
      const allowedDomain = process.env.ALLOWED_DOMAIN || 'example.com';
      return email.endsWith(`@${allowedDomain}`);
    },
    async jwt({ token, user, account }) {
      // Credentials login — tokens come from the user object directly
      if (user && (user as any).backendToken) {
        token.backendToken = (user as any).backendToken;
        token.backendRefreshToken = (user as any).backendRefreshToken;
        token.member = (user as any).member;
        return token;
      }

      // Google OAuth login — exchange id_token for backend JWT
      if (account?.id_token) {
        try {
          const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token }),
          });

          if (response.ok) {
            const data = await response.json();
            token.backendToken = data.accessToken;
            token.backendRefreshToken = data.refreshToken;
            token.member = data.member;
          }
        } catch (err) {
          console.error('Backend auth failed:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      const extSession = session as ExtendedSession;
      extSession.accessToken = token.backendToken as string | undefined;
      extSession.backendToken = token.backendToken as string | undefined;
      extSession.member = token.member as ExtendedSession['member'];
      return extSession;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
