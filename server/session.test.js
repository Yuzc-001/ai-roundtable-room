import { describe, expect, test } from 'vitest';
import { buildSessionCookie, createSessionToken, SESSION_COOKIE, verifySessionToken } from './session.js';
import { loadConfig } from './config.js';

describe('session tokens', () => {
  test('verifies a valid signed token', () => {
    const token = createSessionToken({
      secret: 'secret',
      maxAgeMs: 1000,
      now: 100,
    });

    expect(verifySessionToken(token, { secret: 'secret', now: 500 })).toBe(true);
  });

  test('rejects expired or tampered tokens', () => {
    const token = createSessionToken({
      secret: 'secret',
      maxAgeMs: 1000,
      now: 100,
    });

    expect(verifySessionToken(token, { secret: 'secret', now: 1200 })).toBe(false);
    expect(verifySessionToken(`${token}x`, { secret: 'secret', now: 500 })).toBe(false);
  });

  test('builds an httpOnly cookie', () => {
    const config = loadConfig({ APP_ACCESS_CODE: 'private' });
    const cookie = buildSessionCookie('token', config);

    expect(cookie).toContain(`${SESSION_COOKIE}=token`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
});
