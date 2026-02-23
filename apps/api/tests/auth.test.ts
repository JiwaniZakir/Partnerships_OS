import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

// We need to generate RSA keys and set up env mocks before importing the JWT module,
// because jwt.ts caches keys in module-level variables and reads env on first call.

let TEST_PRIVATE_KEY_PEM: string;
let TEST_PUBLIC_KEY_PEM: string;
let WRONG_PRIVATE_KEY_PEM: string;
let WRONG_PUBLIC_KEY_PEM: string;

beforeAll(async () => {
  // Generate a valid RSA keypair for testing
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  TEST_PRIVATE_KEY_PEM = await exportPKCS8(privateKey);
  TEST_PUBLIC_KEY_PEM = await exportSPKI(publicKey);

  // Generate a second keypair (wrong key) for rejection tests
  const wrong = await generateKeyPair('RS256');
  WRONG_PRIVATE_KEY_PEM = await exportPKCS8(wrong.privateKey);
  WRONG_PUBLIC_KEY_PEM = await exportSPKI(wrong.publicKey);
});

// Mock getEnv so that jwt.ts reads our test keys
vi.mock('../src/config/env.js', () => ({
  getEnv: () => ({
    JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
    JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
  }),
  loadEnv: () => ({}),
}));

describe('JWT Auth — signAccessToken / verifyAccessToken', () => {
  afterEach(() => {
    // Reset cached keys in jwt.ts between tests by clearing the module cache
    vi.resetModules();
  });

  it('should sign and verify an access token round-trip', async () => {
    // Re-mock with correct keys for this test
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signAccessToken, verifyAccessToken } = await import('../src/auth/jwt.js');

    const payload = {
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: true,
    };

    const token = await signAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 segments

    const verified = await verifyAccessToken(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.name).toBe(payload.name);
    expect(verified.role).toBe(payload.role);
    expect(verified.isAdmin).toBe(payload.isAdmin);
    expect(verified.jti).toBeDefined();
    expect(typeof verified.jti).toBe('string');
  });

  it('should set access token expiration to 15 minutes', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signAccessToken, verifyAccessToken } = await import('../src/auth/jwt.js');

    const beforeSign = Math.floor(Date.now() / 1000);

    const token = await signAccessToken({
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: false,
    });

    const afterSign = Math.floor(Date.now() / 1000);
    const verified = await verifyAccessToken(token);

    // exp should be ~15 minutes (900 seconds) after iat
    expect(verified.iat).toBeDefined();
    expect(verified.exp).toBeDefined();
    const expDelta = verified.exp! - verified.iat!;
    expect(expDelta).toBe(900); // exactly 15 minutes

    // iat should be between beforeSign and afterSign (inclusive)
    expect(verified.iat!).toBeGreaterThanOrEqual(beforeSign);
    expect(verified.iat!).toBeLessThanOrEqual(afterSign);
  });

  it('should set correct issuer and audience on access token', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signAccessToken, verifyAccessToken } = await import('../src/auth/jwt.js');

    const token = await signAccessToken({
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: false,
    });

    const verified = await verifyAccessToken(token);
    expect(verified.iss).toBe('fpos-api');
    expect(verified.aud).toBe('fpos');
  });

  it('should generate unique jti for each token', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signAccessToken, verifyAccessToken } = await import('../src/auth/jwt.js');

    const payload = {
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: false,
    };

    const token1 = await signAccessToken(payload);
    const token2 = await signAccessToken(payload);

    const v1 = await verifyAccessToken(token1);
    const v2 = await verifyAccessToken(token2);

    expect(v1.jti).not.toBe(v2.jti);
  });

  it('should reject an expired token', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { importPKCS8, SignJWT, } = await import('jose');
    const { verifyAccessToken } = await import('../src/auth/jwt.js');

    // Manually create an expired token
    const key = await importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256');
    const expiredToken = await new SignJWT({
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: false,
      jti: 'test-jti',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600) // issued 1 hour ago
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800) // expired 30 min ago
      .setIssuer('fpos-api')
      .setAudience('fpos')
      .sign(key);

    await expect(verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it('should reject a token signed with a different key', async () => {
    // Use the wrong private key to sign, but the correct public key to verify
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { importPKCS8, SignJWT } = await import('jose');
    const { verifyAccessToken } = await import('../src/auth/jwt.js');

    // Sign with the WRONG key
    const wrongKey = await importPKCS8(WRONG_PRIVATE_KEY_PEM, 'RS256');
    const wrongToken = await new SignJWT({
      sub: 'member-123',
      email: 'attacker@evil.com',
      name: 'Attacker',
      role: 'Admin',
      isAdmin: true,
      jti: 'forged-jti',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('fpos-api')
      .setAudience('fpos')
      .sign(wrongKey);

    await expect(verifyAccessToken(wrongToken)).rejects.toThrow();
  });

  it('should reject a token with wrong audience', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { importPKCS8, SignJWT } = await import('jose');
    const { verifyAccessToken } = await import('../src/auth/jwt.js');

    const key = await importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256');
    const badAudienceToken = await new SignJWT({
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir',
      role: 'President',
      isAdmin: false,
      jti: 'test-jti',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('fpos-api')
      .setAudience('wrong-audience')
      .sign(key);

    await expect(verifyAccessToken(badAudienceToken)).rejects.toThrow();
  });

  it('should reject a token with wrong issuer', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { importPKCS8, SignJWT } = await import('jose');
    const { verifyAccessToken } = await import('../src/auth/jwt.js');

    const key = await importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256');
    const badIssuerToken = await new SignJWT({
      sub: 'member-123',
      email: 'zakir@foundryphl.com',
      name: 'Zakir',
      role: 'President',
      isAdmin: false,
      jti: 'test-jti',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('wrong-issuer')
      .setAudience('fpos')
      .sign(key);

    await expect(verifyAccessToken(badIssuerToken)).rejects.toThrow();
  });
});

describe('JWT Auth — signRefreshToken / verifyRefreshToken', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('should sign and verify a refresh token round-trip', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signRefreshToken, verifyRefreshToken } = await import('../src/auth/jwt.js');

    const payload = {
      sub: 'member-456',
      family: 'family-abc',
    };

    const token = await signRefreshToken(payload);
    expect(typeof token).toBe('string');

    const verified = await verifyRefreshToken(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.family).toBe(payload.family);
    expect(verified.jti).toBeDefined();
  });

  it('should set refresh token expiration to 30 days', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signRefreshToken, verifyRefreshToken } = await import('../src/auth/jwt.js');

    const token = await signRefreshToken({
      sub: 'member-456',
      family: 'family-abc',
    });

    const verified = await verifyRefreshToken(token);
    const expDelta = verified.exp! - verified.iat!;
    // 30 days = 30 * 24 * 60 * 60 = 2592000 seconds
    expect(expDelta).toBe(2592000);
  });

  it('should use fpos-refresh audience for refresh tokens', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signRefreshToken, verifyRefreshToken } = await import('../src/auth/jwt.js');

    const token = await signRefreshToken({
      sub: 'member-456',
      family: 'family-abc',
    });

    const verified = await verifyRefreshToken(token);
    expect(verified.aud).toBe('fpos-refresh');
  });

  it('should not accept a refresh token as an access token', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signRefreshToken, verifyAccessToken } = await import('../src/auth/jwt.js');

    const refreshToken = await signRefreshToken({
      sub: 'member-456',
      family: 'family-abc',
    });

    // Refresh token has audience 'fpos-refresh', access verify expects 'fpos'
    await expect(verifyAccessToken(refreshToken)).rejects.toThrow();
  });

  it('should not accept an access token as a refresh token', async () => {
    vi.doMock('../src/config/env.js', () => ({
      getEnv: () => ({
        JWT_PRIVATE_KEY: TEST_PRIVATE_KEY_PEM,
        JWT_PUBLIC_KEY: TEST_PUBLIC_KEY_PEM,
      }),
      loadEnv: () => ({}),
    }));

    const { signAccessToken, verifyRefreshToken } = await import('../src/auth/jwt.js');

    const accessToken = await signAccessToken({
      sub: 'member-456',
      email: 'zakir@foundryphl.com',
      name: 'Zakir Jiwani',
      role: 'President',
      isAdmin: false,
    });

    // Access token has audience 'fpos', refresh verify expects 'fpos-refresh'
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
  });
});
