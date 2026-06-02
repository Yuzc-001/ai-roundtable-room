/**
 * Filter project meeting history by topic or meeting title (case-insensitive).
 * @param {Array<{ topic?: string, meeting?: { title?: string } }>} meetings
 * @param {string} query
 */
export function filterMeetings(meetings, query) {
  const list = meetings ?? [];
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => {
    const topic = String(item.topic ?? '').toLowerCase();
    const title = String(item.meeting?.title ?? '').toLowerCase();
    return topic.includes(q) || title.includes(q);
  });
}