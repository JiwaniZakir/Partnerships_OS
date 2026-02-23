import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the PII encryption module (apps/api/src/utils/encryption.ts).
 *
 * The encryption module reads PII_ENCRYPTION_KEY directly from process.env
 * (not through getEnv), so we set process.env before each test.
 */

const TEST_ENCRYPTION_KEY = 'a]3kF9#mP!xQ7vZ2$wL8rN4tU0yC6bH5';
const WRONG_ENCRYPTION_KEY = 'WRONG_KEY_0123456789abcdefghijklm';

describe('PII Encryption — encrypt / decrypt', () => {
  let encrypt: (plaintext: string) => string;
  let decrypt: (ciphertext: string) => string;
  let isEncrypted: (value: string) => boolean;

  beforeEach(async () => {
    // Set the encryption key in process.env before importing
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

    // Reset modules to get fresh imports (encryption reads process.env at call time)
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
    isEncrypted = mod.isEncrypted;
  });

  afterEach(() => {
    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
  });

  it('should encrypt and decrypt a simple string round-trip', () => {
    const plaintext = 'zakir@foundryphl.com';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt an empty string', () => {
    const plaintext = '';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt unicode text', () => {
    const plaintext = 'Hello, World! \u{1F30D} \u00FC\u00F6\u00E4\u00DF \u4F60\u597D';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt long text', () => {
    const plaintext = 'A'.repeat(10000);
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same input (random salt)', () => {
    const plaintext = 'sensitive-data';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);

    // But the ciphertexts should be different due to random salt + IV
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should produce v02 format ciphertext', () => {
    const plaintext = 'test data';
    const encrypted = encrypt(plaintext);

    // Format should be "02:<base64data>"
    expect(encrypted).toMatch(/^02:[A-Za-z0-9+/=]+$/);
  });

  it('should throw when PII_ENCRYPTION_KEY is not set', async () => {
    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    expect(() => mod.encrypt('test')).toThrow('PII_ENCRYPTION_KEY not set');
  });

  it('should throw when decrypting with no key set', async () => {
    const encrypted = encrypt('test');

    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    expect(() => mod.decrypt(encrypted)).toThrow('PII_ENCRYPTION_KEY not set');
  });
});

describe('PII Encryption — wrong key rejection', () => {
  afterEach(() => {
    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
  });

  it('should fail to decrypt when using a different key', async () => {
    // Encrypt with the correct key
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod1 = await import('../src/utils/encryption.js');
    const encrypted = mod1.encrypt('secret data');

    // Try to decrypt with the wrong key
    process.env.PII_ENCRYPTION_KEY = WRONG_ENCRYPTION_KEY;
    vi.resetModules();
    const mod2 = await import('../src/utils/encryption.js');

    expect(() => mod2.decrypt(encrypted)).toThrow();
  });
});

describe('PII Encryption — isEncrypted', () => {
  let isEncrypted: (value: string) => boolean;
  let encrypt: (plaintext: string) => string;

  beforeEach(async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');
    isEncrypted = mod.isEncrypted;
    encrypt = mod.encrypt;
  });

  afterEach(() => {
    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
  });

  it('should identify v02 encrypted strings', () => {
    const encrypted = encrypt('hello');
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('should not identify plain text as encrypted', () => {
    expect(isEncrypted('hello world')).toBe(false);
    expect(isEncrypted('zakir@foundryphl.com')).toBe(false);
    expect(isEncrypted('just some text')).toBe(false);
  });

  it('should not identify random strings with colon as encrypted', () => {
    expect(isEncrypted('foo:bar')).toBe(false);
    expect(isEncrypted('abc:def:ghi')).toBe(false);
  });

  it('should identify v01 legacy format as encrypted', () => {
    // v01 format: 01:<ivHex(24+)>:<tagHex(32)>:<encryptedHex>
    const fakeV01 = '01:' + 'a'.repeat(24) + ':' + 'b'.repeat(32) + ':' + 'c'.repeat(16);
    expect(isEncrypted(fakeV01)).toBe(true);
  });

  it('should not identify invalid v01 format as encrypted', () => {
    // Too short hex for IV
    expect(isEncrypted('01:abc:def:ghi')).toBe(false);
  });

  it('should not identify empty string as encrypted', () => {
    expect(isEncrypted('')).toBe(false);
  });

  it('should not identify version-only prefix as encrypted', () => {
    expect(isEncrypted('02:')).toBe(false);
  });
});

describe('PII Encryption — v01 legacy format backward compatibility', () => {
  afterEach(() => {
    delete process.env.PII_ENCRYPTION_KEY;
    vi.resetModules();
  });

  it('should decrypt a v01 format ciphertext', async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();

    // To test v01 decryption, we need to manually construct a v01 ciphertext
    // v01 uses: hardcoded salt 'fpos-salt', hex-encoded iv:tag:encrypted
    const { createCipheriv, scryptSync, randomBytes } = await import('crypto');

    const rawKey = TEST_ENCRYPTION_KEY;
    const legacySalt = Buffer.from('fpos-salt', 'utf8');
    const key = scryptSync(rawKey, legacySalt, 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const plaintext = 'legacy secret';
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    const v01Ciphertext = `01:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;

    const mod = await import('../src/utils/encryption.js');
    const decrypted = mod.decrypt(v01Ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('should reject invalid v01 format with wrong number of parts', async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    expect(() => mod.decrypt('01:onlytwosegments')).toThrow('Invalid legacy encrypted format');
  });

  it('should reject unsupported encryption version', async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    expect(() => mod.decrypt('99:somedata')).toThrow('Unsupported encryption version: 99');
  });

  it('should reject ciphertext without version delimiter', async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    expect(() => mod.decrypt('nodividerhere')).toThrow('Invalid encrypted format');
  });

  it('should reject v02 ciphertext that is too short', async () => {
    process.env.PII_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.resetModules();
    const mod = await import('../src/utils/encryption.js');

    // base64 of just a few bytes — less than salt(16) + iv(12) + tag(16) = 44 bytes minimum
    const tooShort = Buffer.from('abc').toString('base64');
    expect(() => mod.decrypt(`02:${tooShort}`)).toThrow('Invalid encrypted data: too short');
  });
});
