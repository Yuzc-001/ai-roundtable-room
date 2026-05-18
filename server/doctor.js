import { loadConfig } from './config.js';
import { loadDotEnv } from './env.js';

const envLoaded = loadDotEnv();
const config = loadConfig();

const checks = [
  ['Node', process.versions.node],
  ['Mode', config.env],
  ['Host', config.host],
  ['Port', String(config.port)],
  ['Provider', config.ai.name],
  ['Model', config.ai.model],
  ['Configured Providers', config.roundtable.configuredProviders.join(', ') || 'none'],
  ['API Keys', config.roundtable.configuredProviders.length > 0 ? 'configured' : 'missing'],
  ['Access Code', config.accessCode ? 'enabled' : 'disabled'],
  ['Session Cookie', config.accessCode ? 'required' : 'not required'],
  ['Daily Meeting Limit', String(config.security.dailyMeetingLimit)],
  ['.env', envLoaded ? 'loaded' : 'not found'],
];

console.log('AI 圆桌会议室诊断');
console.log('────────────────────');
for (const [label, value] of checks) {
  console.log(`${label}: ${value}`);
}

if (!config.ai.apiKey) {
  const keyName = `${config.ai.id.toUpperCase()}_API_KEY`;
  console.log(`\n问题：${keyName} 未配置。应用可以打开示例会议，但不能生成真实会议。`);
}

console.log('\n下一步：');
if (!envLoaded) {
  console.log('1. 复制 .env.example 为 .env。');
  console.log('2. 填写 OPENAI_API_KEY，必要时填写 OPENAI_BASE_URL 和 OPENAI_MODEL。');
  console.log('3. 重新运行 npm run doctor。');
} else if (config.roundtable.configuredProviders.length === 0) {
  const keyName = `${config.ai.id.toUpperCase()}_API_KEY`;
  console.log(`1. 打开 .env，填写 ${keyName}。`);
  console.log('2. 如果你使用中转或兼容接口，同时填写对应 BASE_URL 和 MODEL。');
  console.log('3. 保存后重启服务。');
} else {
  console.log('配置可用于生成真实会议。运行 npm run dev 或快速启动脚本打开应用。');
}
