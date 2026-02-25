import { OAuth2Client } from 'google-auth-library';
import { getEnv } from '../config/env.js';

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!client) {
    const env = getEnv();
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleUser> {
  const env = getEnv();
  const oauth = getClient();

  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token: no payload');
  }

  const email = payload.email;
  if (!email) {
    throw new Error('Invalid Google token: no email');
  }

  const domain = email.split('@')[1];
  if (domain?.toLowerCase() !== env.ALLOWED_DOMAIN.toLowerCase()) {
    throw new Error(`Access restricted to @${env.ALLOWED_DOMAIN} accounts`);
  }

  return {
    googleId: payload.sub,
    email,
    name: payload.name || email.split('@')[0] || email,
    avatarUrl: payload.picture || null,
  };
}
