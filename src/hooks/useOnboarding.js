import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

export const ONBOARDING_TOTAL_STEPS = 4;

/**
 * Pure visibility rule for the first-run wizard (unit-tested).
 */
export function getOnboardingShouldShow({ done, viewMode, health, step, totalSteps = ONBOARDING_TOTAL_STEPS }) {
  if (done || viewMode !== 'workspace') return false;
  if (!health) return false;
  if (!health.aiConfigured) return true;
  const safeStep = Number(step) || 0;
  return safeStep < totalSteps;
}

export function useOnboarding({ health, viewMode }) {
  const [step, setStep] = useLocalStorage('roundtable:onboardingStep', 0);
  const [done, setDone] = useLocalStorage('roundtable:onboardingDone', false);

  const shouldShow = useMemo(
    () => getOnboardingShouldShow({ done, viewMode, health, step, totalSteps: ONBOARDING_TOTAL_STEPS }),
    [done, viewMode, health, step],
  );

  const advance = useCallback(() => {
    setStep((prev) => Math.min(ONBOARDING_TOTAL_STEPS - 1, (Number(prev) || 0) + 1));
  }, [setStep]);

  const complete = useCallback(() => {
    setDone(true);
    setStep(ONBOARDING_TOTAL_STEPS - 1);
  }, [setDone, setStep]);

  const skip = useCallback(() => {
    setDone(true);
  }, [setDone]);

  return {
    step: Number(step) || 0,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    shouldShow,
    advance,
    complete,
    skip,
    setStep,
  };
}