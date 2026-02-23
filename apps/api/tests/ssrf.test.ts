import { describe, it, expect } from 'vitest';
import { safeUrlSchema, isPrivateHost } from '@fpos/shared';

describe('isPrivateHost — direct function tests', () => {
  it('should identify 127.0.0.1 as private', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true);
  });

  it('should identify 127.x.x.x range as private', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true);
    expect(isPrivateHost('127.255.255.255')).toBe(true);
    expect(isPrivateHost('127.1.2.3')).toBe(true);
  });

  it('should identify 10.x.x.x range as private', () => {
    expect(isPrivateHost('10.0.0.1')).toBe(true);
    expect(isPrivateHost('10.255.255.255')).toBe(true);
    expect(isPrivateHost('10.10.10.10')).toBe(true);
  });

  it('should identify 172.16.x.x - 172.31.x.x range as private', () => {
    expect(isPrivateHost('172.16.0.1')).toBe(true);
    expect(isPrivateHost('172.20.0.1')).toBe(true);
    expect(isPrivateHost('172.31.255.255')).toBe(true);
  });

  it('should not identify 172.15.x.x or 172.32.x.x as private', () => {
    expect(isPrivateHost('172.15.0.1')).toBe(false);
    expect(isPrivateHost('172.32.0.1')).toBe(false);
  });

  it('should identify 192.168.x.x range as private', () => {
    expect(isPrivateHost('192.168.0.1')).toBe(true);
    expect(isPrivateHost('192.168.1.1')).toBe(true);
    expect(isPrivateHost('192.168.255.255')).toBe(true);
  });

  it('should identify 169.254.x.x (link-local) as private', () => {
    expect(isPrivateHost('169.254.0.1')).toBe(true);
    expect(isPrivateHost('169.254.169.254')).toBe(true);
  });

  it('should identify 0.0.0.0 as private', () => {
    expect(isPrivateHost('0.0.0.0')).toBe(true);
  });

  it('should identify localhost as private', () => {
    expect(isPrivateHost('localhost')).toBe(true);
    expect(isPrivateHost('LOCALHOST')).toBe(true);
    expect(isPrivateHost('Localhost')).toBe(true);
  });

  it('should identify IPv6 loopback (::1) as private', () => {
    expect(isPrivateHost('::1')).toBe(true);
    expect(isPrivateHost('[::1]')).toBe(true);
  });

  it('should identify IPv6 private ranges (fc00::/7) as private', () => {
    expect(isPrivateHost('fc00::1')).toBe(true);
    expect(isPrivateHost('fd00::1')).toBe(true);
    expect(isPrivateHost('[fc00::1]')).toBe(true);
    expect(isPrivateHost('[fd00::1]')).toBe(true);
  });

  it('should not identify public IPs as private', () => {
    expect(isPrivateHost('8.8.8.8')).toBe(false);
    expect(isPrivateHost('1.1.1.1')).toBe(false);
    expect(isPrivateHost('203.0.113.1')).toBe(false);
  });

  it('should not identify public hostnames as private', () => {
    expect(isPrivateHost('google.com')).toBe(false);
    expect(isPrivateHost('linkedin.com')).toBe(false);
    expect(isPrivateHost('api.foundryphl.com')).toBe(false);
  });
});

describe('safeUrlSchema — URL validation with SSRF protection', () => {
  const schema = safeUrlSchema();

  // Helper to check parse success
  function isValid(url: string): boolean {
    return schema.safeParse(url).success;
  }

  describe('accepts valid public URLs', () => {
    it('should accept https://google.com', () => {
      expect(isValid('https://google.com')).toBe(true);
    });

    it('should accept https://linkedin.com/in/user', () => {
      expect(isValid('https://linkedin.com/in/user')).toBe(true);
    });

    it('should accept https://www.example.com/path?query=value', () => {
      expect(isValid('https://www.example.com/path?query=value')).toBe(true);
    });

    it('should accept http:// (non-TLS) public URLs', () => {
      expect(isValid('http://example.com')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isValid('https://example.com:8080/api')).toBe(true);
    });
  });

  describe('rejects private/internal IP addresses', () => {
    it('should reject http://127.0.0.1', () => {
      expect(isValid('http://127.0.0.1')).toBe(false);
    });

    it('should reject http://10.0.0.1', () => {
      expect(isValid('http://10.0.0.1')).toBe(false);
    });

    it('should reject http://172.16.0.1', () => {
      expect(isValid('http://172.16.0.1')).toBe(false);
    });

    it('should reject http://192.168.1.1', () => {
      expect(isValid('http://192.168.1.1')).toBe(false);
    });

    it('should reject http://0.0.0.0', () => {
      expect(isValid('http://0.0.0.0')).toBe(false);
    });

    it('should reject http://169.254.169.254 (AWS metadata)', () => {
      expect(isValid('http://169.254.169.254')).toBe(false);
    });
  });

  describe('rejects localhost', () => {
    it('should reject http://localhost', () => {
      expect(isValid('http://localhost')).toBe(false);
    });

    it('should reject http://localhost:3000', () => {
      expect(isValid('http://localhost:3000')).toBe(false);
    });

    it('should reject https://localhost/path', () => {
      expect(isValid('https://localhost/path')).toBe(false);
    });
  });

  describe('rejects non-HTTP protocols', () => {
    it('should reject ftp:// URLs', () => {
      expect(isValid('ftp://ftp.example.com/file.txt')).toBe(false);
    });

    it('should reject file:// URLs', () => {
      expect(isValid('file:///etc/passwd')).toBe(false);
    });

    it('should reject javascript: URLs', () => {
      expect(isValid('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isValid('data:text/plain,hello')).toBe(false);
    });

    it('should reject ssh:// URLs', () => {
      expect(isValid('ssh://user@host')).toBe(false);
    });
  });

  describe('rejects invalid URLs', () => {
    it('should reject empty string', () => {
      expect(isValid('')).toBe(false);
    });

    it('should reject plain text', () => {
      expect(isValid('not a url')).toBe(false);
    });

    it('should reject URL without protocol', () => {
      expect(isValid('google.com')).toBe(false);
    });
  });

  describe('provides correct error message', () => {
    it('should include SSRF warning in error message for private IPs', () => {
      const result = schema.safeParse('http://192.168.1.1');
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes('private/internal'))).toBe(true);
      }
    });
  });
});
