import { describe, expect, test } from 'vitest';
import {
  formatHealthCheckError,
  getVerifyStepContinueLabel,
  isVerifyStepContinueDisabled,
  mergeHealthOnCheckFailure,
} from './healthCheck.js';

describe('healthCheck helpers', () => {
  test('mergeHealthOnCheckFailure keeps prior aiConfigured and provider fields', () => {
    const prev = {
      ok: true,
      aiConfigured: true,
      providerName: 'OpenAI',
      model: 'gpt-5.5',
    };
    expect(mergeHealthOnCheckFailure(prev)).toEqual({
      ok: false,
      aiConfigured: true,
      providerName: 'OpenAI',
      model: 'gpt-5.5',
    });
  });

  test('mergeHealthOnCheckFailure without prior health returns ok false only', () => {
    expect(mergeHealthOnCheckFailure(null)).toEqual({ ok: false });
  });

  test('formatHealthCheckError prefers error message', () => {
    expect(formatHealthCheckError(new Error('network down'))).toBe('network down');
    expect(formatHealthCheckError(null)).toContain('/api/health');
  });

  test('verify step demo path is never blocked by disabled continue', () => {
    expect(isVerifyStepContinueDisabled()).toBe(false);
    expect(getVerifyStepContinueLabel(false)).toBe('暂不配置，进入演示步骤');
    expect(getVerifyStepContinueLabel(true)).toBe('继续');
  });
});