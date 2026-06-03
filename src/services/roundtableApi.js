export async function getHealth() {
  const response = await fetch('/api/health');
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new Error(body.error || `健康检查失败 (${response.status})`);
  }
  return body;
}

export async function getProjectFilesInfo() {
  const response = await fetch('/api/project-files');
  return response.json();
}

export async function syncProjectFiles({ projects, archivedProjects, userScenarios }) {
  const response = await fetch('/api/project-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ projects, archivedProjects, userScenarios }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '项目本地文件夹同步失败');
  return body;
}

export async function createSessionRequest({ accessCode }) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ accessCode }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '访问验证失败');
  return body;
}

const REASON_MESSAGES = {
  no_api_key: (body) =>
    `服务端未配置 ${body.keyName || 'API_KEY'}，无法生成真实会议。请在 .env 中填写后重启。`,
  auth_required: () => '请先输入访问码完成验证。',
  validation_error: (body) => body.error || '输入内容有误，请检查议题格式。',
  schema_mismatch: () => '模型返回格式异常，请重试一次。',
  provider_auth_error: () => '模型服务认证失败，请检查 API Key 是否正确。',
  provider_model_error: () => '模型名称不可用，请检查 .env 中的 MODEL 配置。',
  provider_rate_limit: () => '模型服务额度或频率受限，请稍后再试或更换供应商。',
  provider_connection_error: () => '模型服务连接失败，请检查 BASE_URL 和网络连接。',
  generation_failed: () => '会议生成失败，请稍后再试。',
};

export async function refreshClosureRequest({ payload, signal }) {
  const response = await fetch('/api/meetings/refresh-closure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    const resolver = REASON_MESSAGES[body.reason];
    const message = resolver ? resolver(body) : (body.error || '收束重算失败');
    throw new Error(message);
  }
  return body;
}

export async function regenerateTurnRequest({ payload, signal }) {
  const response = await fetch('/api/meetings/regenerate-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    const resolver = REASON_MESSAGES[body.reason];
    const message = resolver ? resolver(body) : (body.error || '发言重生成失败');
    throw new Error(message);
  }
  return body;
}

export async function assessTopicAdmissionRequest({ topic, admissionOverride = false }) {
  const response = await fetch('/api/topics/admission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ topic, admissionOverride }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '议题评估失败');
  return body;
}

export async function createDeliberationSessionRequest(payload) {
  const response = await fetch('/api/deliberation/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    const resolver = REASON_MESSAGES[body.reason];
    throw new Error(resolver ? resolver(body) : (body.error || '创建审议会话失败'));
  }
  return body;
}

export async function advanceDeliberationSessionRequest(sessionId, { signal } = {}) {
  const response = await fetch(`/api/deliberation/sessions/${sessionId}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
  });
  const body = await response.json();
  if (!response.ok) {
    const resolver = REASON_MESSAGES[body.reason];
    throw new Error(resolver ? resolver(body) : (body.error || '审议推进失败'));
  }
  return body;
}

export async function injectDeliberationSessionRequest(sessionId, { constraints, directive }) {
  const response = await fetch(`/api/deliberation/sessions/${sessionId}/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ constraints, directive }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '注入失败');
  return body;
}

export async function pauseDeliberationSessionRequest(sessionId) {
  const response = await fetch(`/api/deliberation/sessions/${sessionId}/pause`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '暂停失败');
  return body;
}

export async function resumeDeliberationSessionRequest(sessionId) {
  const response = await fetch(`/api/deliberation/sessions/${sessionId}/resume`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '继续失败');
  return body;
}

export async function ingestIntelligenceRequest({ urls = [], snippets = [] }) {
  const response = await fetch('/api/intelligence/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ urls, snippets }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '情报接入失败');
  return body;
}

export async function forkMeetingRequest({ meeting, turnIndex, label, intervention }) {
  const response = await fetch('/api/meetings/fork', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ meeting, turnIndex, label, intervention }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '分叉失败');
  return body;
}

export async function createMeetingRequest({ payload, signal }) {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    const resolver = REASON_MESSAGES[body.reason];
    const message = resolver ? resolver(body) : (body.error || '会议生成失败');
    throw new Error(message);
  }
  return body;
}

export async function extractTextRequest(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/extract-text', {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '文件解析失败');
  return body.text;
}

/**
 * 创建在线分享
 */
export async function createShareRequest({ meeting }) {
  const response = await fetch('/api/shares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ meeting }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '生成分享链接失败');
  return body.id;
}

/**
 * 获取在线分享内容
 */
export async function getShareRequest(id) {
  const response = await fetch(`/api/shares/${id}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '获取分享内容失败');
  return body;
}
