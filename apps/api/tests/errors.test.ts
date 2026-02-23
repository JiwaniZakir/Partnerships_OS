import { describe, it, expect } from 'vitest';
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ResearchError,
  NotionSyncError,
} from '../src/utils/errors.js';

describe('AppError — base error class', () => {
  it('should create an AppError with correct properties', () => {
    const err = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
  });

  it('should allow non-operational errors', () => {
    const err = new AppError('Critical failure', 500, 'INTERNAL_ERROR', false);
    expect(err.isOperational).toBe(false);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('test', 500, 'TEST');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('should have a proper stack trace', () => {
    const err = new AppError('test', 500, 'TEST');
    expect(err.stack).toBeDefined();
    // Stack trace should contain the error message
    expect(err.stack).toContain('test');
  });
});

describe('AuthError', () => {
  it('should have default message "Authentication required"', () => {
    const err = new AuthError();
    expect(err.message).toBe('Authentication required');
  });

  it('should allow custom message', () => {
    const err = new AuthError('Token expired');
    expect(err.message).toBe('Token expired');
  });

  it('should have statusCode 401', () => {
    const err = new AuthError();
    expect(err.statusCode).toBe(401);
  });

  it('should have code AUTH_ERROR', () => {
    const err = new AuthError();
    expect(err.code).toBe('AUTH_ERROR');
  });

  it('should extend AppError', () => {
    const err = new AuthError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(AuthError);
  });

  it('should be an instance of Error', () => {
    const err = new AuthError();
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ForbiddenError', () => {
  it('should have default message "Access denied"', () => {
    const err = new ForbiddenError();
    expect(err.message).toBe('Access denied');
  });

  it('should allow custom message', () => {
    const err = new ForbiddenError('Admin only');
    expect(err.message).toBe('Admin only');
  });

  it('should have statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('should have code FORBIDDEN', () => {
    const err = new ForbiddenError();
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should extend AppError', () => {
    const err = new ForbiddenError();
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  it('should always have message "Resource not found" regardless of args', () => {
    const err1 = new NotFoundError();
    expect(err1.message).toBe('Resource not found');

    const err2 = new NotFoundError('Contact');
    expect(err2.message).toBe('Resource not found');

    const err3 = new NotFoundError('Member', 'abc-123');
    expect(err3.message).toBe('Resource not found');
  });

  it('should not leak entity or id information in the message', () => {
    const err = new NotFoundError('SecretEntity', 'secret-id-12345');
    expect(err.message).not.toContain('SecretEntity');
    expect(err.message).not.toContain('secret-id-12345');
    expect(err.message).toBe('Resource not found');
  });

  it('should have statusCode 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('should have code NOT_FOUND', () => {
    const err = new NotFoundError();
    expect(err.code).toBe('NOT_FOUND');
  });

  it('should extend AppError', () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('should have the provided message', () => {
    const err = new ValidationError('Invalid email format');
    expect(err.message).toBe('Invalid email format');
  });

  it('should have statusCode 400', () => {
    const err = new ValidationError('Bad input');
    expect(err.statusCode).toBe(400);
  });

  it('should have code VALIDATION_ERROR', () => {
    const err = new ValidationError('Bad input');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should store optional details', () => {
    const details = { field: 'email', issue: 'required' };
    const err = new ValidationError('Validation failed', details);
    expect(err.details).toEqual(details);
  });

  it('should have undefined details when not provided', () => {
    const err = new ValidationError('Validation failed');
    expect(err.details).toBeUndefined();
  });

  it('should extend AppError', () => {
    const err = new ValidationError('Bad input');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('RateLimitError', () => {
  it('should have a message with "Rate limit exceeded"', () => {
    const err = new RateLimitError();
    expect(err.message).toContain('Rate limit exceeded');
  });

  it('should include retryAfter in message when provided', () => {
    const err = new RateLimitError(30);
    expect(err.message).toContain('Retry after 30s');
  });

  it('should not include retry info when no retryAfter', () => {
    const err = new RateLimitError();
    expect(err.message).not.toContain('Retry after');
  });

  it('should have statusCode 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
  });

  it('should have code RATE_LIMIT', () => {
    const err = new RateLimitError();
    expect(err.code).toBe('RATE_LIMIT');
  });

  it('should extend AppError', () => {
    const err = new RateLimitError();
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ResearchError', () => {
  it('should have the provided message', () => {
    const err = new ResearchError('LinkedIn API timeout');
    expect(err.message).toBe('LinkedIn API timeout');
  });

  it('should have statusCode 502', () => {
    const err = new ResearchError('fail');
    expect(err.statusCode).toBe(502);
  });

  it('should have code RESEARCH_ERROR', () => {
    const err = new ResearchError('fail');
    expect(err.code).toBe('RESEARCH_ERROR');
  });

  it('should extend AppError', () => {
    const err = new ResearchError('fail');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('NotionSyncError', () => {
  it('should have the provided message', () => {
    const err = new NotionSyncError('Notion rate limit');
    expect(err.message).toBe('Notion rate limit');
  });

  it('should have statusCode 502', () => {
    const err = new NotionSyncError('fail');
    expect(err.statusCode).toBe(502);
  });

  it('should have code NOTION_SYNC_ERROR', () => {
    const err = new NotionSyncError('fail');
    expect(err.code).toBe('NOTION_SYNC_ERROR');
  });

  it('should extend AppError', () => {
    const err = new NotionSyncError('fail');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('Error hierarchy — all errors extend AppError and Error', () => {
  const errors = [
    { name: 'AuthError', instance: new AuthError() },
    { name: 'ForbiddenError', instance: new ForbiddenError() },
    { name: 'NotFoundError', instance: new NotFoundError() },
    { name: 'ValidationError', instance: new ValidationError('test') },
    { name: 'RateLimitError', instance: new RateLimitError() },
    { name: 'ResearchError', instance: new ResearchError('test') },
    { name: 'NotionSyncError', instance: new NotionSyncError('test') },
  ];

  errors.forEach(({ name, instance }) => {
    it(`${name} should be instanceof AppError`, () => {
      expect(instance).toBeInstanceOf(AppError);
    });

    it(`${name} should be instanceof Error`, () => {
      expect(instance).toBeInstanceOf(Error);
    });

    it(`${name} should have isOperational = true`, () => {
      expect(instance.isOperational).toBe(true);
    });

    it(`${name} should have a numeric statusCode`, () => {
      expect(typeof instance.statusCode).toBe('number');
    });

    it(`${name} should have a non-empty code string`, () => {
      expect(typeof instance.code).toBe('string');
      expect(instance.code.length).toBeGreaterThan(0);
    });
  });
});
