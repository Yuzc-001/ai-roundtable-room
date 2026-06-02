import { describe, expect, test } from 'vitest';
import { getOnboardingShouldShow, ONBOARDING_TOTAL_STEPS } from './useOnboarding.js';

const healthReady = { ok: true, aiConfigured: true, providerName: 'OpenAI', model: 'gpt-5.5' };
const healthDemo = { ok: true, aiConfigured: false };

describe('getOnboardingShouldShow', () => {
  test('hides when onboarding marked done', () => {
    expect(getOnboardingShouldShow({
      done: true,
      viewMode: 'workspace',
      health: healthReady,
      step: 0,
    })).toBe(false);
  });

  test('hides outside workspace', () => {
    expect(getOnboardingShouldShow({
      done: false,
      viewMode: 'landing',
      health: healthReady,
      step: 0,
    })).toBe(false);
  });

  test('hides until health payload is available', () => {
    expect(getOnboardingShouldShow({
      done: false,
      viewMode: 'workspace',
      health: null,
      step: 0,
    })).toBe(false);
  });

  test('always shows when API is not configured', () => {
    expect(getOnboardingShouldShow({
      done: false,
      viewMode: 'workspace',
      health: healthDemo,
      step: 2,
    })).toBe(true);
  });

  test('shows final step when AI is configured', () => {
    const lastStep = ONBOARDING_TOTAL_STEPS - 1;
    expect(getOnboardingShouldShow({
      done: false,
      viewMode: 'workspace',
      health: healthReady,
      step: lastStep,
    })).toBe(true);
  });

  test('hides after last step index when AI is configured', () => {
    expect(getOnboardingShouldShow({
      done: false,
      viewMode: 'workspace',
      health: healthReady,
      step: ONBOARDING_TOTAL_STEPS,
    })).toBe(false);
  });
});