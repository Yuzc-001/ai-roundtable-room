import { describe, expect, test, vi } from 'vitest';
import { createFixedWindowRateLimit } from './rate-limit.js';

function runMiddleware(middleware, req = {}) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const next = vi.fn();
  middleware({ ip: '127.0.0.1', path: '/api/meetings', ...req }, res, next);
  return { res, next };
}

describe('createFixedWindowRateLimit', () => {
  test('allows requests until the configured max', () => {
    const middleware = createFixedWindowRateLimit({ max: 2, windowMs: 1000 });

    expect(runMiddleware(middleware).next).toHaveBeenCalledOnce();
    expect(runMiddleware(middleware).next).toHaveBeenCalledOnce();

    const third = runMiddleware(middleware);
    expect(third.next).not.toHaveBeenCalled();
    expect(third.res.statusCode).toBe(429);
  });

  test('does not rate-limit unrelated paths', () => {
    const middleware = createFixedWindowRateLimit({ max: 0, windowMs: 1000 });
    const result = runMiddleware(middleware, { path: '/api/health' });

    expect(result.next).toHaveBeenCalledOnce();
    expect(result.res.statusCode).toBe(200);
  });
});
