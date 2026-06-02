# 证据可信度模块（v1.2.1）

## 用户故事

我能分清：哪些是模型推断，哪些来自我提供的材料，哪些被错误标成「事实」。

## 规则（`server/evidence.js`）

| 条件 | 行为 |
|------|------|
| 无用户材料（短议题、无 URL、无文件上下文） | 去掉 citation URL；`fact`/`user_input` → `inference` |
| 有用户材料 | 仅保留上下文中出现过的 URL |
| `fact` 但无 URL | 降级为 `inference` |
| `project_memory` 但正文未体现 | 降级为 `inference` |

接入点：`sanitizeMeeting(..., evidenceInput)`，在 `createMeeting` / `regenerateSpeakerTurn` 路径自动执行。

## 导出

`formatMeetingMarkdown` / HTML 纪要含「证据溯源说明」章节。