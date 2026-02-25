import { importPKCS8, importSPKI, SignJWT, jwtVerify, type JWTPayload, type KeyLike } from 'jose';
import { randomUUID } from 'crypto';
import { getEnv } from '../config/env.js';

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  jti: string;
}

let privateKey: KeyLike | null = null;
let publicKey: KeyLike | null = null;

async function getPrivateKey(): Promise<KeyLike> {
  if (!privateKey) {
    const env = getEnv();
    privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
  }
  return privateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (!publicKey) {
    const env = getEnv();
    publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
  }
  return publicKey;
}

export async function signAccessToken(payload: {
  sub: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
}): Promise<string> {
  const key = await getPrivateKey();
  return new SignJWT({ ...payload, jti: randomUUID() })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('fpos-api')
    .setAudience('fpos')
    .sign(key);
}

export async function signRefreshToken(payload: {
  sub: string;
  family: string;
}): Promise<string> {
  const key = await getPrivateKey();
  return new SignJWT({ sub: payload.sub, family: payload.family, jti: randomUUID() })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setIssuer('fpos-api')
    .setAudience('fpos-refresh')
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: 'fpos-api',
    audience: 'fpos',
  });
  return payload as TokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string; family: string; jti: string }> {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: 'fpos-api',
    audience: 'fpos-refresh',
  });
  return payload as { sub: string; family: string; jti: string };
}
