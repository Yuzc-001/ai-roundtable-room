# 会议迭代模块（v1.2.0）

## 用户故事

审议已结束后，我认为某一角色的**某一轮发言**不够好，希望在不推翻整场会议的前提下，仅让该轮按当前前后文与 Workspace 重新生成。

## 边界

| 包含 | 不包含 |
|------|--------|
| 指定 `turnIndex` 重生成一条发言 | 整场会议重跑 |
| 保留其它轮次原文 | 修改预设/席位后批量重生成 |
| 从 0..index-1 重放 Workspace 后调用模型 | 多模型并行选稿 |
| 撤销上一次重生成（客户端） | 自动重算 vote / Decision Packet（v2.0 起见「重算投票与 Decision Packet」） |

## API

`POST /api/meetings/regenerate-turn`

```json
{
  "topic": "议题",
  "presetId": "product",
  "context": "可选背景",
  "personas": [],
  "meeting": { "turns": [], "vote": {}, ... },
  "turnIndex": 1
}
```

响应：`{ meeting, meta: { turnIndex, previousTurn, regeneratedAt } }`

## 实现要点

- `server/meeting.js` → `regenerateSpeakerTurn`
- 复用 `buildTurnPrompt` + `generateWithProviderFallback`
- `rebuildWorkspaceFromTurns` 在替换后重算 sidebar Workspace