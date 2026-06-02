/** Preserve prior health fields when a recheck fails (e.g. keep aiConfigured). */
export function mergeHealthOnCheckFailure(previousHealth) {
  const base = previousHealth && typeof previousHealth === 'object' ? previousHealth : {};
  return { ...base, ok: false };
}

export function formatHealthCheckError(error) {
  return error?.message || '无法连接 /api/health，请确认 npm run dev 已启动';
}

/** Verify step always allows advancing to demo (step 3) without API Key. */
export function isVerifyStepContinueDisabled() {
  return false;
}

export function getVerifyStepContinueLabel(aiReady) {
  return aiReady ? '继续' : '暂不配置，进入演示步骤';
}