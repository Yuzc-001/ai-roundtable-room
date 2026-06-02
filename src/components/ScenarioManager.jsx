import { useMemo, useState } from 'react';
import { PERSONAS, PRESETS } from '../data/personas.js';
import {
  exportUserScenariosJson,
  importUserScenariosJson,
  listScenarios,
  normalizeUserScenario,
  removeUserScenario,
  upsertUserScenario,
  validateScenarioForSave,
} from '../lib/scenarios.js';

const EMPTY_DRAFT = {
  id: '',
  name: '',
  description: '',
  icon: '自',
  topicTemplate: '',
  presetId: 'product',
  customParticipants: [],
};

export function ScenarioManager({
  open,
  userScenarios,
  selectedScenarioId,
  onClose,
  onSaveUserScenarios,
  onSelectScenario,
}) {
  const allScenarios = useMemo(() => listScenarios(userScenarios), [userScenarios]);
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState('');

  if (!open) return null;

  const startEdit = (scenario) => {
    if (scenario?.builtin) return;
    setDraft({
      ...EMPTY_DRAFT,
      ...scenario,
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
      const next = upsertUserScenario(userScenarios, draft);
      onSaveUserScenarios(next);
      const saved = listScenarios(next).find((s) => s.name === draft.name.trim());
      if (saved) onSelectScenario(saved.id);
      setDraft(null);
      setFormError('');
    } catch (e) {
      setFormError(e.message || '保存失败');
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

  const draftErrors = draft ? validateScenarioForSave(normalizeUserScenario(draft)) : [];

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
          <p className="modal-lead">内置场景来自系统预设；你可新增自己的场景（议题骨架 + 席位 + 协议）。</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>关闭</button>
        </header>

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
                    <small>{s.description || PRESETS[s.presetId]?.name}</small>
                  </span>
                </button>
                {!s.builtin && (
                  <div className="scenario-row-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>编辑</button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSaveUserScenarios(removeUserScenario(userScenarios, s.id))}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {draft && (
            <form
              className="scenario-form"
              onSubmit={(e) => { e.preventDefault(); saveDraft(); }}
            >
              <h3>{draft.id ? '编辑场景' : '新建场景'}</h3>
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
                <textarea value={draft.description} rows={2} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </label>
              <label>
                默认议题
                <textarea value={draft.topicTemplate} rows={3} onChange={(e) => setDraft({ ...draft, topicTemplate: e.target.value })} placeholder="发起审议时填入议题框" />
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