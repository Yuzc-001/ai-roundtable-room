# 议事厅 UI 原则（1.3.22）

## 北星：档案感审议记录

- **气质**：沉静、权威、可归档——像智库议事记录，而非通用 SaaS 或 AI 演示页
- **反 AI 俗套**：无紫色渐变、不以 Inter 独占标题、按钮不处处抢戏、克制玻璃拟态
- **字体**：中文标题用 `--serif`（LXGW WenKai）；正文 `--sans`；动效尊重 `prefers-reduced-motion`
- **色角色**：海军蓝 `--primary` 主行动；金 `--accent` 主持/洞察；青 `--teal` 证据/任务；`--risk` 仅破坏性操作

## 一屏一主行动（One primary per viewport region）

每个**视区**最多一个 `variant="primary"`。同一物理屏幕可有多视区，但同一视区内不得并列两个 primary。

| 视区 | 主行动 | 其余 |
|------|--------|------|
| 官网导航 | ghost / secondary（进入工作台） | **hero 独占 primary** |
| 官网 hero | 进入工作台 | 演示 = secondary |
| 侧栏底（未播放） | secondary「发起审议」（主区已有 primary 时） | 演示 = subtle |
| 顶栏（播放中，非完成态） | 启动/继续审议 | 首页、专注 = subtle/icon |
| 空会话主区 | `primaryActionLabel` | 样例/场景 chip = ghost；**向导显示时隐藏本区 primary** |
| 带走成果 | 导出 HTML = primary | 复制/分享 = ghost |
| 后续动作 | （无 primary） | 继续审议 = **secondary** |
| 模态 | 保存/确认 | 关闭、导入 = ghost |

## 五级按钮矩阵（仅此五种）

| Level | class / variant | 用途 |
|-------|-----------------|------|
| primary | `btn-primary` | 当前视区唯一主 CTA |
| secondary | `btn-secondary` | 次重要、仍可见（如侧栏发起、演示） |
| ghost | `btn-ghost` | 边框弱、列表行、卡片内操作 |
| subtle | `btn-subtle` | 导航、图标条、低优先级 |
| danger | `btn-danger` | 删除、彻底移除 |

**禁止**新增 `btn-*` 变体；chip、行操作、图标钮映射到上表。

## 组件入口

- `src/ui/Button.jsx` — `variant`, `size`, `disabled`, `loading`
- `src/ui/Chip.jsx` — 场景/模板选择
- `src/ui/IconButton.jsx` — 顶栏图标，须 `aria-label`

## 样式分层

```
styles.css
  → tokens.css
  → components/buttons.css
  → layout/shell.css
  → landing.css         # .landing-shell 固定浅色议事厅色板
```

## 落地检查清单

- [x] 各视区是否只有一个 primary？
- [x] 新按钮是否用五级之一？
- [x] 中文标题是否 `font-family: var(--serif)`？
- [x] 破坏性操作是否 `danger`？
- [x] `body[data-app-view]` landing / workspace？
- [x] `prefers-reduced-motion` 已处理？