import { useCallback, useRef, useState } from 'react';
import {
  advanceDeliberationSessionRequest,
  createDeliberationSessionRequest,
  createMeetingRequest,
  injectDeliberationSessionRequest,
  pauseDeliberationSessionRequest,
  resumeDeliberationSessionRequest,
} from '../services/roundtableApi.js';

/**
 * 1.5.1 分阶段审议：创建会话、推进、暂停、注入
 */
export function useSteppedDeliberation() {
  const abortRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('');
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
    setPaused(false);
    setSessionId(null);
    setSteps([]);
    setStepIndex(0);
    setCurrentLabel('');
  }, []);

  const runAdvanceLoop = useCallback(async (sid, { signal } = {}) => {
    let meeting = null;
    for (;;) {
      if (signal?.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }
      const status = await advanceDeliberationSessionRequest(sid, { signal });
      setStepIndex(status.stepIndex ?? 0);
      setCurrentLabel(status.currentLabel || status.currentStep || '');
      if (status.waiting === 'paused' || status.paused) {
        setPaused(true);
        setRunning(false);
        return { paused: true, meeting: status.meeting };
      }
      if (status.completed && status.meeting) {
        meeting = status.meeting;
        break;
      }
      if (status.stepIndex >= (status.totalSteps ?? 1) - 1 && !status.completed) break;
    }
    setRunning(false);
    setPaused(false);
    if (meeting) {
      setSessionId(null);
      setSteps([]);
      setStepIndex(0);
      setCurrentLabel('');
    }
    return { paused: false, meeting };
  }, []);

  const start = useCallback(async ({
    meetingPayload,
    useStepped = true,
    signal: externalSignal,
  } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = externalSignal ?? controller.signal;

    setRunning(true);
    setPaused(false);

    try {
      if (!useStepped) {
        const meeting = await createMeetingRequest({ payload: meetingPayload, signal });
        setRunning(false);
        return { meeting, stepped: false };
      }

      const sessionInfo = await createDeliberationSessionRequest(meetingPayload);
      setSessionId(sessionInfo.sessionId);
      setSteps(sessionInfo.steps ?? []);
      setStepIndex(0);
      setCurrentLabel(sessionInfo.steps?.[0]?.label || '准备');

      const result = await runAdvanceLoop(sessionInfo.sessionId, { signal });
      if (result.paused) {
        return { paused: true, sessionId: sessionInfo.sessionId, meeting: result.meeting };
      }
      if (!result.meeting) throw new Error('审议未完成，请重试');
      return { meeting: result.meeting, stepped: true };
    } catch (e) {
      setRunning(false);
      if (e?.name !== 'AbortError') {
        setSessionId(null);
        setSteps([]);
      }
      throw e;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [runAdvanceLoop]);

  const pause = useCallback(async () => {
    if (!sessionId) return;
    await pauseDeliberationSessionRequest(sessionId);
    setPaused(true);
    setRunning(false);
  }, [sessionId]);

  const resume = useCallback(async ({ inject, constraints, directive } = {}) => {
    if (!sessionId) return null;
    setRunning(true);
    setPaused(false);
    if (inject) {
      await injectDeliberationSessionRequest(sessionId, { constraints, directive });
    }
    await resumeDeliberationSessionRequest(sessionId);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      return await runAdvanceLoop(sessionId, { signal: controller.signal });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [sessionId, runAdvanceLoop]);

  return {
    sessionId,
    steps,
    stepIndex,
    currentLabel,
    paused,
    running,
    start,
    pause,
    resume,
    cancel,
    setSessionId,
    setSteps,
    setStepIndex,
    setCurrentLabel,
    setPaused,
    setRunning,
  };
}