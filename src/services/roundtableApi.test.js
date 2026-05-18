import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMeetingRequest } from './roundtableApi.js';

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
