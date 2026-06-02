/** Minimal .env template for first-run setup (mirrors .env.example STEP 1). */
export const MIN_ENV_SNIPPET = `AI_PROVIDERS=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5`;

export const SETUP_STEPS = [
  '复制下方配置到项目根目录的 .env 文件',
  '填写 OPENAI_API_KEY（或你所用供应商的 Key）',
  '运行 npm run doctor 检查配置后重启 npm run dev',
];

export async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}