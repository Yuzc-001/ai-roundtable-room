import { TASK_STATUS_LABELS, getMeetingsForTask } from '../lib/deliberationTasks.js';
import { Button } from '../ui/index.js';

export function TaskPanel({
  project,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onSetActiveTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onOpenMeeting,
}) {
  const tasks = project?.tasks ?? [];
  const activeId = project?.activeTaskId ?? null;

  return (
    <section className="task-panel" aria-label="审议任务">
      <div className="task-panel-head">
        <h3 className="info-header task-panel-title">任务</h3>
        <p className="task-panel-lead">一条任务可跨多场审议；新会议会挂到当前任务。</p>
      </div>

      <form
        className="task-create-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const title = fd.get('title');
          const goal = fd.get('goal');
          if (!String(title || '').trim()) return;
          onCreateTask({
            title: String(title),
            goal: String(goal || ''),
            scenarioId: selectedScenarioId,
          });
          e.target.reset();
        }}
      >
        <input className="input" name="title" placeholder="任务标题，如：Q3 上线决策" required />
        <input className="input" name="goal" placeholder="一句目标（可选）" />
        <Button type="submit" variant="secondary" size="sm">新建任务</Button>
      </form>

      {tasks.length === 0 ? (
        <p className="task-empty">暂无任务。创建任务后，发起的审议会计入该任务时间线。</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const meetings = getMeetingsForTask(project, task.id);
            const isActive = activeId === task.id;
            return (
              <li key={task.id} className={`task-card${isActive ? ' is-active' : ''}`}>
                <div className="task-card-head">
                  <button
                    type="button"
                    className="task-card-select btn btn-ghost"
                    onClick={() => onSetActiveTask(isActive ? null : task.id)}
                  >
                    <b>{task.title}</b>
                    <span className="task-status">{TASK_STATUS_LABELS[task.status] || task.status}</span>
                  </button>
                  <select
                    className="task-status-select"
                    value={task.status}
                    aria-label="任务状态"
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
                  >
                    {Object.entries(TASK_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteTask(task.id)} aria-label={`删除任务 ${task.title}`}>
                    删除
                  </Button>
                </div>
                {task.goal && <p className="task-goal">{task.goal}</p>}
                {task.scenarioId && (
                  <p className="task-scenario">
                    场景：
                    {scenarios.find((s) => s.id === task.scenarioId)?.name || task.scenarioId}
                  </p>
                )}
                {isActive && <p className="task-active-hint">当前任务 · 新审议将归入此线</p>}
                {meetings.length > 0 && (
                  <ol className="task-timeline">
                    {meetings.map((entry, idx) => (
                      <li key={entry.id}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="task-timeline-btn"
                          onClick={() => onOpenMeeting(entry)}
                        >
                          <span className="task-timeline-idx">第 {idx + 1} 场</span>
                          <span className="task-timeline-title">{entry.topic || entry.meeting?.title}</span>
                          <span className="task-timeline-meta">
                            {entry.savedAt
                              ? new Date(entry.savedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : ''}
                            {' · '}
                            {entry.meeting?.turns?.length ?? 0} 轮
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}