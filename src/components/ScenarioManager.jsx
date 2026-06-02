import { useMemo, useState } from 'react';
import { PERSONAS, PRESETS } from '../data/personas.js';
import { SCENARIO_GUIDE, SCENARIO_TOPIC_PLACEHOLDER } from '../data/scenarioGuide.js';
import {
  clearBuiltinOverride,
  exportUserScenariosJson,
  forkScenarioAsUser,
  hideBuiltinScenario,
  importUserScenariosJson,
  listScenarios,
  normalizeUserScenario,
  removeUserScenario,
  restoreBuiltinScenario,
  setBuiltinOverride,
  upsertUserScenario,
  validateScenarioForSave,
} from '../lib/scenarios.js';
import { getLandingPath } from '../lib/landingRoutes.js';

const EMPTY_DRAFT = {
  id: '',
  name: '',
  description: '',
  icon: '自',
  topicTemplate: '',
  presetId: 'product',
  customParticipants: [],
  builtin: false,
  builtinId: null,
};

export function ScenarioManager({
  open,
  lang = 'zh',
  userScenarios,
  scenarioPrefs,
  selectedScenarioId,
  onClose,
  onSaveUserScenarios,
  onSaveScenarioPrefs,
  onSelectScenario,
}) {
  const guide = SCENARIO_GUIDE[lang] ?? SCENARIO_GUIDE.zh;
  const topicPlaceholder = SCENARIO_TOPIC_PLACEHOLDER[lang] ?? SCENARIO_TOPIC_PLACEHOLDER.zh;
  const allScenarios = useMemo(
    () => listScenarios(userScenarios, scenarioPrefs),
    [userScenarios, scenarioPrefs],
  );
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState('');
  const [showTips, setShowTips] = useState(true);

  if (!open) return null;

  const openGuidePage = () => {
    const path = getLandingPath('scenarioGuide');
    if (typeof window !== 'undefined') {
      window.open(path, '_blank', 'noopener');
    }
  };

  const startEdit = (scenario) => {
    setDraft({
      ...EMPTY_DRAFT,
      ...scenario,
      builtinId: scenario.builtin ? scenario.id : null,
      customParticipants: scenario.customParticipants ? [...scenario.customParticipants] : [],
    });
    setFormError('');
  };

  const startCreate = () => {
    setDraft({ ...EMPTY_DRAFT, id: '' });
    setFormError('');
  };

  const saveDraft = () => {
    try {
      if (draft.builtinId) {
        const nextPrefs = setBuiltinOverride(scenarioPrefs, draft.builtinId, draft);
        onSaveScenarioPrefs(nextPrefs);
        onSelectScenario(draft.builtinId);
      } else {
        const next = upsertUserScenario(userScenarios, draft);
        onSaveUserScenarios(next);
        const saved = listScenarios(next, scenarioPrefs).find((s) => s.name === draft.name.trim());
        if (saved) onSelectScenario(saved.id);
      }
      setDraft(null);
      setFormError('');
    } catch (e) {
      setFormError(e.message || '保存失败');
    }
  };

  const handleDelete = (scenario) => {
    if (scenario.builtin) {
      onSaveScenarioPrefs(hideBuiltinScenario(scenarioPrefs, scenario.id));
      if (selectedScenarioId === scenario.id) {
        const rest = listScenarios(userScenarios, hideBuiltinScenario(scenarioPrefs, scenario.id));
        if (rest[0]) onSelectScenario(rest[0].id);
      }
      return;
    }
    onSaveUserScenarios(removeUserScenario(userScenarios, scenario.id));
  };

  const handleRestoreBuiltin = (builtinId) => {
    onSaveScenarioPrefs(restoreBuiltinScenario(scenarioPrefs, builtinId));
  };

  const handleFork = (scenario) => {
    try {
      const forked = forkScenarioAsUser(scenario);
      const next = upsertUserScenario(userScenarios, forked);
      onSaveUserScenarios(next);
      const saved = listScenarios(next, scenarioPrefs).find((s) => s.id === forked.id);
      if (saved) onSelectScenario(saved.id);
      startEdit(saved || forked);
    } catch (e) {
      setFormError(e.message || '复制失败');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importUserScenariosJson(text);
        onSaveUserScenarios(imported);
        setFormError('');
      } catch (e) {
        setFormError(e.message || '导入失败');
      }
    };
    input.click();
  };

  const toggleParticipant = (id) => {
    const preset = PRESETS[draft.presetId] ?? PRESETS.product;
    if (id === preset.moderator) return;
    setDraft((prev) => {
      const set = new Set(prev.customParticipants || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, customParticipants: [...set] };
    });
  };

  const draftErrors = draft ? validateScenarioForSave(normalizeUserScenario({ ...draft, builtin: false })) : [];
  const hiddenBuiltins = scenarioPrefs?.hiddenBuiltinIds ?? [];

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel scenario-manager"
        role="dialog"
        aria-labelledby="scenario-manager-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="scenario-manager-title">审议场景</h2>
          <p className="modal-lead">
            场景支持增删改：内置可编辑覆盖或隐藏；自定义场景可完全管理。
            <button type="button" className="scenario-guide-link btn btn-ghost btn-sm" onClick={openGuidePage}>
              如何编写场景（说明页）→
            </button>
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>关闭</button>
        </header>

        {showTips && (
          <aside className="scenario-tips" aria-label="编写提示">
            <p><b>快速提示</b>：先选审议预设，再写 2–4 句默认议题（背景 + 约束 + 待决问题）。</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTips(false)}>收起</button>
          </aside>
        )}

        <div className="scenario-manager-body">
          <div className="scenario-list">
            {allScenarios.map((s) => (
              <div
                key={s.id}
                className={`scenario-row${selectedScenarioId === s.id ? ' is-active' : ''}${s.builtin ? ' is-builtin' : ''}`}
              >
                <button
                  type="button"
                  className="scenario-row-main btn btn-ghost"
                  onClick={() => onSelectScenario(s.id)}
                >
                  <span className="scenario-icon">{s.icon}</span>
                  <span>
                    <b>{s.name}</b>
                    <small>
                      {s.description || PRESETS[s.presetId]?.name}
                      {s.builtin && s.overridden ? ' · 已自定义' : ''}
                      {s.builtin && !s.overridden ? ' · 内置' : ''}
                    </small>
                  </span>
                </button>
                <div className="scenario-row-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>编辑</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleFork(s)}>复制</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(s)}>删除</button>
                  {s.builtin && s.overridden && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSaveScenarioPrefs(clearBuiltinOverride(scenarioPrefs, s.id))}
                    >
                      还原
                    </button>
                  )}
                </div>
              </div>
            ))}
            {hiddenBuiltins.length > 0 && (
              <div className="scenario-hidden">
                <p className="scenario-hidden-label">已隐藏的内置场景</p>
                {hiddenBuiltins.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRestoreBuiltin(id)}
                  >
                    恢复 {id.replace('builtin:', '')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {draft && (
            <form
              className="scenario-form"
              onSubmit={(e) => { e.preventDefault(); saveDraft(); }}
            >
              <h3>
                {draft.builtinId ? '编辑内置场景（保存为覆盖）' : draft.id ? '编辑我的场景' : '新建场景'}
              </h3>
              <label>
                名称
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              </label>
              <label>
                图标（1–2 字）
                <input value={draft.icon} maxLength={2} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
              </label>
              <label>
                说明
                <textarea value={draft.description} rows={2} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="给谁用、解决什么决策（可选）" />
              </label>
              <label>
                默认议题
                <textarea
                  value={draft.topicTemplate}
                  rows={4}
                  onChange={(e) => setDraft({ ...draft, topicTemplate: e.target.value })}
                  placeholder={topicPlaceholder}
                />
                <span className="scenario-field-hint">{guide.sections[1]?.body}</span>
              </label>
              <label>
                审议预设
                <select value={draft.presetId} onChange={(e) => setDraft({ ...draft, presetId: e.target.value, customParticipants: [] })}>
                  {Object.values(PRESETS).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>自定义席位（可选，须含主持人）</legend>
                <div className="scenario-roster-chips">
                  {Object.values(PERSONAS).map((p) => {
                    const mod = PRESETS[draft.presetId]?.moderator;
                    const on = mod === p.id || (draft.customParticipants || []).includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`btn btn-ghost btn-sm${on ? ' active' : ''}`}
                        disabled={mod === p.id}
                        onClick={() => toggleParticipant(p.id)}
                      >
                        {p.name}{mod === p.id ? '（主持）' : ''}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <ul className="scenario-checklist">
                {guide.checklist.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {(formError || draftErrors.length > 0) && (
                <p className="scenario-form-error">{formError || draftErrors.join('；')}</p>
              )}
              <div className="scenario-form-actions">
                <button type="submit" className="btn btn-primary">保存场景</button>
                <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>取消</button>
              </div>
            </form>
          )}
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={startCreate}>新建场景</button>
          <button type="button" className="btn btn-ghost" onClick={openGuidePage}>编写说明</button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const blob = new Blob([exportUserScenariosJson(userScenarios)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'roundtable-scenarios.json';
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            导出 JSON
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleImport}>导入 JSON</button>
        </footer>
      </div>
    </div>
  );
}