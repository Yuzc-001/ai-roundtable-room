/**
 * Filter project meeting history by topic or meeting title (case-insensitive).
 * @param {Array<{ topic?: string, meeting?: { title?: string } }>} meetings
 * @param {string} query
 */
export function getMeetingDisplayLabel(item) {
  if (!item) return '';
  return String(item.displayLabel || item.topic || item.meeting?.title || '未命名会议').trim();
}

/**
 * @param {Array} meetings
 * @param {string|null|undefined} taskId — when set, only meetings for that task
 */
export function filterMeetingsByTask(meetings, taskId) {
  const list = meetings ?? [];
  if (!taskId) return list;
  return list.filter((item) => item.taskId === taskId);
}

export function filterMeetings(meetings, query) {
  const list = meetings ?? [];
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => {
    const topic = String(item.topic ?? '').toLowerCase();
    const title = String(item.meeting?.title ?? '').toLowerCase();
    const label = String(item.displayLabel ?? '').toLowerCase();
    return topic.includes(q) || title.includes(q) || label.includes(q);
  });
}