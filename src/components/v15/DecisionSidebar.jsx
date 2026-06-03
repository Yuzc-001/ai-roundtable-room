import { useState } from 'react';
import { Button } from '../../ui/index.js';
import { IntelWorkbench } from './IntelWorkbench.jsx';

const SIDEBAR_TABS = [
  { id: 'overview', label: '概览' },
  { id: 'intel', label: '情报库' },
  { id: 'intervene', label: '干预' },
  { id: 'compare', label: '对比' },
];

export function DecisionSidebar({
  activeTab: controlledTab,
  onTabChange,
  overview,
  intelProps,
  intervene,
  compare,
  onClose,
}) {
  const [internalTab, setInternalTab] = useState('overview');
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  return (
    <div className="v15-sidebar">
      <nav className="v15-sidebar-tabs" aria-label="决策侧栏">
        {SIDEBAR_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {onClose && (
          <Button type="button" variant="ghost" size="sm" className="v15-sidebar-close desktop-only" onClick={onClose}>
            收起
          </Button>
        )}
      </nav>

      <div className="v15-sidebar-body">
        {tab === 'overview' && overview}
        {tab === 'intel' && <IntelWorkbench {...intelProps} />}
        {tab === 'intervene' && intervene}
        {tab === 'compare' && compare}
      </div>
    </div>
  );
}