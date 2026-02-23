import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock `fs.readFileSync` before the module is imported.
// The approved-members module reads the markdown file synchronously on first call.

const MOCK_APPROVED_MEMBERS_MD = `# Approved Members — The Foundry PHL

> This file is read by the authentication service.

## Admins (Full dashboard + mobile access)
- zakir@foundryphl.com
- admin@foundryphl.com

## Members (Mobile app access)
- alice@foundryphl.com
- bob@foundryphl.com
`;

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => MOCK_APPROVED_MEMBERS_MD),
}));

describe('Approved Members — isApprovedMember', () => {
  let isApprovedMember: (email: string) => boolean;
  let isAdminMember: (email: string) => boolean;
  let getApprovedMembers: () => { email: string; isAdmin: boolean }[];

  beforeEach(async () => {
    vi.resetModules();

    // Re-mock fs for fresh module import
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => MOCK_APPROVED_MEMBERS_MD),
    }));

    const mod = await import('../src/config/approved-members.js');
    isApprovedMember = mod.isApprovedMember;
    isAdminMember = mod.isAdminMember;
    getApprovedMembers = mod.getApprovedMembers;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should recognize admin emails as approved members', () => {
    expect(isApprovedMember('zakir@foundryphl.com')).toBe(true);
    expect(isApprovedMember('admin@foundryphl.com')).toBe(true);
  });

  it('should recognize regular member emails as approved', () => {
    expect(isApprovedMember('alice@foundryphl.com')).toBe(true);
    expect(isApprovedMember('bob@foundryphl.com')).toBe(true);
  });

  it('should reject emails not in the approved list', () => {
    expect(isApprovedMember('stranger@foundryphl.com')).toBe(false);
    expect(isApprovedMember('user@gmail.com')).toBe(false);
    expect(isApprovedMember('hacker@evil.com')).toBe(false);
  });

  it('should be case-insensitive for email matching', () => {
    expect(isApprovedMember('ZAKIR@foundryphl.com')).toBe(true);
    expect(isApprovedMember('Zakir@Foundryphl.Com')).toBe(true);
    expect(isApprovedMember('ALICE@FOUNDRYPHL.COM')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isApprovedMember('')).toBe(false);
  });
});

describe('Approved Members — isAdminMember', () => {
  let isAdminMember: (email: string) => boolean;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => MOCK_APPROVED_MEMBERS_MD),
    }));

    const mod = await import('../src/config/approved-members.js');
    isAdminMember = mod.isAdminMember;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should identify admin emails as admins', () => {
    expect(isAdminMember('zakir@foundryphl.com')).toBe(true);
    expect(isAdminMember('admin@foundryphl.com')).toBe(true);
  });

  it('should not identify regular members as admins', () => {
    expect(isAdminMember('alice@foundryphl.com')).toBe(false);
    expect(isAdminMember('bob@foundryphl.com')).toBe(false);
  });

  it('should not identify unknown emails as admins', () => {
    expect(isAdminMember('stranger@foundryphl.com')).toBe(false);
    expect(isAdminMember('admin@gmail.com')).toBe(false);
  });

  it('should be case-insensitive for admin matching', () => {
    expect(isAdminMember('ZAKIR@foundryphl.com')).toBe(true);
    expect(isAdminMember('Admin@Foundryphl.Com')).toBe(true);
  });
});

describe('Approved Members — getApprovedMembers', () => {
  let getApprovedMembers: () => { email: string; isAdmin: boolean }[];

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => MOCK_APPROVED_MEMBERS_MD),
    }));

    const mod = await import('../src/config/approved-members.js');
    getApprovedMembers = mod.getApprovedMembers;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return all approved members', () => {
    const members = getApprovedMembers();
    expect(members).toHaveLength(4);
  });

  it('should correctly flag admin members', () => {
    const members = getApprovedMembers();
    const admins = members.filter((m) => m.isAdmin);
    const nonAdmins = members.filter((m) => !m.isAdmin);

    expect(admins).toHaveLength(2);
    expect(nonAdmins).toHaveLength(2);

    expect(admins.map((a) => a.email)).toContain('zakir@foundryphl.com');
    expect(admins.map((a) => a.email)).toContain('admin@foundryphl.com');
    expect(nonAdmins.map((a) => a.email)).toContain('alice@foundryphl.com');
    expect(nonAdmins.map((a) => a.email)).toContain('bob@foundryphl.com');
  });
});

describe('Approved Members — markdown parsing edge cases', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('should handle empty file', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => ''),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();
    expect(members).toHaveLength(0);
  });

  it('should handle file with only admins section', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => `## Admins
- solo@foundryphl.com
`),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();
    expect(members).toHaveLength(1);
    expect(members[0].email).toBe('solo@foundryphl.com');
    expect(members[0].isAdmin).toBe(true);
  });

  it('should handle file with only members section', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => `## Members
- member1@foundryphl.com
- member2@foundryphl.com
`),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();
    expect(members).toHaveLength(2);
    expect(members.every((m) => !m.isAdmin)).toBe(true);
  });

  it('should ignore lines that are not member entries', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => `# Title
Some description text

## Admins
- admin@foundryphl.com
Not a member line
<!-- A comment -->

## Members
- member@foundryphl.com
Random text here
`),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();
    expect(members).toHaveLength(2);
  });

  it('should handle members section appearing before admins', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => `## Members
- member@foundryphl.com

## Admins
- admin@foundryphl.com
`),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();

    // The parser switches isAdmin flag based on section headers
    // Members section first: isAdmin = false
    // Admins section second: isAdmin = true
    const admin = members.find((m) => m.email === 'admin@foundryphl.com');
    const member = members.find((m) => m.email === 'member@foundryphl.com');

    expect(admin).toBeDefined();
    expect(admin!.isAdmin).toBe(true);
    expect(member).toBeDefined();
    expect(member!.isAdmin).toBe(false);
  });

  it('should handle extra whitespace in email lines', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn(() => `## Admins
-   spacey@foundryphl.com
`),
    }));

    const mod = await import('../src/config/approved-members.js');
    const members = mod.getApprovedMembers();
    expect(members).toHaveLength(1);
    expect(members[0].email).toBe('spacey@foundryphl.com');
  });
});

describe('Approved Members — cache behavior', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('should read the file only once on multiple calls (cached)', async () => {
    const readFileSyncMock = vi.fn(() => MOCK_APPROVED_MEMBERS_MD);
    vi.doMock('fs', () => ({
      readFileSync: readFileSyncMock,
    }));

    const mod = await import('../src/config/approved-members.js');

    // Multiple calls should use cached data
    mod.isApprovedMember('zakir@foundryphl.com');
    mod.isApprovedMember('alice@foundryphl.com');
    mod.isAdminMember('zakir@foundryphl.com');
    mod.getApprovedMembers();

    // readFileSync should have been called exactly once (on first load)
    expect(readFileSyncMock).toHaveBeenCalledTimes(1);
  });
});
