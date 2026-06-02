# 议事厅 UI 原则（1.3.2）

## 北星：档案感审议记录

- **气质**：沉静、权威、可归档——像智库议事记录，而非通用 SaaS 或 AI 演示页
- **反 AI 俗套**：无紫色渐变、不以 Inter 独占标题、按钮不处处抢戏、克制玻璃拟态
- **字体**：中文标题用 `--serif`（LXGW WenKai）；正文 `--sans`；动效尊重 `prefers-reduced-motion`
- **色角色**：海军蓝 `--primary` 主行动；金 `--accent` 主持/洞察；青 `--teal` 证据/任务；`--risk` 仅破坏性操作

## 一屏一主行动（One primary per viewport）

每个视区（侧栏底、顶栏、空会话主区、模态主操作）**最多一个** `variant="primary"` 按钮。

| 视区 | 主行动 | 其余 |
|------|--------|------|
| 侧栏底（未播放） | 发起审议 | 主题/演示用 subtle |
| 顶栏（播放中） | 启动/继续审议 | 首页、专注用 subtle/icon |
| 空会话主区 | 启动结构化审议 | 样例卡、场景 chip 用 ghost |
| 模态 | 保存/确认 | 关闭、导入用 ghost |

## 五级按钮矩阵（仅此五种）

| Level | class / variant | 用途 |
|-------|-----------------|------|
| primary | `btn-primary` | 当前视区唯一主 CTA |
| secondary | `btn-secondary` | 次重要、仍可见（如「查看演示」） |
| ghost | `btn-ghost` | 边框弱、列表行、卡片内操作 |
| subtle | `btn-subtle` | 导航、图标条、低优先级 |
| danger | `btn-danger` | 删除、彻底移除 |

**禁止**新增 `btn-*` 变体；chip、行操作、图标钮映射到上表（`Chip` → ghost/subtle，`IconButton` → subtle/ghost）。

## 组件入口

- `src/ui/Button.jsx` — `variant`, `size`, `disabled`, `loading`
- `src/ui/Chip.jsx` — 场景/模板选择
- `src/ui/IconButton.jsx` — 顶栏图标，须 `aria-label`

## 样式分层

```
styles.css
  → tokens.css          # 色板、字体、间距
  → components/buttons.css
  → layout/shell.css    # body data-app-view、侧栏壳
  → landing.css         # 官网；--lp-* 与 workspace 对齐
```

## 落地检查清单

- [ ] 该屏是否只有一个 primary？
- [ ] 新按钮是否用五级之一？
- [ ] 中文标题是否 `font-family: var(--serif)`？
- [ ] 破坏性操作是否仅用 danger？
- [ ] `body[data-app-view]` 是否为 landing / workspace？
- [ ] 减少动效下动画是否关闭？