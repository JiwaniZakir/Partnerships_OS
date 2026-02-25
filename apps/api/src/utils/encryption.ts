import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_VERSION = '02';

function deriveKey(rawKey: string, salt: Buffer): Buffer {
  return scryptSync(rawKey, salt, 32);
}

function getRawKey(): string {
  const rawKey = process.env.PII_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('PII_ENCRYPTION_KEY not set');
  }
  return rawKey;
}

export function encrypt(plaintext: string): string {
  const rawKey = getRawKey();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(rawKey, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: salt(16) + iv(12) + ciphertext + authTag(16), all base64 encoded
  const combined = Buffer.concat([salt, iv, encrypted, tag]);
  return `${KEY_VERSION}:${combined.toString('base64')}`;
}

export function decrypt(ciphertext: string): string {
  const rawKey = getRawKey();

  // Support versioned format
  const colonIndex = ciphertext.indexOf(':');
  if (colonIndex === -1) {
    throw new Error('Invalid encrypted format');
  }

  const version = ciphertext.slice(0, colonIndex);
  const payload = ciphertext.slice(colonIndex + 1);

  if (version === '02') {
    const combined = Buffer.from(payload, 'base64');
    if (combined.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid encrypted data: too short');
    }

    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);

    const key = deriveKey(rawKey, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }

  // Legacy v01 format: VERSION:ivHex:tagHex:encryptedHex (hardcoded salt)
  if (version === '01') {
    const legacyParts = ciphertext.split(':');
    if (legacyParts.length !== 4 || !legacyParts[1] || !legacyParts[2] || !legacyParts[3]) {
      throw new Error('Invalid legacy encrypted format');
    }
    const ivHex = legacyParts[1];
    const tagHex = legacyParts[2];
    const encryptedHex = legacyParts[3];
    const legacySalt = Buffer.from('fpos-salt', 'utf8');
    const key = scryptSync(rawKey, legacySalt, 32);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
  }

  throw new Error(`Unsupported encryption version: ${version}`);
}

export function isEncrypted(value: string): boolean {
  // Match v02 format (base64 payload) or legacy v01 format (hex payload)
  return /^02:[A-Za-z0-9+/=]+$/.test(value) || /^01:[a-f0-9]{24,}:[a-f0-9]{32}:.+$/.test(value);
}
