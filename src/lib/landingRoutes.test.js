import { describe, expect, test } from 'vitest';
import { getLandingPageFromPath, getLandingPath, isWorkbenchPath } from './landingRoutes.js';

describe('landingRoutes', () => {
  test('maps paths to landing pages', () => {
    expect(getLandingPageFromPath('/')).toBe('home');
    expect(getLandingPageFromPath('/scenarios')).toBe('scenarios');
    expect(getLandingPageFromPath('/workflow')).toBe('workflow');
    expect(getLandingPageFromPath('/faq')).toBe('faq');
    expect(getLandingPageFromPath('/updates')).toBe('updates');
    expect(getLandingPageFromPath('/unknown')).toBe('home');
  });

  test('resolves landing paths', () => {
    expect(getLandingPath('faq')).toBe('/faq');
    expect(getLandingPath('updates')).toBe('/updates');
  });

  test('detects workbench path', () => {
    expect(isWorkbenchPath('/app')).toBe(true);
    expect(isWorkbenchPath('/')).toBe(false);
  });
});