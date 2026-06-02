import { describe, expect, test } from 'vitest';
import { PRESETS } from '../../shared/personas.js';
import {
  buildBuiltinScenarios,
  exportUserScenariosJson,
  getScenarioRoster,
  importUserScenariosJson,
  listScenarios,
  normalizeUserScenario,
  upsertUserScenario,
} from './scenarios.js';

describe('scenarios', () => {
  test('builtins cover all presets', () => {
    const builtins = buildBuiltinScenarios();
    expect(builtins.length).toBe(Object.keys(PRESETS).length);
    expect(builtins.every((s) => s.builtin)).toBe(true);
  });

  test('user scenario round-trip import', () => {
    const user = [normalizeUserScenario({
      name: '供应链',
      presetId: 'legal',
      topicTemplate: '审计问题',
    })];
    const json = exportUserScenariosJson(user);
    const imported = importUserScenariosJson(json);
    expect(imported[0].name).toBe('供应链');
    expect(imported[0].presetId).toBe('legal');
  });

  test('customParticipants roster', () => {
    const personas = { du: { id: 'du' }, li: { id: 'li' }, heng: { id: 'heng' } };
    const scenario = normalizeUserScenario({
      name: '精简席',
      presetId: 'legal',
      customParticipants: ['li', 'heng'],
    });
    const roster = getScenarioRoster({ scenario, personas });
    expect(roster.map((p) => p.id)).toEqual(['du', 'li', 'heng']);
  });

  test('listScenarios merges user after builtins', () => {
    const all = listScenarios([{ name: '自定义', presetId: 'product' }]);
    expect(all.length).toBe(Object.keys(PRESETS).length + 1);
    expect(all.some((s) => s.name === '自定义' && !s.builtin)).toBe(true);
  });

  test('upsertUserScenario rejects roster without moderator', () => {
    expect(() => upsertUserScenario([], {
      name: '精简',
      presetId: 'legal',
      customParticipants: ['li'],
    })).toThrow(/主持人/);
  });
});