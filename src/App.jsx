import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bubble,
  ContinueDeliberationPanel,
  DeliberationOutcomePanel,
  DecisionPacketCard,
  DELIBERATION_PHASES,
  Logo,
  MemoryReviewPanel,
  ModeratorConsole,
  OnboardingWizard,
  PersonaDrawer,
  SetupGuidePanel,
  ScenarioManager,
  Stage,
  TaskPanel,
  VoteCard,
  WorkspacePanel,
} from './components.jsx';
import { DEFAULT_TOPIC, DEMO_MEETING, PERSONAS, PRESETS } from './data/personas.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useOnboarding } from './hooks/useOnboarding.js';
import { useTypewriter } from './hooks/useTypewriter.js';
import { formatMeetingMarkdown, formatMeetingHTML, sanitizeDownloadName } from './lib/minutes.js';
import { formatEvidenceMatrixExportPage } from './lib/evidenceMatrix.js';
import { filterMeetings } from './lib/historyFilter.js';
import { TOPIC_TEMPLATES } from './data/topicTemplates.js';
import {
  addTaskToProject,
  createDeliberationTask,
  migrateProject,
  removeTaskFromProject,
  setProjectActiveTask,
  updateTaskInProject,
} from './lib/deliberationTasks.js';
import {
  applyScenarioToWorkbench,
  findScenario,
  getScenarioRoster,
  listScenarios,
} from './lib/scenarios.js';
import {
  approveProjectMemoryChanges,
  archiveProject,
  buildContinuationContext,
  buildMeetingPayload,
  buildProjectMemoryContext,
  createDefaultProject,
  rejectProjectMemoryChanges,
  removeMeetingFromProject,
  restoreArchivedProject,
  updateProjectWithMeeting,
} from './lib/roundtable.js';
import {
  createMeetingRequest,
  regenerateTurnRequest,
  refreshClosureRequest,
  createSessionRequest,
  createShareRequest,
  extractTextRequest,
  getHealth,
  getShareRequest,
  syncProjectFiles,
} from './services/roundtableApi.js';
import LandingSite from './LandingSite.jsx';
import { getLandingPageFromPath, getLandingPath, isWorkbenchPath } from './lib/landingRoutes.js';
import { formatHealthCheckError, mergeHealthOnCheckFailure } from './lib/healthCheck.js';
import { MIN_ENV_SNIPPET, SETUP_STEPS } from './lib/setup.js';
import pkg from '../package.json';
import { Button, Chip, IconButton } from './ui/index.js';

const SIDEBAR_SCENARIO_LIMIT = 5;

function resolveAppView(pathname) {
  return isWorkbenchPath(pathname) ? 'workspace' : 'landing';
}

