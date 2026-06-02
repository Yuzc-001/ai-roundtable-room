import { describe, expect, test } from 'vitest';
import { MIN_ENV_SNIPPET, SETUP_STEPS } from './setup.js';

describe('setup helpers', () => {
  test('exposes minimal env snippet aligned with .env.example step 1', () => {
    expect(MIN_ENV_SNIPPET).toContain('AI_PROVIDERS=openai');
    expect(MIN_ENV_SNIPPET).toContain('OPENAI_API_KEY=');
    expect(MIN_ENV_SNIPPET).toContain('OPENAI_MODEL=gpt-5.5');
  });

  test('lists actionable setup steps for first-run users', () => {
    expect(SETUP_STEPS.length).toBeGreaterThanOrEqual(3);
    expect(SETUP_STEPS.join(' ')).toContain('doctor');
  });
});