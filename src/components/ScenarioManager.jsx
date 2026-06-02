import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Button, Chip, IconButton } from '../ui/index.js';

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

function ScenarioRowMenu({ scenario, onEdit, onFork, onDelete, onRestoreOverride, hasOverride }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="scenario-row-menu" ref={rootRef}>
      <IconButton
        variant="ghost"
        className="scenario-row-menu-trigger"
        label={`${scenario.name} 的操作`}
        active={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </IconButton>
      {open && (
        <div className="scenario-row-menu-panel" role="menu">
          <Button type="button" variant="ghost" size="sm" role="menuitem" onClick={() => { onEdit(); setOpen(false); }}>编辑</Button>
          <Button type="button" variant="ghost" size="sm" role="menuitem" onClick={() => { onFork(); setOpen(false); }}>复制</Button>
          <Button type="button" variant="ghost" size="sm" role="menuitem" onClick={() => { onDelete(); setOpen(false); }}>删除</Button>
          {hasOverride && (
            <Button type="button" variant="ghost" size="sm" role="menuitem" onClick={() => { onRestoreOverride(); setOpen(false); }}>还原</Button>
          )}
        </div>
      )}
    </div>
  );
}

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
    const mod = PRESETS[draft.presetId]?.moderator;
    if (id === mod) return;
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
            <Button type="button" variant="ghost" size="sm" className="scenario-guide-link" onClick={openGuidePage}>
              如何编写场景（说明页）→
            </Button>
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        </header>

        {showTips && (
          <aside className="scenario-tips" aria-label="编写提示">
            <p><b>快速提示</b>：先选审议预设，再写 2–4 句默认议题（背景 + 约束 + 待决问题）。</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowTips(false)}>收起</Button>
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
                <ScenarioRowMenu
                  scenario={s}
                  hasOverride={Boolean(s.builtin && s.overridden)}
                  onEdit={() => startEdit(s)}
                  onFork={() => handleFork(s)}
                  onDelete={() => handleDelete(s)}
                  onRestoreOverride={() => onSaveScenarioPrefs(clearBuiltinOverride(scenarioPrefs, s.id))}
                />
              </div>
            ))}
            {hiddenBuiltins.length > 0 && (
              <div className="scenario-hidden">
                <p className="scenario-hidden-label">已隐藏的内置场景</p>
                {hiddenBuiltins.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestoreBuiltin(id)}
                  >
                    恢复 {id.replace('builtin:', '')}
                  </Button>
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
                      <Chip
                        key={p.id}
                        active={on}
                        disabled={mod === p.id}
                        onClick={() => toggleParticipant(p.id)}
                      >
                        {p.name}{mod === p.id ? '（主持）' : ''}
                      </Chip>
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
                <Button type="submit" variant="primary">保存场景</Button>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>取消</Button>
              </div>
            </form>
          )}
        </div>

        <footer className="modal-foot">
          <Button type="button" variant="ghost" onClick={startCreate}>新建场景</Button>
          <Button type="button" variant="ghost" onClick={openGuidePage}>编写说明</Button>
          <Button
            type="button"
            variant="ghost"
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
          </Button>
          <Button type="button" variant="ghost" onClick={handleImport}>导入 JSON</Button>
        </footer>
      </div>
    </div>
  );
}