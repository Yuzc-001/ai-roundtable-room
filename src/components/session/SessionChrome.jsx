import { Button, IconButton } from '../../ui/index.js';
import { Logo } from '../Logo.jsx';

export function SessionChrome({
  topic,
  meetingTitle,
  scenarioName,
  taskTitle,
  phaseLabel,
  turnCount = 0,
  sharedMode = false,
  mobileMenuOpen,
  onToggleMenu,
  leftPanelOpen,
  onToggleLeftPanel,
  rightPanelOpen,
  onToggleRightPanel,
  focusMode,
  onToggleFocus,
  onReturnHome,
  onOpenLanding,
}) {
  const display = String(topic || meetingTitle || '').trim() || '未填写议题';
  const chips = [
    scenarioName,
    taskTitle,
    phaseLabel,
    turnCount > 0 ? `${turnCount} 轮` : null,
  ].filter(Boolean);

  return (
    <header className="delib-chrome">
      <div className="delib-chrome-bar">
        {!sharedMode && (
          <IconButton
            className="mobile-only"
            label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            onClick={onToggleMenu}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {mobileMenuOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </IconButton>
        )}
        <div className="delib-chrome-brand">
          <Logo />
          <span>议事厅</span>
        </div>
        <div className="delib-chrome-actions">
          {!sharedMode && (
            <>
              <Button type="button" variant="subtle" size="sm" onClick={onToggleLeftPanel}>
                {leftPanelOpen ? '收起项目' : '项目'}
              </Button>
              <Button type="button" variant="subtle" size="sm" onClick={onToggleRightPanel}>
                {rightPanelOpen ? '收起档案' : '档案'}
              </Button>
              <Button
                type="button"
                variant={focusMode ? 'secondary' : 'subtle'}
                size="sm"
                onClick={onToggleFocus}
              >
                {focusMode ? '退出沉浸' : '沉浸阅读'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onReturnHome}>
                换议题
              </Button>
            </>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onOpenLanding}>
            首页
          </Button>
        </div>
      </div>

      <div className="delib-chrome-topic" role="region" aria-label="本场议题">
        <h1 className="delib-chrome-title">{display}</h1>
        {chips.length > 0 && (
          <ul className="delib-chrome-chips" aria-label="场次信息">
            {chips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
        )}
        <p className="delib-chrome-guide">
          从上往下读发言记录；底部圆点表示谁在场，点击可只读某一位。
        </p>
      </div>
    </header>
  );
}