import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const TOTAL_STEPS = 4;

export function useOnboarding({ health, viewMode }) {
  const [step, setStep] = useLocalStorage('roundtable:onboardingStep', 0);
  const [done, setDone] = useLocalStorage('roundtable:onboardingDone', false);

  const shouldShow = useMemo(() => {
    if (done || viewMode !== 'workspace') return false;
    if (!health) return false;
    if (!health.aiConfigured) return true;
    return step < TOTAL_STEPS - 1;
  }, [done, viewMode, health, step]);

  const advance = useCallback(() => {
    setStep((prev) => Math.min(TOTAL_STEPS - 1, (Number(prev) || 0) + 1));
  }, [setStep]);

  const complete = useCallback(() => {
    setDone(true);
    setStep(TOTAL_STEPS - 1);
  }, [setDone, setStep]);

  const skip = useCallback(() => {
    setDone(true);
  }, [setDone]);

  return {
    step: Number(step) || 0,
    totalSteps: TOTAL_STEPS,
    shouldShow,
    advance,
    complete,
    skip,
    setStep,
  };
}