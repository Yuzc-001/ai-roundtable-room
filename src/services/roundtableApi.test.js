import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMeetingRequest, getHealth } from './roundtableApi.js';

describe('createMeetingRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('passes abort signals to the meeting request', async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ title: '会议' }),
    });

    await createMeetingRequest({ payload: { topic: '测试' }, signal });

    expect(fetchMock).toHaveBeenCalledWith('/api/meetings', expect.objectContaining({ signal }));
  });
});

describe('getHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns parsed body when response is ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, aiConfigured: false }),
    });
    await expect(getHealth()).resolves.toEqual({ ok: true, aiConfigured: false });
  });

  test('throws with server error message when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: '服务暂不可用' }),
    });
    await expect(getHealth()).rejects.toThrow('服务暂不可用');
  });

  test('throws status fallback when error body is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    await expect(getHealth()).rejects.toThrow('健康检查失败 (500)');
  });
});
