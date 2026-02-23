import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import Google from 'next-auth/providers/google';

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email || '';
      return email.endsWith('@foundryphl.com');
    },
    async jwt({ token, account }) {
      if (account?.id_token) {
        // Exchange Google token for backend JWT
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: account.id_token }),
            }
          );

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
  pages: {
    signIn: '/login',
  },
});
