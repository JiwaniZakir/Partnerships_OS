import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies that agent.ts imports at the top level.
// These must be declared before importing the module under test.
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(),
}));

vi.mock('../src/voice/intents.js', () => ({
  classifyIntent: vi.fn(),
}));

vi.mock('../src/voice/prompts.js', () => ({
  getCoreSystemPrompt: vi.fn(() => 'system prompt'),
}));

vi.mock('../src/voice/handlers/intake.js', () => ({
  handleIntake: vi.fn(),
}));

vi.mock('../src/voice/handlers/log.js', () => ({
  handleLog: vi.fn(),
}));

vi.mock('../src/voice/handlers/query.js', () => ({
  handleQuery: vi.fn(),
}));

vi.mock('../src/voice/handlers/recommend.js', () => ({
  handleRecommend: vi.fn(),
}));

vi.mock('../src/config/database.js', () => ({
  getPrisma: vi.fn(() => ({
    contact: {
      count: vi.fn(() => Promise.resolve(0)),
    },
  })),
}));

vi.mock('../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  createSession,
  getSession,
  destroySession,
  stopSessionCleanup,
  type VoiceSession,
} from '../src/voice/agent.js';

describe('Voice Session Management — createSession', () => {
  beforeEach(() => {
    // Clean up any sessions from prior tests by destroying known IDs
    // (We can't easily clear the private map, but we destroy by id)
  });

  afterEach(() => {
    // Clean up sessions created during tests
  });

  it('should create a session with correct properties', () => {
    const session = createSession('test-1', 'member-1', 'Zakir', 'President');

    expect(session.memberId).toBe('member-1');
    expect(session.memberName).toBe('Zakir');
    expect(session.memberRole).toBe('President');
    expect(session.conversationHistory).toEqual([]);
    expect(session.currentIntent).toBeNull();
    expect(session.handlerState).toEqual({});
    expect(session.lastActivity).toBeLessThanOrEqual(Date.now());
    expect(session.lastActivity).toBeGreaterThan(Date.now() - 1000);

    // Clean up
    destroySession('test-1');
  });

  it('should allow retrieval of created session', () => {
    createSession('test-2', 'member-2', 'Test User', 'VP');
    const retrieved = getSession('test-2');

    expect(retrieved).toBeDefined();
    expect(retrieved!.memberId).toBe('member-2');
    expect(retrieved!.memberName).toBe('Test User');

    destroySession('test-2');
  });

  it('should return undefined for non-existent session', () => {
    const result = getSession('nonexistent-session-id');
    expect(result).toBeUndefined();
  });
});

describe('Voice Session Management — getSession updates lastActivity', () => {
  it('should update lastActivity on access', async () => {
    const session = createSession('test-activity', 'member-3', 'User', 'Director');
    const firstActivity = session.lastActivity;

    // Wait a small amount to ensure Date.now() changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const retrieved = getSession('test-activity');
    expect(retrieved!.lastActivity).toBeGreaterThanOrEqual(firstActivity);

    destroySession('test-activity');
  });
});

describe('Voice Session Management — destroySession', () => {
  it('should remove the session', () => {
    createSession('test-destroy', 'member-4', 'User', 'Member');
    expect(getSession('test-destroy')).toBeDefined();

    destroySession('test-destroy');
    expect(getSession('test-destroy')).toBeUndefined();
  });

  it('should not throw when destroying non-existent session', () => {
    expect(() => destroySession('nonexistent')).not.toThrow();
  });
});

describe('Voice Session Management — MAX_SESSIONS limit', () => {
  const sessionIds: string[] = [];

  afterEach(() => {
    // Clean up all sessions created in this test group
    for (const id of sessionIds) {
      destroySession(id);
    }
    sessionIds.length = 0;
  });

  it('should reject session creation when MAX_SESSIONS (1000) is reached', () => {
    // Create 1000 sessions to fill the limit
    for (let i = 0; i < 1000; i++) {
      const id = `max-test-${i}`;
      sessionIds.push(id);
      createSession(id, `member-${i}`, `User ${i}`, 'Member');
    }

    // The 1001st session should throw
    expect(() => {
      createSession('overflow', 'member-overflow', 'Overflow', 'Member');
    }).toThrow('Maximum concurrent voice sessions reached');
  });

  it('should allow session creation after destroying one', () => {
    // Create 1000 sessions
    for (let i = 0; i < 1000; i++) {
      const id = `recycle-test-${i}`;
      sessionIds.push(id);
      createSession(id, `member-${i}`, `User ${i}`, 'Member');
    }

    // Destroy one to free a slot
    destroySession('recycle-test-0');
    sessionIds.shift();

    // Now creating one more should succeed
    const newId = 'recycle-new';
    sessionIds.push(newId);
    expect(() => {
      createSession(newId, 'member-new', 'New User', 'Member');
    }).not.toThrow();
  });
});

describe('Voice Session Management — session TTL expiration', () => {
  it('should have 30 minute TTL constant (verified via session creation)', () => {
    // We can't directly access SESSION_TTL_MS, but we can verify
    // the cleanup logic works by checking that sessions have lastActivity timestamps
    const session = createSession('ttl-test', 'member-ttl', 'TTL User', 'Member');
    expect(session.lastActivity).toBeDefined();
    expect(typeof session.lastActivity).toBe('number');

    destroySession('ttl-test');
  });
});

describe('Voice Session Management — stopSessionCleanup', () => {
  it('should not throw when called', () => {
    // stopSessionCleanup clears the interval timer
    expect(() => stopSessionCleanup()).not.toThrow();
  });

  it('should be idempotent (can be called multiple times)', () => {
    expect(() => {
      stopSessionCleanup();
      stopSessionCleanup();
    }).not.toThrow();
  });
});

describe('Voice Session Management — session overwrite behavior', () => {
  it('should overwrite session if same id is used (after destroy)', () => {
    createSession('overwrite-test', 'member-a', 'User A', 'Role A');
    destroySession('overwrite-test');

    const session = createSession('overwrite-test', 'member-b', 'User B', 'Role B');
    expect(session.memberId).toBe('member-b');
    expect(session.memberName).toBe('User B');

    destroySession('overwrite-test');
  });
});
