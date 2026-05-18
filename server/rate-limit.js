export function createFixedWindowRateLimit({
  max = 8,
  windowMs = 60_000,
  path = '/api/meetings',
  message = '请求太频繁，请稍后再试',
  store = new Map(),
} = {}) {
  return function fixedWindowRateLimit(req, res, next) {
    if (req.path !== path) return next();

    const now = Date.now();
    const key = req.ip || 'local';
    const current = store.get(key) ?? { resetAt: now + windowMs, count: 0 };

    if (store.size > 5000) {
      for (const [windowKey, value] of store.entries()) {
        if (now > value.resetAt) store.delete(windowKey);
      }
    }

    if (now > current.resetAt) {
      current.resetAt = now + windowMs;
      current.count = 0;
    }

    current.count += 1;
    store.set(key, current);

    if (current.count > max) {
      return res.status(429).json({ error: message });
    }

    return next();
  };
}
