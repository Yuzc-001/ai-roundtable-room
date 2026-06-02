import { PRESETS } from '../../shared/personas.js';

const USER_ID_PREFIX = 'user-';
const BUILTIN_PREFIX = 'builtin:';

export function buildBuiltinScenarios(presets = PRESETS) {
  return Object.values(presets).map((p) => ({
    id: `${BUILTIN_PREFIX}${p.id}`,
    name: p.name,
    description: p.description || '',
    icon: p.icon || '议',
    topicTemplate: '',
    presetId: p.id,
    customParticipants: null,
    builtin: true,
  }));
}

export function createUserScenarioId() {
  return `${USER_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUserScenario(raw) {
  const presetId = PRESETS[raw?.presetId] ? raw.presetId : 'product';
  const customParticipants = Array.isArray(raw?.customParticipants)
    ? raw.customParticipants.filter((id) => typeof id === 'string' && id.trim())
    : null;
  return {
    id: raw?.id && String(raw.id).startsWith(USER_ID_PREFIX) ? String(raw.id) : createUserScenarioId(),
    name: String(raw?.name || '未命名场景').trim().slice(0, 40) || '未命名场景',
    description: String(raw?.description || '').trim().slice(0, 200),
    icon: String(raw?.icon || '自').trim().slice(0, 2) || '自',
    topicTemplate: String(raw?.topicTemplate || '').trim().slice(0, 500),
    presetId,
    customParticipants: customParticipants?.length ? customParticipants : null,
    builtin: false,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeScenarioPrefs(raw) {
  const hiddenBuiltinIds = Array.isArray(raw?.hiddenBuiltinIds)
    ? raw.hiddenBuiltinIds.filter((id) => typeof id === 'string')
    : [];
  const builtinOverrides = raw?.builtinOverrides && typeof raw.builtinOverrides === 'object'
    ? raw.builtinOverrides
    : {};
  return { hiddenBuiltinIds, builtinOverrides };
}

function applyBuiltinOverride(builtin, override) {
  if (!override || typeof override !== 'object') return builtin;
  return {
    ...builtin,
    name: override.name != null ? String(override.name).trim().slice(0, 40) || builtin.name : builtin.name,
    description: override.description != null ? String(override.description).trim().slice(0, 200) : builtin.description,
    icon: override.icon != null ? String(override.icon).trim().slice(0, 2) || builtin.icon : builtin.icon,
    topicTemplate: override.topicTemplate != null ? String(override.topicTemplate).trim().slice(0, 500) : builtin.topicTemplate,
    presetId: PRESETS[override.presetId] ? override.presetId : builtin.presetId,
    customParticipants: Array.isArray(override.customParticipants) && override.customParticipants.length
      ? override.customParticipants.filter((id) => typeof id === 'string')
      : builtin.customParticipants,
    builtin: true,
    overridden: true,
  };
}

export function listScenarios(userScenarios = [], prefs = {}) {
  const { hiddenBuiltinIds, builtinOverrides } = normalizeScenarioPrefs(prefs);
  const hidden = new Set(hiddenBuiltinIds);
  const builtins = buildBuiltinScenarios()
    .filter((b) => !hidden.has(b.id) && !hidden.has(b.presetId))
    .map((b) => applyBuiltinOverride(b, builtinOverrides[b.id]));
  const user = (Array.isArray(userScenarios) ? userScenarios : [])
    .map(normalizeUserScenario)
    .filter((s) => !s.builtin);
  return [...builtins, ...user];
}

export function setBuiltinOverride(prefs, builtinId, patch) {
  const base = normalizeScenarioPrefs(prefs);
  const builtin = buildBuiltinScenarios().find((b) => b.id === builtinId);
  if (!builtin) throw new Error('无效的内置场景');
  const merged = applyBuiltinOverride(builtin, patch);
  const errors = validateScenarioForSave(merged);
  if (errors.length) throw new Error(errors.join('；'));
  return {
    ...base,
    builtinOverrides: {
      ...base.builtinOverrides,
      [builtinId]: {
        name: merged.name,
        description: merged.description,
        icon: merged.icon,
        topicTemplate: merged.topicTemplate,
        presetId: merged.presetId,
        customParticipants: merged.customParticipants,
      },
    },
  };
}

export function clearBuiltinOverride(prefs, builtinId) {
  const base = normalizeScenarioPrefs(prefs);
  const { [builtinId]: _, ...rest } = base.builtinOverrides;
  return { ...base, builtinOverrides: rest };
}

export function hideBuiltinScenario(prefs, builtinId) {
  const base = normalizeScenarioPrefs(prefs);
  const ids = new Set(base.hiddenBuiltinIds);
  ids.add(builtinId);
  const cleared = clearBuiltinOverride(base, builtinId);
  return { ...cleared, hiddenBuiltinIds: [...ids] };
}

export function restoreBuiltinScenario(prefs, builtinId) {
  const base = normalizeScenarioPrefs(prefs);
  const hiddenBuiltinIds = base.hiddenBuiltinIds.filter((id) => id !== builtinId);
  const cleared = clearBuiltinOverride({ ...base, hiddenBuiltinIds }, builtinId);
  return cleared;
}

export function forkScenarioAsUser(scenario) {
  return normalizeUserScenario({
    name: `${scenario.name}（我的副本）`,
    description: scenario.description,
    icon: scenario.icon,
    topicTemplate: scenario.topicTemplate,
    presetId: scenario.presetId,
    customParticipants: scenario.customParticipants,
  });
}

export function findScenario(scenarios, scenarioId) {
  return scenarios.find((s) => s.id === scenarioId) || null;
}

export function resolveScenarioPreset(scenario, presets = PRESETS) {
  if (!scenario) return presets.product;
  return presets[scenario.presetId] ?? presets.product;
}

/** Roster for API payload — respects customParticipants on user scenarios */
export function getScenarioRoster({ scenario, personas, presets = PRESETS }) {
  const preset = resolveScenarioPreset(scenario, presets);
  const ids = scenario?.customParticipants?.length
    ? [preset.moderator, ...scenario.customParticipants.filter((id) => id !== preset.moderator)]
    : [preset.moderator, ...preset.participants];
  return ids.map((id) => personas[id]).filter(Boolean);
}

export function applyScenarioToWorkbench(scenario) {
  if (!scenario) return { presetId: 'product', topic: '' };
  return {
    presetId: scenario.presetId || 'product',
    topic: scenario.topicTemplate || '',
  };
}

export function validateScenarioForSave(scenario) {
  const errors = [];
  if (!scenario.name?.trim()) errors.push('场景名称不能为空');
  if (!PRESETS[scenario.presetId]) errors.push('请选择有效审议预设');
  if (scenario.customParticipants?.length) {
    const mod = PRESETS[scenario.presetId]?.moderator;
    if (!scenario.customParticipants.includes(mod)) {
      errors.push('自定义席位须包含该预设的主持人');
    }
  }
  return errors;
}

export function exportUserScenariosJson(userScenarios) {
  const list = (Array.isArray(userScenarios) ? userScenarios : []).map(normalizeUserScenario);
  return JSON.stringify({ version: 1, scenarios: list }, null, 2);
}

export function importUserScenariosJson(text) {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : parsed?.scenarios;
  if (!Array.isArray(arr)) throw new Error('文件格式无效：需要 scenarios 数组');
  return arr.map(normalizeUserScenario);
}

export function upsertUserScenario(userScenarios, scenario) {
  const next = normalizeUserScenario(scenario);
  const errors = validateScenarioForSave(next);
  if (errors.length) throw new Error(errors.join('；'));
  const list = Array.isArray(userScenarios) ? [...userScenarios] : [];
  const idx = list.findIndex((s) => s.id === next.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...next, createdAt: list[idx].createdAt };
  else list.unshift(next);
  return list;
}

export function removeUserScenario(userScenarios, scenarioId) {
  return (Array.isArray(userScenarios) ? userScenarios : []).filter((s) => s.id !== scenarioId);
}