export default function App() {
  const [personas, setPersonas] = useLocalStorage('roundtable:personas', PERSONAS);
  const [presetId, setPresetId] = useLocalStorage('roundtable:presetId', 'product');
  const [userScenarios, setUserScenarios] = useLocalStorage('roundtable:userScenarios', []);
  const [scenarioPrefs, setScenarioPrefs] = useLocalStorage('roundtable:scenarioPrefs', {
    hiddenBuiltinIds: [],
    builtinOverrides: {},
  });
  const [selectedScenarioId, setSelectedScenarioId] = useLocalStorage('roundtable:selectedScenarioId', 'builtin:product');
  const [scenarioManagerOpen, setScenarioManagerOpen] = useState(false);
  const [projects, setProjects] = useLocalStorage('roundtable:projects', [createDefaultProject()]);
  const [archivedProjects, setArchivedProjects] = useLocalStorage('roundtable:archivedProjects', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage('roundtable:activeProjectId', 'default-project');
  const [theme, setTheme] = useLocalStorage('roundtable:theme', 'dark');
  const [landingLang, setLandingLang] = useLocalStorage('roundtable:landingLang', 'zh');
  const [viewMode, setViewMode] = useState(() => (
    typeof window !== 'undefined' ? resolveAppView(window.location.pathname) : 'landing'
  ));
  const [landingPage, setLandingPage] = useState(() => (
    typeof window !== 'undefined' ? getLandingPageFromPath(window.location.pathname) : 'home'
  ));
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
  const [mobileInfoPanelOpen, setMobileInfoPanelOpen] = useState(false);

  // For generation progress perception (simulated phase advance while waiting for backend)
  const [simPhaseIdx, setSimPhaseIdx] = useState(0);
  // Temp feedback for export buttons (state change + toast for closure)
  const [exportFeedback, setExportFeedback] = useState(null); // 'html' | 'md' | 'evidence' | null
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // History deletion with thoughtful undo (optimistic + 5s reversible window)
  const [loadedHistoryId, setLoadedHistoryId] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null); // { entry, projectId, projectName }
  const undoTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // For inline permanent delete confirmation (right-click / long-press)
  const [permanentConfirmId, setPermanentConfirmId] = useState(null); // which history item is in "confirm permanent delete" state
  const [followUpNote, setFollowUpNote] = useState('');
  const [focusSpeakerId, setFocusSpeakerId] = useState(null);
  const [regeneratingTurnIndex, setRegeneratingTurnIndex] = useState(null);
  const [turnRegenUndo, setTurnRegenUndo] = useState(null);
  const [refreshingClosure, setRefreshingClosure] = useState(false);
  const onboarding = useOnboarding({ health, viewMode });

  const projectList = useMemo(
    () => (Array.isArray(projects) && projects.length ? projects : [createDefaultProject()]).map(migrateProject),
    [projects],
  );
  const archivedProjectList = useMemo(
    () => (Array.isArray(archivedProjects) ? archivedProjects : []).map(migrateProject),
    [archivedProjects],
  );
  const activeProject = useMemo(() => projectList.find((project) => project.id === activeProjectId) || projectList[0], [projectList, activeProjectId]);
  const allScenarios = useMemo(() => listScenarios(userScenarios, scenarioPrefs), [userScenarios, scenarioPrefs]);
  const sidebarScenarios = useMemo(
    () => allScenarios.slice(0, SIDEBAR_SCENARIO_LIMIT),
    [allScenarios],
  );
  const hasMoreScenarios = allScenarios.length > SIDEBAR_SCENARIO_LIMIT;
  const selectedScenario = useMemo(
    () => findScenario(allScenarios, selectedScenarioId) || allScenarios[0],
    [allScenarios, selectedScenarioId],
  );
  const filteredHistoryMeetings = useMemo(
    () => filterMeetings(activeProject?.meetings, historySearchQuery),
    [activeProject?.meetings, historySearchQuery],
  );
  const showHistorySearch = (activeProject?.meetings?.length ?? 0) > 3;
  const preset = PRESETS[selectedScenario?.presetId ?? presetId] ?? PRESETS.product;
  const memoryEnabled = activeProject?.memoryEnabled !== false;
  const canDeleteProject = activeProject?.id !== 'default-project';
  const pendingMemoryChanges = activeProject?.pendingMemoryChanges ?? [];
  const allOnStage = useMemo(
    () => getScenarioRoster({ scenario: selectedScenario, personas }),
    [selectedScenario, personas],
  );
  const activeTask = useMemo(
    () => (activeProject?.tasks ?? []).find((t) => t.id === activeProject?.activeTaskId) || null,
    [activeProject],
  );

  const patchActiveProject = (fn) => {
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((p) => (p.id === activeProject.id ? fn(migrateProject(p)) : migrateProject(p)));
    });
  };

  const handleSelectScenario = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    const scenario = findScenario(allScenarios, scenarioId);
    if (!scenario) return;
    const { presetId: pid, topic: tplTopic } = applyScenarioToWorkbench(scenario);
    setPresetId(pid);
    if (tplTopic) setTopic(tplTopic);
    setMobileMenuOpen(false);
  };
  const projectMemoryContext = useMemo(() => buildProjectMemoryContext(activeProject), [activeProject]);
  const baseScript = useMemo(() => (playbackStarted ? (meeting.turns ?? []).map((turn) => ({ kind: 'turn', ...turn })) : []), [meeting, playbackStarted]);
  const currentTurn = currentIdx < baseScript.length ? baseScript[currentIdx] : null;
  const currentSpeaker = currentTurn ? personas[currentTurn.speaker] : null;
  const { revealed, done } = useTypewriter(currentTurn ? currentTurn.text : '', 1.25, status === 'generating');
  const transcriptRef = useRef(null);
  const outcomePanelRef = useRef(null);
  const continuePanelRef = useRef(null);
  const shouldScrollToOutcomeRef = useRef(false);

  // #1 Enhanced generation progress perception (reuses simPhaseIdx + DELIBERATION_PHASES, minimal addition)
  const genPhaseCount = DELIBERATION_PHASES.length;
  const genCurrentIdx = Math.min(simPhaseIdx, genPhaseCount - 1);
  const genProgressPct = Math.round(((genCurrentIdx + 1) / genPhaseCount) * 100);
  const genCurrentPhase = DELIBERATION_PHASES[genCurrentIdx];
  const genRemaining = Math.max(6, (genPhaseCount - genCurrentIdx - 1) * 6);
  const hasActiveMemory = !!(projectMemoryContext && projectMemoryContext.length > 20); // #4 让记忆价值被感知：生成中可见注入状态

  useEffect(() => {
    const effectiveTheme = !sharedMode && viewMode === 'landing' ? 'light' : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, viewMode, sharedMode]);

  useEffect(() => {
    document.body.dataset.appView = sharedMode || viewMode !== 'landing' ? 'workspace' : 'landing';
    return () => {
      delete document.body.dataset.appView;
    };
  }, [viewMode, sharedMode]);

  useEffect(() => {
    const syncFromLocation = () => {
      const pathname = window.location.pathname;
      setViewMode(resolveAppView(pathname));
      if (!isWorkbenchPath(pathname)) {
        setLandingPage(getLandingPageFromPath(pathname));
      }
    };
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  const navigateLanding = (page) => {
    const path = getLandingPath(page);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setViewMode('landing');
    setLandingPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  useEffect(() => {
    // 检查分享链接
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setSharedMode(true);
      setViewMode('workspace');
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

    getHealth().then(setHealth).catch(() => setHealth((prev) => mergeHealthOnCheckFailure(prev)));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      syncProjectFiles({ projects: projectList, archivedProjects: archivedProjectList, userScenarios })
        .catch((e) => {
          // Best-effort durability sync for project-memory FS snapshots.
          // Errors are non-fatal (localStorage state remains); surfaced to console for ops visibility.
          // Future: could surface via notify or doctor last-sync status.
          console.warn('[project-memory] snapshot sync failed (best-effort, non-fatal):', e?.message || e);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [projectList, archivedProjectList, userScenarios]);
  useEffect(() => {
    if (!currentTurn || !done || status === 'generating') return;
    const timer = setTimeout(() => {
      setHistory((prev) => [...prev, currentTurn]);
      if (currentIdx < baseScript.length - 1) setCurrentIdx(currentIdx + 1);
      else {
        shouldScrollToOutcomeRef.current = true;
        setShowVote(true);
      }
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

  useEffect(() => {
    if (!showVote || !shouldScrollToOutcomeRef.current) return;
    shouldScrollToOutcomeRef.current = false;
    const timer = setTimeout(() => {
      const preferContinue = health?.aiConfigured !== false
        && meetingSource !== 'demo'
        && !followUpNote.trim();
      const target = preferContinue
        ? continuePanelRef.current
        : (document.getElementById('finish-actions') ?? outcomePanelRef.current);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [showVote, health?.aiConfigured, meetingSource, followUpNote]);

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
    setFollowUpNote('');
    setFocusSpeakerId(null);
    setRegeneratingTurnIndex(null);
    setTurnRegenUndo(null);
  };
  const openLanding = (page = 'home') => {
    returnHome();
    setMobileMenuOpen(false);
    navigateLanding(page);
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

  const startMeeting = async (customTopic, { extraContextNotes = [], successMessage } = {}) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) {
      setError('请输入要审议的问题');
      return false;
    }
    const contextNotes = [projectMemoryContext, ...extraContextNotes].filter(Boolean);
    setStatus('generating');
    setError('');
    setShowVote(false);
    setFocusSpeakerId(null);
    try {
      const payload = await createMeetingRequest({ payload: buildMeetingPayload({ topic: finalTopic, presetId, contextNotes, roster: allOnStage }) });
      const entry = {
        id: Date.now(),
        topic: finalTopic,
        meeting: payload,
        contextNotes,
        source: 'live',
        savedAt: new Date().toISOString(),
      };
      const meetingMeta = {
        taskId: activeProject.activeTaskId || undefined,
        scenarioId: selectedScenario?.id,
      };
      setProjects((items) => {
        const list = Array.isArray(items) && items.length ? items : [activeProject];
        return list.map((project) => (
          project.id === activeProject.id ? updateProjectWithMeeting(project, entry, meetingMeta) : migrateProject(project)
        ));
      });
      setMeeting(payload);
      setMeetingSource('live');
      setPlaybackStarted(true);
      setHistory([]);
      setCurrentIdx(0);
      setTopic(finalTopic);
      setLoadedHistoryId(null);
      notify(successMessage || '审议已生成，正在回放结构化发言');
      return true;
    } catch (e) {
      setError(e.message || '启动审议失败，请检查模型配置');
      return false;
    } finally {
      setStatus('idle');
    }
  };

  const continueFromMeeting = async () => {
    if (!meeting || status === 'generating') return;
    if (health?.aiConfigured === false) {
      notify('请先配置 API Key 后再继续审议');
      return;
    }
    if (meetingSource === 'demo') {
      notify('演示场次不支持继续审议，请在工作台发起真实审议');
      return;
    }
    const continuation = buildContinuationContext({ topic, meeting, personas, userNote: followUpNote });
    const finalTopic = followUpNote.trim() || topic;
    await startMeeting(finalTopic, {
      extraContextNotes: [continuation],
      successMessage: '已基于上一场发起继续审议',
    });
    setFollowUpNote('');
  };

  const canRegenerateTurn = Boolean(
    meeting?.turns?.length
    && meetingSource !== 'demo'
    && health?.aiConfigured !== false
    && !sharedMode
    && showVote
    && status !== 'generating',
  );

  const applyMeetingSnapshot = (snapshot) => {
    setMeeting(snapshot);
    setHistory(snapshot.turns || []);
    setCurrentIdx(snapshot.turns?.length ?? 0);
    setShowVote(true);
    setPlaybackStarted(true);
    setProjects((items) => {
      const list = Array.isArray(items) && items.length ? items : [activeProject];
      return list.map((project) => {
        if (project.id !== activeProject.id) return project;
        const meetings = project.meetings ?? [];
        if (!meetings.length) return project;
        const targetId = loadedHistoryId ?? meetings[meetings.length - 1]?.id;
        if (!targetId) return project;
        return {
          ...project,
          meetings: meetings.map((entry) => (
            entry.id === targetId ? { ...entry, meeting: snapshot } : entry
          )),
        };
      });
    });
  };

  const regenerateTurn = async (turnIndex) => {
    if (!canRegenerateTurn || regeneratingTurnIndex !== null) return;
    setRegeneratingTurnIndex(turnIndex);
    setError('');
    try {
      const contextNotes = [projectMemoryContext].filter(Boolean);
      const { meeting: updated, meta } = await regenerateTurnRequest({
        payload: {
          meeting,
          turnIndex,
          ...buildMeetingPayload({ topic, presetId, contextNotes, roster: allOnStage }),
        },
      });
      setTurnRegenUndo({
        turnIndex: meta.turnIndex,
        meetingBefore: meeting,
      });
      applyMeetingSnapshot(updated);
      const name = personas[updated.turns[meta.turnIndex]?.speaker]?.name || '该角色';
      notify(`已重生成 ${name} 的第 ${meta.turnIndex + 1} 轮发言`);
    } catch (e) {
      setError(e.message || '发言重生成失败');
    } finally {
      setRegeneratingTurnIndex(null);
    }
  };

  const undoTurnRegeneration = () => {
    if (!turnRegenUndo?.meetingBefore) return;
    applyMeetingSnapshot(turnRegenUndo.meetingBefore);
    setTurnRegenUndo(null);
    notify('已撤销发言重生成');
  };

  const refreshClosure = async () => {
    if (!meeting?.turns?.length || meetingSource === 'demo' || health?.aiConfigured === false) return;
    setRefreshingClosure(true);
    setError('');
    try {
      const contextNotes = [projectMemoryContext].filter(Boolean);
      const updated = await refreshClosureRequest({
        payload: {
          meeting,
          ...buildMeetingPayload({ topic, presetId, contextNotes, roster: allOnStage }),
        },
      });
      applyMeetingSnapshot(updated);
      setTurnRegenUndo(null);
      notify('已根据最新发言重算投票与 Decision Packet');
    } catch (e) {
      setError(e.message || '收束重算失败');
    } finally {
      setRefreshingClosure(false);
    }
  };

  const recheckHealth = async ({ silent = false } = {}) => {
    try {
      const next = await getHealth();
      setHealth(next);
      if (!silent) {
        if (next.aiConfigured) notify('模型服务已就绪');
        else notify('仍未检测到 API Key，请确认 .env 并重启');
      }
      return { ok: true, health: next };
    } catch (error) {
      setHealth((prev) => mergeHealthOnCheckFailure(prev));
      const message = formatHealthCheckError(error);
      if (!silent) notify('健康检查失败，请确认服务已启动');
      return { ok: false, error: message };
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
    onboarding.complete();
  };
  const enterWorkbench = () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/app') {
      window.history.pushState({}, '', '/app');
    }
    setViewMode('workspace');
  };
  const showLandingDemo = () => {
    showDemoMeeting();
    if (typeof window !== 'undefined' && window.location.pathname !== '/app') {
      window.history.pushState({}, '', '/app');
    }
    setViewMode('workspace');
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
    if (format === 'evidence-html') {
      save(
        formatEvidenceMatrixExportPage({ ...base, generatedAt: new Date().toISOString() }),
        'text/html;charset=utf-8',
        '-证据矩阵.html',
      );
      setExportFeedback('evidence');
      notify('证据矩阵 HTML 已导出 · 含发言与证据池对照表');
    } else if (format === 'html' && typeof formatMeetingHTML === 'function') {
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

  const exportEvidenceMatrix = () => exportMinutes('evidence-html');

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
  const healthDetail = health?.aiConfigured
    ? `${health.providerName || '模型服务'} · ${health.model || '已配置'}`
    : '';
  const healthLabel = health
    ? (health.aiConfigured ? '可生成真实审议' : '演示模式 · 未配置 API Key')
    : '正在检查模型配置';
  const primaryActionLabel = status === 'generating'
    ? '审议生成中...'
    : health?.aiConfigured === false
      ? '查看演示审议'
      : '启动结构化审议';
  const showWorkbenchPrimary = !sharedMode && playbackStarted && !showVote;
  const showEmptySessionPrimary = !playbackStarted && !onboarding.shouldShow;
  const showSidebarStartCta = !playbackStarted && !projectCreatorOpen && !onboarding.shouldShow;
  const startDeliberationDisabled = status === 'generating' || (health?.aiConfigured !== false && !canStart);

  const handleStartDeliberation = () => {
    if (health?.aiConfigured === false) showDemoMeeting();
    else startMeeting();
  };

  const isMobileLayout = () => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  const scrollToWorkbenchSection = (id) => {
    if (isMobileLayout()) {
      setMobileInfoPanelOpen(true);
      setMobileMenuOpen(false);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  if (!sharedMode && viewMode === 'landing') {
    return (
      <LandingSite
        page={landingPage}
        lang={landingLang === 'en' ? 'en' : 'zh'}
        currentVersion={pkg.version}
        onNavigate={navigateLanding}
        onToggleLang={() => setLandingLang(landingLang === 'en' ? 'zh' : 'en')}
        onEnter={enterWorkbench}
        onDemo={showLandingDemo}
      />
    );
  }

  return (
    <div
      className="app"
      data-focus-mode={focusMode ? 'true' : 'false'}
      data-mobile-menu={mobileMenuOpen ? 'true' : 'false'}
      data-mobile-info-panel={mobileInfoPanelOpen ? 'open' : 'false'}
      data-generating={status === 'generating' ? 'true' : 'false'}
      data-shared={sharedMode ? 'true' : 'false'}
    >
      <button
        type="button"
        className="mobile-menu-backdrop"
        aria-label="关闭菜单"
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuOpen(false)}
      />
      <button
        type="button"
        className="mobile-info-panel-backdrop"
        aria-label="关闭任务与历史面板"
        tabIndex={mobileInfoPanelOpen ? 0 : -1}
        onClick={() => setMobileInfoPanelOpen(false)}
      />
      {!sharedMode && (
        <aside className="sidebar">
          <div className="brand-section">
            <Logo />
            <span className="brand-text">圆桌智库</span>
          </div>
          <div className="sidebar-scroll">
            <nav className="nav-group">
              <div className="nav-title">项目</div>
              <div className="select" style={{ maxWidth: 220 }}>
                <select value={activeProject?.id} onChange={(event) => { setActiveProjectId(event.target.value); setDeleteConfirmOpen(false); returnHome(); setMobileMenuOpen(false); }}>
                  {projectList.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              <div className="project-nav-actions">
                <button className="btn btn-subtle" onClick={() => { setProjectCreatorOpen((open) => !open); /* keep open for form */ }}>+ 新建</button>
                {deleteConfirmOpen ? (
                  <div className="project-delete-confirm">
                    <span>移入归档箱？</span>
                    <button className="btn btn-ghost" onClick={() => setDeleteConfirmOpen(false)}>取消</button>
                    <button className="btn btn-danger" onClick={deleteActiveProject}>删除</button>
                  </div>
                ) : (
                  <button className="btn btn-danger btn-sm" disabled={!canDeleteProject} onClick={() => setDeleteConfirmOpen(true)} title={canDeleteProject ? '删除当前项目' : '默认项目不能删除'}>
                    删除项目
                  </button>
                )}
              </div>
              {projectCreatorOpen && (
                <form className="project-create-form" onSubmit={createProject}>
                  <label htmlFor="project-name-input">新项目名称</label>
                  <input id="project-name-input" className="input" value={projectDraft} onChange={(event) => setProjectDraft(event.target.value)} placeholder="例如：AI 圆桌上线" maxLength={40} />
                  <div className="project-form-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setProjectCreatorOpen(false); setProjectDraft(''); }}>取消</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!projectDraft.trim()}>创建</button>
                  </div>
                </form>
              )}
              <div className="project-sidebar-controls">
                <div className="nav-hint">{memoryEnabled ? '批准后的结论、风险和分歧会进入项目记忆。' : '项目记忆已关闭，只保留会议记录。'}</div>
                <button className="btn btn-subtle memory-toggle" data-on={memoryEnabled ? 'true' : 'false'} aria-pressed={memoryEnabled} onClick={() => { toggleProjectMemory(); setMobileMenuOpen(false); }}>
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
                          <button className="btn btn-ghost btn-sm" onClick={() => setPurgeConfirmId(null)}>取消</button>
                          <button className="btn btn-danger btn-sm" onClick={() => purgeArchivedProject(project.id)}>确认彻底删除</button>
                        </div>
                      ) : (
                        <div className="archive-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => restoreProject(project)}>恢复</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setPurgeConfirmId(project.id)}>彻底删除</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </nav>
            <nav className="nav-group">
              <div className="nav-title">当前场景</div>
              <div className="nav-list">
                {sidebarScenarios.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn btn-subtle nav-btn ${selectedScenarioId === item.id ? 'active' : ''}`}
                    onClick={() => handleSelectScenario(item.id)}
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.name}{item.builtin ? '' : ' · 自定义'}</span>
                  </button>
                ))}
              </div>
              <div className="sidebar-scenario-links">
                {hasMoreScenarios && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="scenario-manage-btn"
                    onClick={() => { setScenarioManagerOpen(true); setMobileMenuOpen(false); }}
                  >
                    更多场景…
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="scenario-manage-btn"
                  onClick={() => { setScenarioManagerOpen(true); setMobileMenuOpen(false); }}
                >
                  管理场景
                </Button>
              </div>
            </nav>
            <nav className="nav-group">
              <div className="nav-title">任务</div>
              <p className="nav-hint sidebar-task-hint">
                {activeTask ? `当前：${activeTask.title}` : '未绑定任务 · 新审议可挂入任务线'}
              </p>
              <Button
                type="button"
                variant="subtle"
                className="nav-btn"
                onClick={() => scrollToWorkbenchSection('workbench-tasks')}
              >
                <span className="icon">务</span>
                <span className="label">审议任务 ({activeProject?.tasks?.length ?? 0})</span>
              </Button>
            </nav>
            <nav className="nav-group">
              <div className="nav-title">历史</div>
              <Button
                type="button"
                variant="subtle"
                className="nav-btn"
                onClick={() => scrollToWorkbenchSection('workbench-history')}
              >
                <span className="icon">史</span>
                <span className="label">会议记录 ({activeProject?.meetings?.length ?? 0})</span>
              </Button>
            </nav>
          </div>
          <div className="sidebar-foot">
            {showSidebarStartCta && (
              <Button
                type="button"
                variant={showEmptySessionPrimary ? 'secondary' : 'primary'}
                className="sidebar-primary-cta"
                loading={status === 'generating'}
                disabled={startDeliberationDisabled}
                onClick={handleStartDeliberation}
              >
                {primaryActionLabel}
              </Button>
            )}
            <Button
              type="button"
              variant="subtle"
              className="nav-btn"
              onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setMobileMenuOpen(false); }}
            >
              <span className="icon">{theme === 'light' ? '深' : '浅'}</span>
              <span className="label">外观：{theme === 'light' ? '深色' : '浅色'}</span>
            </Button>
            <Button
              type="button"
              variant="subtle"
              className="nav-btn"
              onClick={() => { showDemoMeeting(); setMobileMenuOpen(false); }}
            >
              <span className="icon">演</span>
              <span className="label">演示审议</span>
            </Button>
          </div>
        </aside>
      )}
      <main className="main-content">
        <header className="top-nav">
          {!sharedMode && (
            <IconButton
              className="mobile-only"
              label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </IconButton>
          )}
          {sharedMode && (
            <div className="brand-section" style={{ border: 'none', height: 'auto', padding: 0 }}>
              <Logo />
              <span className="brand-text" style={{ fontSize: '18px' }}>圆桌智库</span>
              <span className="share-badge">在线复盘模式</span>
            </div>
          )}
          <div className="topic-input-wrap" style={{ position: 'relative' }}>
            <textarea className="textarea topic-input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="输入一个需要权衡、证据、风险和行动的复杂问题..." disabled={sharedMode || parsingFile || status === 'generating'} rows={2} />
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
            {!sharedMode && (
              <Button variant="subtle" className="workbench-home-btn" onClick={openLanding} title="返回首页">首页</Button>
            )}
            <IconButton
              active={focusMode}
              label={focusMode ? '退出专注模式' : '进入专注模式'}
              onClick={() => setFocusMode(!focusMode)}
            >
              {focusMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3v5H3" />
                  <path d="M16 3v5h5" />
                  <path d="M8 21v-5H3" />
                  <path d="M16 21v-5h5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3H3v5" />
                  <path d="M16 3h5v5" />
                  <path d="M8 21H3v-5" />
                  <path d="M16 21h5v-5" />
                </svg>
              )}
            </IconButton>
            {playbackStarted && !sharedMode && (
              <IconButton label="回工作台" onClick={returnHome}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m3 11 9-8 9 8" />
                  <path d="M5 10v10h14V10" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              </IconButton>
            )}
            {sharedMode && (
              <Button variant="primary" onClick={saveToMyLibrary}>存入我的智库</Button>
            )}
            {sharedMode && (
              <IconButton label="我也要发起审议" onClick={() => { window.location.href = '/'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </IconButton>
            )}
            {showWorkbenchPrimary && (
              <Button
                variant="primary"
                loading={status === 'generating'}
                disabled={startDeliberationDisabled}
                onClick={handleStartDeliberation}
              >
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </header>
        <Stage
          allPersonas={allOnStage}
          speakerId={currentSpeaker?.id}
          onSeatClick={(persona) => {
            if (playbackStarted && !showVote) {
              setFocusSpeakerId((prev) => (prev === persona.id ? null : persona.id));
              return;
            }
            setEditingId(persona.id);
          }}
        />
        {focusSpeakerId && playbackStarted && !showVote && (
          <div className="speaker-focus-bar">
            <span>聚焦：{personas[focusSpeakerId]?.name || focusSpeakerId} 的发言</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFocusSpeakerId(null)}>显示全部</button>
          </div>
        )}
        {turnRegenUndo && showVote && (
          <div className="speaker-focus-bar">
            <span>刚完成一轮发言重生成</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={undoTurnRegeneration}>撤销</button>
          </div>
        )}
        <div className="transcript-area" ref={transcriptRef}>
          {onboarding.shouldShow && !playbackStarted && status !== 'generating' && (
            <OnboardingWizard
              step={onboarding.step}
              totalSteps={onboarding.totalSteps}
              health={health}
              snippet={MIN_ENV_SNIPPET}
              steps={SETUP_STEPS}
              onAdvance={onboarding.advance}
              onComplete={onboarding.complete}
              onSkip={onboarding.skip}
              onCopied={() => notify('最小 .env 已复制')}
              onCheckHealth={() => recheckHealth({ silent: true })}
              onStartDemo={showDemoMeeting}
              onStartFirstMeeting={() => startMeeting(
                topic.trim() || '我们是否应该把 AI 圆桌会议产品开放给第一批真实用户试用？',
              )}
            />
          )}
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
                <div className="gen-memory-cue">项目记忆已注入 · 历史结论/风险/分歧将参与本场认知碰撞</div>
              )}
              <p className="gen-meta">
                这不是多角色表演，而是多判断函数的受控碰撞。<br />
                系统会暴露关键分歧、证据缺口和下一步可选路径，再封装为 Decision Packet。
              </p>
            </div>
          ) : !playbackStarted ? (
            <div className="empty-session">
              <div className="empty-eyebrow">议事厅 · 本地决策档案</div>
              <h1>把复杂问题打磨成可执行判断</h1>
              <p>输入一个需要权衡证据、风险、用户心智和行动路径的问题。圆桌会按阶段暴露分歧、校准置信度，并把结果封装成可复盘的 Decision Packet。</p>
              {showEmptySessionPrimary && (
                <div className="empty-session-cta">
                  <Button
                    variant="primary"
                    className="empty-session-primary"
                    loading={status === 'generating'}
                    disabled={startDeliberationDisabled}
                    onClick={handleStartDeliberation}
                  >
                    {primaryActionLabel}
                  </Button>
                </div>
              )}
              <div className="trust-strip" aria-label="产品可信度说明">
                <span>本地优先</span>
                <span>API Key 只在服务端读取</span>
                <span>记忆需人工批准</span>
                <span title={healthDetail || undefined}>{healthLabel}</span>
              </div>
              <div className="question-coach">
                <div>
                  <b>适合圆桌的问题</b>
                  <span>高价值决策、多目标冲突、证据不完整、需要保留反对意见。</span>
                </div>
                <div>
                  <b>不适合圆桌的问题</b>
                  <span>简单事实查询、低风险润色、明确单步任务；这些更适合直接问单模型。</span>
                </div>
              </div>
              {health?.aiConfigured === false && !onboarding.shouldShow && (
                <SetupGuidePanel
                  snippet={MIN_ENV_SNIPPET}
                  steps={SETUP_STEPS}
                  onCopied={() => notify('最小 .env 配置已复制，粘贴到项目根目录后填写 API Key')}
                />
              )}
              <div className="starter-grid">
                <button type="button" className="starter-card btn btn-ghost" aria-label="启动产品认知压测" onClick={() => health?.aiConfigured === false ? setTopic('我们是否应该把 AI 圆桌会议产品开放给第一批真实用户试用？') : startMeeting('我们是否应该把 AI 圆桌会议产品开放给第一批真实用户试用？')}><b>产品认知压测</b><span>输出关键分歧、证据缺口、重开条件和用户下一步。</span></button>
                <button type="button" className="starter-card btn btn-ghost" aria-label="启动商业判断" onClick={() => health?.aiConfigured === false ? setTopic('如果我们要把这个产品做成可收费版本，最小可付费价值应该是什么？') : startMeeting('如果我们要把这个产品做成可收费版本，最小可付费价值应该是什么？')}><b>商业判断</b><span>碰撞价值假设、定价风险和验证路径。</span></button>
                <button type="button" className="starter-card btn btn-ghost" aria-label="启动示例演示" onClick={showDemoMeeting}><b>示例演示</b><span>无需 API Key，先观察完整审议流程与输出结构。</span></button>
              </div>
              <div className="template-picker">
                <div className="template-picker-label">
                  审议场景
                  {activeTask && <span className="active-task-pill">当前任务：{activeTask.title}</span>}
                </div>
                <div className="template-picker-chips">
                  {sidebarScenarios.map((s) => (
                    <Chip
                      key={s.id}
                      active={selectedScenarioId === s.id}
                      className="template-chip"
                      onClick={() => handleSelectScenario(s.id)}
                    >
                      <span className="template-chip-category">{s.builtin ? '内置' : '自定义'}</span>
                      {s.icon} {s.name}
                    </Chip>
                  ))}
                  {hasMoreScenarios && (
                    <Chip className="template-chip" onClick={() => setScenarioManagerOpen(true)}>更多</Chip>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="template-manage-link" onClick={() => setScenarioManagerOpen(true)}>
                    管理场景
                  </Button>
                </div>
              </div>
              <div className="template-picker template-picker--secondary">
                <div className="template-picker-label">议题快捷填入</div>
                <div className="template-picker-chips">
                  {TOPIC_TEMPLATES.map((tpl) => (
                    <Chip
                      key={tpl.id}
                      className="template-chip"
                      title={tpl.hint}
                      aria-label={`使用议题模板：${tpl.label}`}
                      onClick={() => {
                        setTopic(tpl.topic);
                        if (tpl.presetId) handleSelectScenario(`builtin:${tpl.presetId}`);
                      }}
                    >
                      <span className="template-chip-category">{tpl.category}</span>
                      {tpl.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="feed-container">
              {playbackStarted && status !== 'generating' && !showVote && (
                <ModeratorConsole 
                  phase={currentTurn?.phase || (history.length > 0 ? history[history.length - 1].phase : 'Frame')} 
                  status={status}
                  onAction={(action) => notify(`主持协议建议：${action === 'probe' ? '补充信息缺口' : action === 'summarize' ? '收束当前判断' : '优先处理核心分歧'}`)}
                />
              )}
              {history.map((turn, index) => (
                <Bubble
                  key={`${index}-${turn.speaker}-${turn.text?.slice(0, 24)}`}
                  persona={personas[turn.speaker]}
                  text={turn.text}
                  stance={turn.stance}
                  act={turn.act}
                  phase={turn.phase}
                  confidence={turn.confidence}
                  evidenceLabel={turn.evidenceLabel}
                  citations={turn.citations}
                  providerName={turn.providerName}
                  dimmed={focusSpeakerId && turn.speaker !== focusSpeakerId}
                  canRegenerate={canRegenerateTurn}
                  regenerating={regeneratingTurnIndex === index}
                  onRegenerate={() => regenerateTurn(index)}
                />
              ))}
              {currentTurn && (
                <Bubble
                  persona={currentSpeaker}
                  text={revealed}
                  isLive
                  isStreaming={!done}
                  stance={currentTurn.stance}
                  act={currentTurn.act}
                  phase={currentTurn.phase}
                  confidence={currentTurn.confidence}
                  evidenceLabel={currentTurn.evidenceLabel}
                  citations={currentTurn.citations}
                  providerName={currentTurn.providerName}
                  dimmed={focusSpeakerId && currentTurn.speaker !== focusSpeakerId}
                />
              )}
              {showVote && (
                <div className="final-block">
                  <div className="success-ceremony">
                    {meeting?.decisionPacket || meeting?.workspace
                      ? '审议闭环完成 · 决策纪要包已封装'
                      : '审议已结束 · 记录不完整，请查看下方或重算收束'}
                  </div>

                  <DeliberationOutcomePanel
                    meeting={meeting}
                    panelRef={outcomePanelRef}
                    pendingMemoryCount={pendingMemoryChanges.length}
                    showContinueLink={health?.aiConfigured !== false}
                  />

                  <h2 className="finish-actions-label">带走审议成果</h2>
                  <div id="finish-actions" className="finish-actions">
                    <button
                      className={`btn btn-primary ${exportFeedback === 'html' ? 'export-success' : ''}`}
                      onClick={() => exportMinutes('html')}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'html' ? '✓ 已导出，可分享复盘' : '导出 HTML 复盘包（推荐）'}
                    </button>
                    <button
                      className={`btn btn-ghost ${exportFeedback === 'copied' ? 'export-success' : ''}`}
                      onClick={() => copyCoreConclusions()}
                      disabled={exportFeedback === 'copied'}
                      title={copyMode === 'concise'
                        ? '简洁版：适合直接发消息'
                        : '完整版：适合进文档/正式复盘'}
                    >
                      {exportFeedback === 'copied'
                        ? '✓ 已复制'
                        : copyMode === 'concise' ? '复制核心结论（简洁）' : '复制核心结论（完整）'}
                    </button>
                    <button
                      className={`btn btn-ghost ${exportFeedback === 'share' ? 'export-success' : ''}`}
                      onClick={() => generateShareLink()}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'share' ? '✓ 已生成链接' : '生成在线分享链接'}
                    </button>
                    <button
                      className={`btn btn-ghost ${exportFeedback === 'md' ? 'export-success' : ''}`}
                      onClick={() => exportMinutes('md')}
                      disabled={!!exportFeedback}
                    >
                      {exportFeedback === 'md' ? '✓ 已导出' : '导出 MD 笔记'}
                    </button>
                    <button
                      className={`btn btn-ghost ${exportFeedback === 'evidence' ? 'export-success' : ''}`}
                      onClick={exportEvidenceMatrix}
                      disabled={!!exportFeedback}
                      title="按发言轮次与证据池导出对照表"
                    >
                      {exportFeedback === 'evidence' ? '✓ 已导出' : '导出证据矩阵 (HTML)'}
                    </button>
                    {health?.aiConfigured !== false && meetingSource !== 'demo' && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={refreshClosure}
                        disabled={refreshingClosure || regeneratingTurnIndex !== null}
                      >
                        {refreshingClosure ? '重算收束中…' : '重算投票与决策纪要包'}
                      </button>
                    )}
                    <button className="btn btn-ghost" onClick={returnHome} title="返回工作台继续此项目或发起新审议">返回工作台（继续项目）</button>
                  </div>

                  <div className="copy-mode-switch">
                    <span className="copy-mode-label">复制模式</span>
                    <button
                      className={`btn btn-ghost ${copyMode === 'concise' ? 'active' : ''}`}
                      onClick={() => {
                        setCopyMode('concise');
                        localStorage.setItem('roundtable:copyMode', 'concise');
                      }}
                    >
                      简洁
                    </button>
                    <button
                      className={`btn btn-ghost ${copyMode === 'formal' ? 'active' : ''}`}
                      onClick={() => {
                        setCopyMode('formal');
                        localStorage.setItem('roundtable:copyMode', 'formal');
                      }}
                    >
                      完整
                    </button>
                  </div>

                  {health?.aiConfigured !== false && (
                    <>
                      <h2 className="finish-actions-label">后续动作</h2>
                      <ContinueDeliberationPanel
                        panelRef={continuePanelRef}
                        value={followUpNote}
                        onChange={setFollowUpNote}
                        onSubmit={continueFromMeeting}
                        disabled={status === 'generating' || meetingSource === 'demo'}
                        disabledHint={meetingSource === 'demo'
                          ? '演示场次不支持继续审议，请在工作台发起真实审议'
                          : undefined}
                      />
                    </>
                  )}

                  <div className="section-divider">— 完整审议记录 —</div>

                  <WorkspacePanel workspace={meeting.workspace} />
                  <DecisionPacketCard packet={meeting.decisionPacket} />
                  <VoteCard vote={meeting.vote} personas={personas} />

                  {meeting?.usage && (
                    <div className="usage-indicator">
                      本次审议共消耗约 <b>{(meeting.usage.totalTokens / 1000).toFixed(1)}k</b> Tokens
                      <span className="usage-detail">(入: {meeting.usage.inputTokens} / 出: {meeting.usage.outputTokens})</span>
                    </div>
                  )}
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
            <div className="project-stat-box"><span>记忆待审</span><b>{pendingMemoryChanges.length}</b></div>
          </div>
          {( (activeProject.memory?.decisions?.length || activeProject.memory?.summaries?.length || activeProject.memory?.riskRegister?.length || 0) > 0 ) && (
            <div className="memory-active-badge">✓ 记忆已激活 · 自动用于新审议</div>
          )}
        </div>
        <MemoryReviewPanel changes={pendingMemoryChanges} onApprove={approveMemoryChanges} onReject={rejectMemoryChanges} />
        <div id="workbench-tasks">
        <TaskPanel
          project={activeProject}
          scenarios={allScenarios}
          onSetActiveTask={(taskId) => {
            patchActiveProject((p) => setProjectActiveTask(p, taskId));
            notify(taskId ? '已切换当前审议任务' : '已取消任务绑定（新会议将不归入任务）');
          }}
          onCreateTask={({ title, goal, scenarioId }) => {
            try {
              const task = createDeliberationTask({ title, goal, scenarioId: scenarioId || selectedScenarioId });
              patchActiveProject((p) => addTaskToProject(p, task));
              if (scenarioId) handleSelectScenario(scenarioId);
              notify('审议任务已创建并设为当前');
            } catch (e) {
              notify(e.message || '创建失败');
            }
          }}
          onUpdateTask={(taskId, patch) => patchActiveProject((p) => updateTaskInProject(p, taskId, patch))}
          onDeleteTask={(taskId) => {
            patchActiveProject((p) => removeTaskFromProject(p, taskId));
            notify('任务已删除');
          }}
          onOpenMeeting={viewHistoryMeeting}
        />
        </div>
        {meeting?.workspace && playbackStarted && (
          <>
            <div className="info-header">本场审议实况</div>
            <WorkspacePanel workspace={meeting.workspace} isCompact={focusMode} />
          </>
        )}
        <div id="workbench-history" className="info-header">历史</div>
        {showHistorySearch && (
          <input
            id="history-search"
            className="history-search"
            type="search"
            placeholder="搜索议题或标题…"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            aria-label="搜索会议历史"
          />
        )}
        <div className="history-list">
          {(activeProject.meetings?.length ?? 0) === 0 ? (
            <div className="history-empty">审批后的决策、风险和行动会沉淀在项目里。</div>
          ) : filteredHistoryMeetings.length === 0 ? (
            <div className="history-empty">无匹配会议</div>
          ) : (
            filteredHistoryMeetings.map((item) => {
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
                    className="history-item-main btn btn-ghost"
                    aria-label={`查看历史会议复盘：${item.meeting.title}`}
                    onClick={() => viewHistoryMeeting(item)}
                  >
                    <div className="history-item-body">
                      <span className="history-item-title" title={item.topic || item.meeting.title}>{item.topic || item.meeting.title}</span>
                      {item.topic && item.meeting.title && item.topic !== item.meeting.title && (
                        <span className="history-item-topic" title={item.meeting.title}>{item.meeting.title}</span>
                      )}
                      <span className="history-item-meta">
                        {item.savedAt ? new Date(item.savedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未记录时间'}
                        {' · '}
                        {item.meeting?.turns?.length ?? 0} 轮发言
                        {item.taskId && (() => {
                          const t = (activeProject.tasks ?? []).find((x) => x.id === item.taskId);
                          return t ? ` · 任务：${t.title}` : '';
                        })()}
                        {item.source === 'demo' ? ' · 演示' : ''}
                        {' · 点击复盘'}
                      </span>
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
                          className="btn btn-ghost"
                          onClick={(e) => { e.stopPropagation(); cancelPermanentDelete(); }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
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
                      className="btn btn-subtle history-delete-btn"
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
            className="btn btn-ghost toast-undo-btn"
            onClick={undoDeleteHistoryItem}
          >
            撤销
          </button>
          <span className="toast-countdown" aria-hidden="true">5s</span>
        </div>
      )}
      <ScenarioManager
        open={scenarioManagerOpen}
        lang={landingLang === 'en' ? 'en' : 'zh'}
        userScenarios={userScenarios}
        scenarioPrefs={scenarioPrefs}
        selectedScenarioId={selectedScenarioId}
        onClose={() => setScenarioManagerOpen(false)}
        onSaveUserScenarios={setUserScenarios}
        onSaveScenarioPrefs={setScenarioPrefs}
        onSelectScenario={(id) => {
          handleSelectScenario(id);
          setScenarioManagerOpen(false);
        }}
      />
    </div>
  );
}
