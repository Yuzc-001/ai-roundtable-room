import { useMemo, useState } from 'react';
import { Button } from '../../ui/index.js';
import {
  addIntelDocumentToProject,
  createIntelDocument,
  getSelectedIntelDocuments,
  migrateProjectIntel,
  removeIntelDocumentFromProject,
  toggleIntelDocSelection,
} from '../../lib/intelDocuments.js';
import { retrieveIntelChunks } from '../../lib/intelRetrieval.js';

const TABS = [
  { id: 'library', label: '材料库' },
  { id: 'preview', label: '检索预览' },
  { id: 'url', label: '链接抓取' },
];

export function IntelWorkbench({
  project,
  topic = '',
  onPatchProject,
  intelUrl = '',
  onIntelUrlChange,
  onIngestUrl,
  ingesting = false,
  sessionSnippets = [],
}) {
  const [tab, setTab] = useState('library');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [previewDocId, setPreviewDocId] = useState(null);

  const base = useMemo(() => migrateProjectIntel(project), [project]);
  const selected = useMemo(() => getSelectedIntelDocuments(base), [base]);
  const previewHits = useMemo(() => {
    if (!topic.trim() || !selected.length) return [];
    return retrieveIntelChunks(selected, topic, 6);
  }, [topic, selected]);

  const addDoc = () => {
    try {
      const doc = createIntelDocument({
        title: title.trim() || '项目材料',
        text,
        source: '项目情报库',
      });
      onPatchProject((p) => addIntelDocumentToProject(p, doc));
      setTitle('');
      setText('');
      setTab('library');
    } catch (e) {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined') window.alert(e.message || '入库失败');
    }
  };

  const addDocFromText = (body, docTitle, source = '文件导入') => {
    if (!body?.trim()) return;
    const doc = createIntelDocument({ title: docTitle, text: body, source });
    onPatchProject((p) => addIntelDocumentToProject(p, doc));
  };

  return (
    <div className="v15-intel">
      <nav className="v15-tabs" aria-label="情报工作台">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'library' && base.intelDocuments.length > 0 && (
              <span className="v15-tab-count">{selected.length}/{base.intelDocuments.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'library' && (
        <div className="v15-intel-panel">
          <div className="v15-intel-compose">
            <input
              placeholder="材料标题（如 Q3 预算说明）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="材料标题"
            />
            <textarea
              placeholder="粘贴 PRD、会议纪要、数据摘录…入库后可被议题关键词检索"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              aria-label="材料正文"
            />
            <div className="v15-intel-compose-actions">
              <Button type="button" variant="primary" size="sm" onClick={addDoc} disabled={!text.trim()}>
                入库
              </Button>
            </div>
          </div>

          {base.intelDocuments.length === 0 ? (
            <p className="v15-empty">暂无材料。决策类议题建议至少入库一份背景文档。</p>
          ) : (
            <ul className="v15-intel-docs">
              {base.intelDocuments.map((doc) => {
                const isOn = base.selectedIntelDocIds.includes(doc.id);
                const open = previewDocId === doc.id;
                return (
                  <li key={doc.id} className={isOn ? 'is-on' : ''}>
                    <div className="v15-intel-doc-head">
                      <label className="v15-intel-doc-select">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={(e) => onPatchProject((p) => toggleIntelDocSelection(p, doc.id, e.target.checked))}
                        />
                        <span className="v15-intel-doc-title">{doc.title}</span>
                      </label>
                      <div className="v15-intel-doc-actions">
                        <button type="button" className="v15-link-btn" onClick={() => setPreviewDocId(open ? null : doc.id)}>
                          {open ? '收起' : '预览'}
                        </button>
                        <button
                          type="button"
                          className="v15-icon-btn"
                          aria-label="删除"
                          onClick={() => onPatchProject((p) => removeIntelDocumentFromProject(p, doc.id))}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="v15-intel-doc-meta">{doc.chunks?.length ?? 0} 段 · {doc.charCount} 字 · {doc.source}</p>
                    {open && doc.chunks?.[0] && (
                      <p className="v15-intel-doc-excerpt">{doc.chunks[0].text.slice(0, 200)}…</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'preview' && (
        <div className="v15-intel-panel">
          {!topic.trim() ? (
            <p className="v15-empty">请在工作台填写议题后，预览将命中哪些段落。</p>
          ) : selected.length === 0 ? (
            <p className="v15-empty">请先在材料库勾选参与本场的文档。</p>
          ) : previewHits.length === 0 ? (
            <p className="v15-empty">未命中相关段落，可补充材料或改写议题关键词。</p>
          ) : (
            <ol className="v15-intel-hits">
              {previewHits.map((h, i) => (
                <li key={`${h.docId}-${h.chunkId}`}>
                  <span className="v15-hit-rank">{i + 1}</span>
                  <div>
                    <strong>{h.docTitle}</strong>
                    <p>{h.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === 'url' && (
        <div className="v15-intel-panel">
          <p className="v15-intel-url-hint">链接抓取仅用于<strong>本场临时</strong>证据，不入项目库。</p>
          <input
            type="url"
            placeholder="https://…"
            value={intelUrl}
            onChange={(e) => onIntelUrlChange?.(e.target.value)}
            aria-label="情报 URL"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onIngestUrl}
            disabled={ingesting || !intelUrl?.trim()}
            loading={ingesting}
          >
            抓取并加入本场
          </Button>
          {sessionSnippets.length > 0 && (
            <ul className="v15-intel-session">
              {sessionSnippets.map((s, i) => (
                <li key={`snip-${i}`} title={s.text}>{s.title || s.text?.slice(0, 56)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}