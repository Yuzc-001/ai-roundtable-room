import { useEffect, useMemo, useRef, useState } from 'react';
import { Bubble, DecisionPacketCard, DELIBERATION_PHASES, Logo, MemoryReviewPanel, ModeratorConsole, PersonaDrawer, Stage, VoteCard, WorkspacePanel } from './components.jsx';
import { DEFAULT_TOPIC, DEMO_MEETING, PERSONAS, PRESETS } from './data/personas.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useTypewriter } from './hooks/useTypewriter.js';
import { formatMeetingMarkdown, formatMeetingHTML, sanitizeDownloadName } from './lib/minutes.js';
import {
  approveProjectMemoryChanges,
  archiveProject,
  buildMeetingPayload,
  buildProjectMemoryContext,
  createDefaultProject,
  getPresetRoster,
  rejectProjectMemoryChanges,
  removeMeetingFromProject,
  restoreArchivedProject,
  updateProjectWithMeeting,
} from './lib/roundtable.js';
import {
  createMeetingRequest,
  createSessionRequest,
  createShareRequest,
  extractTextRequest,
  getHealth,
  getShareRequest,
  syncProjectFiles,
} from './services/roundtableApi.js';

export default function App() {
  const [personas, setPersonas] = useLocalStorage('roundtable:personas', PERSONAS);
  const [presetId, setPresetId] = useLocalStorage('roundtable:presetId', 'product');
  const [projects, setProjects] = useLocalStorage('roundtable:projects', [createDefaultProject()]);
  const [archivedProjects, setArchivedProjects] = useLocalStorage('roundtable:archivedProjects', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage('roundtable:activeProjectId', 'default-project');
  const [theme, setTheme] = useLocalStorage('roundtable:theme', 'dark');
  const [topic, setTopic] = useState('');
  const [meeting, setMeeting] = useState(DEMO_MEETING);
  const [meetingSource, setMeetingSource] = useState('idle');
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const [history, setHistory] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sharedMode, setSharedMode] = useState(false);
  const [showVote, setShowVote] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [projectCreatorOpen, setProjectCreatorOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [purgeConfirmId, setPurgeConfirmId] = useState(null);
  const [toast, setToast] = useState('');
  const [parsingFile, setParsingFile] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // For generation progress perception (simulated phase advance while waiting for backend)
  const [simPhaseIdx, setSimPhaseIdx] = useState(0);
  // Temp feedback for export buttons (state change + toast for closure)
  const [exportFeedback, setExportFeedback] = useState(null); // 'html' | 'md' | null

  // History deletion with thoughtful undo (optimistic + 5s reversible window)
  const [loadedHistoryId, setLoadedHistoryId] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null); // { entry, projectId, projectName }
  const undoTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // For inline permanent delete confirmation (right-click / long-press)
  const [permanentConfirmId, setPermanentConfirmId] = useState(null); // which history item is in "confirm permanent delete" state

  const projectList = useMemo(() => (Array.isArray(projects) && projects.length ? projects : [createDefaultProject()]), [projects]);
  const archivedProjectList = useMemo(() => (Array.isArray(archivedProjects) ? archivedProjects : []), [archivedProjects]);
  const activeProject = useMemo(() => projectList.find((project) => project.id === activeProjectId) || projectList[0], [projectList, activeProjectId]);
  const preset = PRESETS[presetId] ?? PRESETS.product;
  const memoryEnabled = activeProject?.memoryEnabled !== false;
  const canDeleteProject = activeProject?.id !== 'default-project';
  const pendingMemoryChanges = activeProject?.pendingMemoryChanges ?? [];
  const allOnStage = useMemo(() => getPresetRoster({ personas, preset }), [personas, preset]);
  const projectMemoryContext = useMemo(() => buildProjectMemoryContext(activeProject), [activeProject]);
  const baseScript = useMemo(() => (playbackStarted ? (meeting.turns ?? []).map((turn) => ({ kind: 'turn', ...turn })) : []), [meeting, playbackStarted]);
  const currentTurn = currentIdx < baseScript.length ? baseScript[currentIdx] : null;
  const currentSpeaker = currentTurn ? personas[currentTurn.speaker] : null;
  const { revealed, done } = useTypewriter(currentTurn ? currentTurn.text : '', 1.25, status === 'generating');
  const transcriptRef = useRef(null);

  // #1 Enhanced generation progress perception (reuses simPhaseIdx + DELIBERATION_PHASES, minimal addition)
  const genPhaseCount = DELIBERATION_PHASES.length;
  const genCurrentIdx = Math.min(simPhaseIdx, genPhaseCount - 1);
  const genProgressPct = Math.round(((genCurrentIdx + 1) / genPhaseCount) * 100);
  const genCurrentPhase = DELIBERATION_PHASES[genCurrentIdx];
  const genRemaining = Math.max(6, (genPhaseCount - genCurrentIdx - 1) * 6);
  const hasActiveMemory = !!(projectMemoryContext && projectMemoryContext.length > 20); // #4 让记忆价值被感知：生成中可见注入状态

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    // 检查分享链接
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setSharedMode(true);
      setPlaybackStarted(true);
      getShareRequest(shareId)
        .then((data) => {
          setTopic(data.topic || '');
          setMeeting(data);
          setHistory(data.turns || []);
          setShowVote(true);
        })
        .catch((err) => {
          notify(`获取分享内容失败: ${err.message}`);
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        });
      return;
    }

    getHealth().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      syncProjectFiles({ projects: projectList, archivedProjects: archivedProjectList })
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [projectList, archivedProjectList]);
  useEffect(() => {
    if (!currentTurn || !done || status === 'generating') return;
    const timer = setTimeout(() => {
      setHistory((prev) => [...prev, currentTurn]);
      if (currentIdx < baseScript.length - 1) setCurrentIdx(currentIdx + 1);
      else setShowVote(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [currentTurn, done, status, currentIdx, baseScript.length]);
  useEffect(() => {
    // 只在播放过程中自动滚到底，会议结束后（showVote 为 true）不再强制滚动
    // 让用户可以自由向上滚动回顾完整对话，或向下查看审议结论
    if (transcriptRef.current && !showVote) {
      transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history.length, revealed.length]);

  // ESC closes PersonaDrawer or mobile sidebar (keyboard parity)
  useEffect(() => {
    if (!editingId && !mobileMenuOpen) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        if (editingId) setEditingId(null);
        else if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [editingId, mobileMenuOpen]);

  // Simulated phase progress during long generation wait — eliminates black-box anxiety (最高优先 #1)
  useEffect(() => {
    if (status !== 'generating') {
      setSimPhaseIdx(0);
      return;
    }
    const iv = setInterval(() => {
      setSimPhaseIdx((i) => Math.min(i + 1, DELIBERATION_PHASES.length - 1));
    }, 3800);
    return () => clearInterval(iv);
  }, [status]);

  // Mobile hamburger sidebar: lock main content scroll when open (prevents background scroll mis-ops on real phones)
  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev || ''; };
    }
    return undefined;
  }, [mobileMenuOpen]);

  // 撤销计时器清理（防御性，防止 HMR / 未来路由 / 严格模式下的 setState 警告）
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  // 切换项目时清空彻底删除确认态（避免跨项目残留确认条，符合设计约束）
  useEffect(() => {
    setPermanentConfirmId(null);
  }, [activeProjectId]);

  const notify = (message) => {
    // If an undo window is open, dismiss it on any new feedback (user moved on)
    if (lastDeleted) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setLastDeleted(null);
    }
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  };
  const returnHome = () => {
    setPlaybackStarted(false);
    setStatus('idle');
    setHistory([]);
    setCurrentIdx(0);
    setShowVote(false);
    setSimPhaseIdx(0);
    setExportFeedback(null);
    setLoadedHistoryId(null);
  };

  // 点击历史会议 → 加载该场会议进行复盘查看
  const viewHistoryMeeting = (historyItem) => {
    if (!historyItem?.meeting) return;

    setMeeting(historyItem.meeting);
    setTopic(historyItem.topic || '');
    setPresetId(historyItem.presetId || 'product');

    // 恢复为已完成状态，可直接查看 Decision Packet 等
    setPlaybackStarted(true);
    setShowVote(true);
    setStatus('idle');
    setCurrentIdx(0);
    setHistory(historyItem.meeting.turns || []);
    setSimPhaseIdx(0);
    setExportFeedback(null);
    setLoadedHistoryId(historyItem.id || null);

    // 关闭移动菜单（如果开着）
    setMobileMenuOpen(false);

    notify('已加载历史会议，可复盘查看完整结论与行动项');
  };

  // 删除单条历史会议（乐观更新 + 5s 可撤销 + 自动清理当前查看状态）
  const deleteHistoryItem = (entry) => {
    if (!entry?.id) return;
    const projId = activeProject?.id;
    if (!projId) return;

    const savedEntry = entry;

    // 1. 立即从项目 meetings 中移除（乐观 UI）
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((project) =>
        project.id === projId ? removeMeetingFromProject(project, entry.id) : project
      );
    });

    // 2. 如果正在查看的就是这条，优雅重置主界面（避免显示已删内容）
    if (loadedHistoryId === entry.id) {
      returnHome();
    }

    // 3. 清理旧的撤销计时器
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // 4. 记录撤销状态（含项目名，支持跨项目撤销时的清晰提示）
    const projName = activeProject?.name || '';
    setLastDeleted({ entry: savedEntry, projectId: projId, projectName: projName });
    // 不再走 setToast(string)，由下方 lastDeleted 条件渲染的 undo toast 接管视觉

    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
      setToast('');
    }, 5200);
  };

  // 触发“彻底删除”就地确认条（右键 / 长按）
  const triggerPermanentDeleteConfirm = (entry) => {
    if (!entry?.id) return;
    setPermanentConfirmId(entry.id);
  };

  // 执行真正的永久删除（从确认条点击“彻底删除”触发）
  const confirmPermanentDelete = (entryId) => {
    if (!entryId) return;

    const projId = activeProject?.id;
    if (!projId) return;

    const entry = activeProject.meetings?.find(m => m.id === entryId);
    if (!entry) return;

    // 真正硬删除，不走撤销逻辑
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((project) =>
        project.id === projId ? removeMeetingFromProject(project, entryId) : project
      );
    });

    // 如果正在复盘查看的就是这条，自动返回
    if (loadedHistoryId === entryId) {
      returnHome();
      setLoadedHistoryId(null);
    }

    // 清理任何待撤销状态
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setLastDeleted(null);
    setPermanentConfirmId(null);

    notify('已彻底删除该历史会议（不可恢复）');
  };

  const cancelPermanentDelete = () => {
    setPermanentConfirmId(null);
  };

  const undoDeleteHistoryItem = () => {
    if (!lastDeleted) return;
    const { entry, projectId, projectName } = lastDeleted;

    // 恢复到列表最前（保持“最近优先”心智），并遵守 12 条上限
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((project) => {
        if (project.id !== projectId) return project;
        const restoredMeetings = [entry, ...(project.meetings ?? [])].slice(0, 12);
        return {
          ...project,
          meetings: restoredMeetings,
          updatedAt: new Date().toISOString(),
        };
      });
    });

    const restoredName = projectName || '原项目';
    setLastDeleted(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    // 用 notify（会自动清理 lastDeleted 状态），带项目名便于跨项目识别
    notify(`已恢复到「${restoredName}」`);
  };

  const startMeeting = async (customTopic) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) {
      setError('请输入要审议的问题');
      return;
    }
    const contextNotes = [projectMemoryContext].filter(Boolean);
    setStatus('generating');
    setError('');
    try {
      const payload = await createMeetingRequest({ payload: buildMeetingPayload({ topic: finalTopic, presetId, contextNotes, roster: allOnStage }) });
      const entry = { id: Date.now(), topic: finalTopic, meeting: payload, contextNotes, source: 'live', savedAt: new Date().toISOString() };
      setProjects((items) => {
        const list = Array.isArray(items) && items.length ? items : [activeProject];
        return list.map((project) => (project.id === activeProject.id ? updateProjectWithMeeting(project, entry) : project));
      });
      setMeeting(payload);
      setMeetingSource('live');
      setPlaybackStarted(true);
      setHistory([]);
      setCurrentIdx(0);
      setShowVote(false);
      setTopic(finalTopic);
      setLoadedHistoryId(null);
      notify('✧ 审议完成 · 6阶段闭环 · 决策已封装，审批记忆后导出复盘');
    } catch (e) {
      setError(e.message || '启动审议失败，请检查模型配置');
    } finally {
      setStatus('idle');
    }
  };
  const showDemoMeeting = () => {
    setTopic(DEFAULT_TOPIC);
    setMeeting(DEMO_MEETING);
    setMeetingSource('demo');
    setError('');
    setHistory([]);
    setCurrentIdx(0);
    setShowVote(false);
    setPlaybackStarted(true);
    setLoadedHistoryId(null);
    notify('已载入演示审议');
  };

  // #2 处理文件上传（PDF 解析并作为 Context）
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      notify('目前仅支持 PDF 格式文件');
      return;
    }
    try {
      setParsingFile(true);
      notify('正在解析 PDF 文档，提取核心背景...');
      const text = await extractTextRequest(file);
      setTopic((prev) => `${prev}\n\n[文件上下文]：\n${text.slice(0, 3000)}`);
      notify(`PDF 解析成功！已提取约 ${text.length} 字背景信息`);
    } catch (err) {
      notify(`文件解析失败: ${err.message}`);
    } finally {
      setParsingFile(false);
      event.target.value = ''; // 清空 input
    }
  };

  // #3 生成分享链接
  const generateShareLink = async () => {
    if (!meeting) return;
    try {
      setExportFeedback('share');
      const id = await createShareRequest({ meeting });
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${id}`;
      await navigator.clipboard.writeText(shareUrl);
      notify('分享链接已复制到剪贴板');
    } catch (err) {
      notify(`生成分享链接失败: ${err.message}`);
    } finally {
      setTimeout(() => setExportFeedback(null), 2200);
    }
  };

  // #4 保存到我的库（分享页功能）
  const saveToMyLibrary = () => {
    if (!meeting || !sharedMode) return;
    const newProject = {
      id: `imported-${Date.now()}`,
      name: `导入：${meeting.title}`,
      meetings: [meeting],
      memory: meeting.memoryDiff || { decisions: [], risks: [], assumptions: [], disagreements: [], actions: [] },
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    notify('已成功存入我的智库 · 正为您跳转到工作台');
    setTimeout(() => {
      window.location.href = '/'; // 跳转回主页并清除 share 参数
    }, 1500);
  };

  const exportMinutes = (format = 'md') => {
    const base = { topic, meeting, personas, providerLabel: health?.model || '', meetingSource };
    const save = (content, mime, ext) => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `圆桌纪要-${sanitizeDownloadName(meeting.title)}${ext}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    if (format === 'html' && typeof formatMeetingHTML === 'function') {
      save(formatMeetingHTML(base), 'text/html;charset=utf-8', '.html');
      setExportFeedback('html');
      notify('HTML 已导出 · 可直接分享给同事复盘（含 Decision Packet + 行动项）');
    } else {
      save(formatMeetingMarkdown(base), 'text/markdown;charset=utf-8', '.md');
      setExportFeedback('md');
      notify('MD 已导出到下载文件夹');
    }
    setTimeout(() => setExportFeedback(null), 2200);
  };

  // 复制模式状态（默认从 localStorage 恢复）
  const [copyMode, setCopyMode] = useState(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('roundtable:copyMode') : null;
      return saved === 'formal' ? 'formal' : 'concise';
    } catch {
      return 'concise';
    }
  }); // 'concise' | 'formal'

  // #2 一键复制核心结论（支持简洁/正式模式 + 智能条件渲染）
  const copyCoreConclusions = (mode = copyMode) => {
    const topic = meeting?.topic || '未指定议题';
    const pkt = meeting?.decisionPacket?.selectedOption || {};
    const suggestion = pkt.description || '（无最终建议）';
    const rationale = pkt.rationale || '';
    const voteSummary = meeting?.vote?.summary || '';

    // 主要分歧（智能提取）
    const objections = (meeting?.decisionPacket?.residualObjections || [])
      .slice(0, 3)
      .map(o => `- ${o.objection}`);
    const tensions = (meeting?.workspace?.tensions || [])
      .filter(t => t.status === 'open')
      .slice(0, 3)
      .map(t => `- ${t.description}`);
    const mainDisagreements = objections.length > 0 ? objections : tensions;

    // 行动项
    const actionItems = meeting?.workspace?.actionItems || meeting?.decisionPacket?.actionItems || [];
    const topActions = actionItems.slice(0, 3).map((a) => '• ' + (a.action || a.text || a.description || '')).join('\n');

    let text = '';

    if (mode === 'concise') {
      // 简洁模式（推荐发消息用）
      text = `议题：${topic}\n\n`;
      text += `最终建议：${suggestion}\n`;
      if (rationale) text += `理由：${rationale}\n`;
      if (topActions) {
        text += `\n核心行动项：\n${topActions}\n`;
      }
      text += `\n（导出 HTML 可查看完整复盘与分歧）`;
    } else {
      // 正式模式（适合进文档 / 会议纪要）
      text = `议题：${topic}\n\n`;
      text += `最终建议：${suggestion}\n`;
      if (rationale) text += `理由：${rationale}\n\n`;
      if (voteSummary) text += `投票结果：${voteSummary}\n\n`;
      if (mainDisagreements.length > 0) {
        text += `主要分歧：\n${mainDisagreements.join('\n')}\n\n`;
      }
      if (topActions) {
        text += `核心行动项：\n${topActions}\n\n`;
      }
      text += `—— AI Roundtable Room 生成 · 可导出 HTML 完整复盘`;
    }

    const doNotify = (msg) => { setExportFeedback('copied'); notify(msg); setTimeout(() => setExportFeedback(null), 1800); };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      const notifyMsg = mode === 'concise' 
        ? '简洁版已复制（适合发消息）' 
        : '完整版已复制（适合进文档）';
      navigator.clipboard.writeText(text).then(() => doNotify(notifyMsg)).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      doNotify('已复制（兼容模式）');
    }
  };
  const createProject = (event) => {
    event.preventDefault();
    const name = projectDraft.trim();
    if (!name) return;
    const project = createDefaultProject({ id: `project-${Date.now()}`, name: name.slice(0, 40) });
    setProjects((items) => [project, ...(Array.isArray(items) ? items : [])].slice(0, 20));
    setActiveProjectId(project.id);
    setProjectDraft('');
    setProjectCreatorOpen(false);
    setDeleteConfirmOpen(false);
    returnHome();
    setMobileMenuOpen(false);
    notify('项目已创建');
  };
  const toggleProjectMemory = () => {
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((project) => (project.id === activeProject.id ? { ...project, memoryEnabled: project.memoryEnabled === false } : project));
    });
    notify(memoryEnabled ? '项目记忆已关闭' : '项目记忆已开启');
  };
  const deleteActiveProject = () => {
    if (!canDeleteProject) return;
    const archived = archiveProject(activeProject);
    const nextProjects = projectList.filter((project) => project.id !== activeProject.id);
    const fallbackProject = nextProjects[0] || createDefaultProject();
    setArchivedProjects((items) => [archived, ...(Array.isArray(items) ? items.filter((project) => project.id !== activeProject.id) : [])].slice(0, 30));
    setProjects(nextProjects.length ? nextProjects : [fallbackProject]);
    setActiveProjectId(fallbackProject.id);
    setDeleteConfirmOpen(false);
    setPurgeConfirmId(null);
    returnHome();
    setMobileMenuOpen(false);
    notify('项目已移入归档箱');
  };
  const restoreProject = (project) => {
    const restored = restoreArchivedProject(project);
    setProjects((items) => [restored, ...(Array.isArray(items) ? items.filter((item) => item.id !== restored.id) : [])].slice(0, 20));
    setArchivedProjects((items) => (Array.isArray(items) ? items.filter((item) => item.id !== restored.id) : []));
    setActiveProjectId(restored.id);
    setPurgeConfirmId(null);
    returnHome();
    setMobileMenuOpen(false);
    notify('项目已恢复');
  };
  const purgeArchivedProject = (projectId) => {
    setArchivedProjects((items) => (Array.isArray(items) ? items.filter((project) => project.id !== projectId) : []));
    setPurgeConfirmId(null);
    notify('归档项目已彻底删除');
  };
  const approveMemoryChanges = (ids) => {
    setProjects((items) => (Array.isArray(items) ? items : projectList).map((project) => (
      project.id === activeProject.id ? approveProjectMemoryChanges(project, ids) : project
    )));
    notify('记忆已沉淀 · 持续用于新审议，价值闭环');
  };
  const rejectMemoryChanges = (ids) => {
    setProjects((items) => (Array.isArray(items) ? items : projectList).map((project) => (
      project.id === activeProject.id ? rejectProjectMemoryChanges(project, ids) : project
    )));
    notify('已忽略记忆建议（下次可重新生成）');
  };
  const canStart = topic.trim().length > 0 && status !== 'generating';

  return (
    <div className="app" data-focus-mode={focusMode ? 'true' : 'false'} data-mobile-menu={mobileMenuOpen ? 'true' : 'false'} data-generating={status === 'generating' ? 'true' : 'false'} data-shared={sharedMode ? 'true' : 'false'}>
      <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
      {!sharedMode && (
        <aside className="sidebar">
          <div className="brand-section">
            <Logo />
            <span className="brand-text">圆桌智库</span>
          </div>
          <div className="sidebar-scroll">
            <nav className="nav-group">
              <div className="nav-title">决策上下文</div>
              <select className="project-select-styled" value={activeProject?.id} onChange={(event) => { setActiveProjectId(event.target.value); setDeleteConfirmOpen(false); returnHome(); setMobileMenuOpen(false); }}>
                {projectList.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <div className="project-nav-actions">
                <button className="project-mini-btn" onClick={() => { setProjectCreatorOpen((open) => !open); /* keep open for form */ }}>+ 新建</button>
                {deleteConfirmOpen ? (
                  <div className="project-delete-confirm">
                    <span>移入归档箱？</span>
                    <button onClick={() => setDeleteConfirmOpen(false)}>取消</button>
                    <button className="danger" onClick={deleteActiveProject}>删除</button>
                  </div>
                ) : (
                  <button className="project-mini-btn danger" disabled={!canDeleteProject} onClick={() => setDeleteConfirmOpen(true)} title={canDeleteProject ? '删除当前项目' : '默认项目不能删除'}>
                    删除项目
                  </button>
                )}
              </div>
              {projectCreatorOpen && (
                <form className="project-create-form" onSubmit={createProject}>
                  <label htmlFor="project-name-input">新项目名称</label>
                  <input id="project-name-input" value={projectDraft} onChange={(event) => setProjectDraft(event.target.value)} placeholder="例如：AI 圆桌上线" maxLength={40} />
                  <div className="project-form-actions">
                    <button type="button" onClick={() => { setProjectCreatorOpen(false); setProjectDraft(''); }}>取消</button>
                    <button type="submit" disabled={!projectDraft.trim()}>创建</button>
                  </div>
                </form>
              )}
              <div className="project-sidebar-controls">
                <div className="nav-hint">{memoryEnabled ? '批准后的结论、风险和分歧会进入项目记忆。' : '项目记忆已关闭，只保留会议记录。'}</div>
                <button className="memory-toggle" data-on={memoryEnabled ? 'true' : 'false'} aria-pressed={memoryEnabled} onClick={() => { toggleProjectMemory(); setMobileMenuOpen(false); }}>
                  <span>项目记忆</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{memoryEnabled ? '已开启' : '已关闭'}</span>
                    <span className="memory-toggle-dot" />
                  </div>
                </button>
              </div>
              {archivedProjectList.length > 0 && (
                <div className="archive-box">
                  <div className="archive-title">归档箱 · {archivedProjectList.length}</div>
                  {archivedProjectList.map((project) => (
                    <div key={project.id} className="archive-item">
                      <div><b>{project.name}</b><span>{project.meetings?.length ?? 0} 场会议</span></div>
                      {purgeConfirmId === project.id ? (
                        <div className="archive-actions">
                          <button className="ghost-btn" onClick={() => setPurgeConfirmId(null)}>取消</button>
                          <button className="ghost-btn ghost-btn--danger" onClick={() => purgeArchivedProject(project.id)}>确认彻底删除</button>
                        </div>
                      ) : (
                        <div className="archive-actions">
                          <button className="ghost-btn" onClick={() => restoreProject(project)}>恢复</button>
                          <button className="ghost-btn ghost-btn--danger" onClick={() => setPurgeConfirmId(project.id)}>彻底删除</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </nav>
            <nav className="nav-group">
              <div className="nav-title">审议协议</div>
              <div className="nav-list">
                {Object.values(PRESETS).map((item) => (
                  <button key={item.id} className={`nav-btn ${presetId === item.id ? 'active' : ''}`} onClick={() => { setPresetId(item.id); setMobileMenuOpen(false); }}>
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.name}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="sidebar-foot">
            <button className="nav-btn" onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setMobileMenuOpen(false); }}>
              <span className="icon">{theme === 'light' ? '☾' : '☼'}</span>
              <span className="label">外观：{theme === 'light' ? '深色' : '浅色'}</span>
            </button>
            <button className="nav-btn" onClick={() => { showDemoMeeting(); setMobileMenuOpen(false); }}>
              <span className="icon">◇</span>
              <span className="label">演示审议</span>
            </button>
          </div>
        </aside>
      )}
      <main className="main-content">
        <header className="top-nav">
          {!sharedMode && (
            <button className="icon-btn-lite mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
          {sharedMode && (
            <div className="brand-section" style={{ border: 'none', height: 'auto', padding: 0 }}>
              <Logo />
              <span className="brand-text" style={{ fontSize: '18px' }}>圆桌智库</span>
              <span className="share-badge">在线复盘模式</span>
            </div>
          )}
          <div className="topic-input-wrap" style={{ position: 'relative' }}>
            <input className="topic-input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="输入一个需要权衡、证据、风险和行动的复杂问题..." disabled={sharedMode || parsingFile || status === 'generating'} />
            {!sharedMode && status !== 'generating' && (
              <label className="file-upload-lite" title="上传 PDF 报告作为背景数据">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} disabled={parsingFile} />
              </label>
            )}
            {status === 'generating' && (
              <div className="parsing-loader" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <span className="dot-pulse" />
              </div>
            )}
          </div>
          <div className="top-actions">
            <button className={`icon-btn-lite ${focusMode ? 'active' : ''}`} onClick={() => setFocusMode(!focusMode)} title={focusMode ? '退出专注模式' : '进入专注模式'}>
              {focusMode ? '⇲' : '⇱'}
            </button>
            {playbackStarted && !sharedMode && <button className="icon-btn-lite" onClick={returnHome} title="回工作台">⌂</button>}
            {sharedMode && (
              <button className="primary-btn" onClick={saveToMyLibrary}>存入我的智库</button>
            )}
            {sharedMode && (
              <button className="icon-btn-lite" onClick={() => { window.location.href = '/'; }} title="我也要发起审议">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}
            {!sharedMode && (
              <button className="primary-btn" onClick={() => startMeeting()} disabled={!canStart}>{status === 'generating' ? '审议生成中...' : '启动结构化审议'}</button>
            )}
          </div>
        </header>
        <Stage allPersonas={allOnStage} speakerId={currentSpeaker?.id} onSeatClick={(persona) => setEditingId(persona.id)} />
        <div className="transcript-area" ref={transcriptRef}>
          {status === 'generating' ? (
            /* #1 生成过程阶段提示 + 感知进度：复用 ModeratorConsole 的 phase stepper + 模拟推进，彻底消除等待黑箱焦虑 */
            <div className="generating-area">
              <ModeratorConsole
                phase={DELIBERATION_PHASES[simPhaseIdx]?.id || 'Frame'}
                status="generating"
                onAction={() => {}}
                generating
              />
              <div className="gen-progress">
                <div className="gen-progress-track">
                  <div className="gen-progress-fill" style={{ width: `${genProgressPct}%` }} />
                </div>
                <div className="gen-progress-label">
                  阶段 {genCurrentIdx + 1}/{genPhaseCount} · {genCurrentPhase?.label || '进行中'} · {genCurrentIdx === genPhaseCount-1 ? '正在封装结论' : `约需 ${genRemaining}s`}
                </div>
              </div>
              {hasActiveMemory && (
                <div className="gen-memory-cue">🧠 项目记忆已注入 · 历史结论/风险/分歧将参与本场审议</div>
              )}
              <p className="gen-meta">
                这是一场多模型协作的结构化审议，我们正在协调 6 位专业大臣的观点。<br />
                整个过程由系统自动推进，完成后将为您呈现完整的 Decision Packet。
              </p>
            </div>
          ) : !playbackStarted ? (
            <div className="empty-session">
              <div className="empty-eyebrow">Structured Deliberation</div>
              <h1>你好，这里是你的“数字内阁”</h1>
              <p>每场会议都会沉淀认知动作、证据状态、未解决分歧、Decision Packet 和可审批的项目记忆。</p>
              <div className="starter-grid">
                <div className="starter-card" onClick={() => startMeeting('我们是否应该把 AI 圆桌会议产品开放给第一批真实用户试用？')}><b>产品深度评审</b><span>输出风险、分歧、重开条件和行动项。</span></div>
                <div className="starter-card" onClick={() => startMeeting('如果我们要把这个产品做成可收费版本，最小可付费价值应该是什么？')}><b>商业判断</b><span>拆解价值假设、定价风险和验证路径。</span></div>
                <div className="starter-card" onClick={showDemoMeeting}><b>查看演示</b><span>先看一场结构化审议如何展开。</span></div>
              </div>
            </div>
          ) : (
            <div className="feed-container">
              {playbackStarted && status !== 'generating' && !showVote && (
                <ModeratorConsole 
                  phase={currentTurn?.phase || (history.length > 0 ? history[history.length - 1].phase : 'Frame')} 
                  status={status}
                  onAction={(action) => notify(`主持人已触发：${action === 'probe' ? '信息探测' : action === 'summarize' ? '阶段总结' : '强调分歧'}`)}
                />
              )}
              {history.map((turn, index) => (
                <Bubble key={index} persona={personas[turn.speaker]} text={turn.text} stance={turn.stance} act={turn.act} phase={turn.phase} confidence={turn.confidence} evidenceLabel={turn.evidenceLabel} citations={turn.citations} providerName={turn.providerName} />
              ))}
              {currentTurn && (
                <Bubble persona={currentSpeaker} text={revealed} isLive isStreaming={!done} stance={currentTurn.stance} act={currentTurn.act} phase={currentTurn.phase} confidence={currentTurn.confidence} evidenceLabel={currentTurn.evidenceLabel} citations={currentTurn.citations} providerName={currentTurn.providerName} />
              )}
              {showVote && (
                <div className="final-block">
                  {/* #5 审议完成仪式感 + 闭环引导：轻量成功提示，强化下一步（导出复盘是主CTA） */}
                  <div className="success-ceremony">✧ 审议完成 · 6 阶段闭环 · Decision Packet 已封装 ✓ 建议审批记忆 · 一键导出 HTML 复盘</div>
                  
                  {meeting?.usage && (
                    <div className="usage-indicator">
                      本次审议共消耗约 <b>{(meeting.usage.totalTokens / 1000).toFixed(1)}k</b> Tokens 
                      <span className="usage-detail">(入: {meeting.usage.inputTokens} / 出: {meeting.usage.outputTokens})</span>
                    </div>
                  )}

                  <WorkspacePanel workspace={meeting.workspace} />
                  <DecisionPacketCard packet={meeting.decisionPacket} />
                  <VoteCard vote={meeting.vote} personas={personas} />

                  {/* 复制模式切换 */}
                  <div className="copy-mode-switch">
                    <span className="copy-mode-label">复制模式</span>
                    <button
                      className={`ghost-btn ${copyMode === 'concise' ? 'active' : ''}`}
                      onClick={() => {
                        setCopyMode('concise');
                        localStorage.setItem('roundtable:copyMode', 'concise');
                      }}
                    >
                      简洁
                    </button>
                    <button
                      className={`ghost-btn ${copyMode === 'formal' ? 'active' : ''}`}
                      onClick={() => {
                        setCopyMode('formal');
                        localStorage.setItem('roundtable:copyMode', 'formal');
                      }}
                    >
                      完整
                    </button>
                  </div>

                  <div className="finish-actions">
                    <button
                      className={`ghost-btn-big ${exportFeedback === 'copied' ? 'export-success' : ''}`}
                      onClick={() => copyCoreConclusions()}
                      disabled={exportFeedback === 'copied'}
                      title={copyMode === 'concise' 
                        ? "简洁版：适合直接发消息" 
                        : "完整版：适合进文档/正式复盘"}
                    >
                      {exportFeedback === 'copied' 
                        ? '✓ 已复制' 
                        : copyMode === 'concise' ? '复制简洁结论' : '复制完整结论'}
                    </button>
                    <button
                      className={`ghost-btn-big ${exportFeedback === 'md' ? 'export-success' : ''}`}
                      onClick={() => exportMinutes('md')}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'md' ? '✓ 已导出' : '导出 MD'}
                    </button>
                    <button
                      className={`primary-btn ${exportFeedback === 'share' ? 'export-success' : ''}`}
                      onClick={() => generateShareLink()}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'share' ? '✓ 已生成链接' : '生成在线分享链接'}
                    </button>
                    <button
                      className={`primary-btn ${exportFeedback === 'html' ? 'export-success' : ''}`}
                      onClick={() => exportMinutes('html')}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'html' ? '✓ 已导出，可分享复盘' : '导出 HTML（推荐复盘）'}
                    </button>
                    <button className="ghost-btn-big" onClick={returnHome}>返回工作台</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {error && <div className="error-banner">{error}</div>}
      </main>
      <aside className="info-panel">
        <div className="info-header">项目情报</div>
        <div className="project-card">
          <div className="project-card-name">{activeProject.name}</div>
          <div className="project-stat-grid">
            <div className="project-stat-box"><span>历史场次</span><b>{activeProject.meetings?.length ?? 0}</b></div>
            <div className="project-stat-box"><span>已入库决策</span><b>{activeProject.memory?.decisions?.length ?? activeProject.memory?.summaries?.length ?? 0}</b></div>
            <div className="project-stat-box"><span>风险登记</span><b>{activeProject.memory?.riskRegister?.length ?? activeProject.memory?.risks?.length ?? 0}</b></div>
            <div className="project-stat-box"><span>待审批记忆</span><b>{pendingMemoryChanges.length}</b></div>
          </div>
          {( (activeProject.memory?.decisions?.length || activeProject.memory?.summaries?.length || activeProject.memory?.riskRegister?.length || 0) > 0 ) && (
            <div className="memory-active-badge">✓ 记忆已激活 · 自动用于新审议</div>
          )}
        </div>
        <MemoryReviewPanel changes={pendingMemoryChanges} onApprove={approveMemoryChanges} onReject={rejectMemoryChanges} />
        {meeting?.workspace && playbackStarted && (
          <>
            <div className="info-header">本场审议实况</div>
            <WorkspacePanel workspace={meeting.workspace} isCompact={focusMode} />
          </>
        )}
        <div className="info-header">会议历史</div>
        <div className="history-list">
          {(activeProject.meetings?.length ?? 0) === 0 ? (
            <div className="history-empty">审批后的决策、风险和行动会沉淀在项目里。</div>
          ) : (
            (activeProject.meetings ?? []).map((item) => {
              const isConfirmingPermanent = permanentConfirmId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`history-item ${isConfirmingPermanent ? 'history-item--confirm' : ''}`}
                  title="右键或长按可彻底删除（不可撤销）"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    triggerPermanentDeleteConfirm(item);
                  }}
                  onTouchStart={() => {
                    longPressTimerRef.current = setTimeout(() => {
                      triggerPermanentDeleteConfirm(item);
                    }, 650);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onTouchMove={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                >
                  {/* 主按钮：承载「复盘查看」动作，语义清晰、无角色嵌套 */}
                  <button
                    type="button"
                    className="history-item-main"
                    aria-label={`查看历史会议复盘：${item.meeting.title}`}
                    onClick={() => viewHistoryMeeting(item)}
                  >
                    <div className="history-item-body">
                      <span className="history-item-title">{item.meeting.title}</span>
                      <span className="history-item-topic">{item.topic}</span>
                      <span className="history-item-meta">点击复盘</span>
                    </div>
                  </button>

                  {isConfirmingPermanent ? (
                    /* 就地确认条（A方案）：始终保留上方正常内容（标题+议题可见），下方追加紧凑确认区 */
                    <div className="history-confirm-bar">
                      <div className="history-confirm-text">
                        确定要彻底删除吗？此操作无法撤销。
                      </div>
                      <div className="history-confirm-actions">
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={(e) => { e.stopPropagation(); cancelPermanentDelete(); }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="ghost-btn ghost-btn--danger"
                          onClick={(e) => { e.stopPropagation(); confirmPermanentDelete(item.id); }}
                        >
                          彻底删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 普通删除按钮：hover 显露，触屏常驻；可撤销 */
                    <button
                      type="button"
                      className="history-delete-btn"
                      aria-label={`删除历史会议：${item.meeting.title}（可撤销）`}
                      title="删除此历史记录（可撤销，5秒内可撤销）"
                      onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          deleteHistoryItem(item);
                        }
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
      {editingId && <PersonaDrawer persona={personas[editingId]} onSave={(persona) => { setPersonas({ ...personas, [persona.id]: persona }); notify('专家配置已更新'); }} onClose={() => setEditingId(null)} />}
      {/* 普通 toast（短反馈） */}
      {toast && typeof toast === 'string' && !lastDeleted && <div className="toast" role="status">{toast}</div>}
      {/* 删除后的可撤销 toast（5s 窗口，带操作按钮 + 项目名 + 5s 提示，更用心） */}
      {lastDeleted && (
        <div className="toast toast--with-action" role="status" aria-live="polite">
          已删除「{lastDeleted.projectName || '当前项目'}」的历史会议
          <button
            type="button"
            className="toast-undo-btn"
            onClick={undoDeleteHistoryItem}
          >
            撤销
          </button>
          <span className="toast-countdown" aria-hidden="true">5s</span>
        </div>
      )}
    </div>
  );
}
