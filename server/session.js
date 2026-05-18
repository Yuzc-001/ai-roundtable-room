import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'roundtable_session';

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        if (index < 0) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionToken({ secret, maxAgeMs, now = Date.now() }) {
  const expiresAt = now + maxAgeMs;
  const payload = `v1.${expiresAt}.${randomBytes(12).toString('base64url')}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token, { secret, now = Date.now() }) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const payload = parts.slice(0, 3).join('.');
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || now > expiresAt) return false;
  return safeEqual(parts[3], sign(payload, secret));
}

export function hasValidSession(req, config) {
  const token = parseCookies(req.get('cookie'))[SESSION_COOKIE];
  return verifySessionToken(token, { secret: config.security.sessionSecret });
}

export function buildSessionCookie(token, config) {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(config.security.sessionMaxAgeMs / 1000)}`,
  ];
  if (config.isProduction) attrs.push('Secure');
  return attrs.join('; ');
}
