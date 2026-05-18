const VALID_PROVIDER_TYPES = new Set(['openai', 'claude']);

const KNOWN_PROVIDER_DEFAULTS = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    model: 'gpt-5.5',
    baseUrl: '',
  },
  deepseek: {
    type: 'openai',
    name: 'DeepSeek',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  },
  glm: {
    type: 'openai',
    name: 'GLM',
    model: 'glm-4.5',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  claude: {
    type: 'claude',
    name: 'Claude',
    model: 'claude-sonnet-4-5-20250929',
    baseUrl: 'https://api.anthropic.com',
  },
};

function readPort(value) {
  const port = Number(value ?? 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT 必须是 1-65535 的整数');
  }
  return port;
}

function toEnvPrefix(id) {
  return id.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function parseProviderIds(env) {
  if (env.AI_PROVIDERS) {
    return env.AI_PROVIDERS
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  const inferred = Object.keys(KNOWN_PROVIDER_DEFAULTS).filter((id) => {
    const prefix = toEnvPrefix(id);
    return Boolean(env[`${prefix}_API_KEY`] || (id === 'claude' && env.ANTHROPIC_API_KEY));
  });

  return inferred.length > 0 ? inferred : [env.AI_PROVIDER || 'openai'];
}

function parseRoleProviders(value = '', providerIds = []) {
  const allowed = new Set(providerIds);
  return Object.fromEntries(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split(':').map((part) => part.trim()))
      .filter(([role, provider]) => role && allowed.has(provider)),
  );
}

function readPositiveInteger(value, fallback, label) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${label} 必须是正整数`);
  }
  return number;
}

function readProviderConfig(id, env) {
  const prefix = toEnvPrefix(id);
  const defaults = KNOWN_PROVIDER_DEFAULTS[id] ?? {
    type: 'openai',
    name: id,
    model: id,
    baseUrl: '',
  };
  const type = env[`${prefix}_TYPE`] || defaults.type;
  if (!VALID_PROVIDER_TYPES.has(type)) {
    throw new Error(`${prefix}_TYPE 必须是 openai 或 claude`);
  }

  return {
    id,
    type,
    name: env[`${prefix}_NAME`] || defaults.name,
    apiKey: env[`${prefix}_API_KEY`] || (id === 'claude' ? env.ANTHROPIC_API_KEY : '') || '',
    model: env[`${prefix}_MODEL`] || (id === 'claude' ? env.ANTHROPIC_MODEL : '') || defaults.model,
    baseUrl: env[`${prefix}_BASE_URL`] || (id === 'claude' ? env.ANTHROPIC_BASE_URL : '') || defaults.baseUrl,
    apiVersion: env[`${prefix}_API_VERSION`] || (id === 'claude' ? env.ANTHROPIC_VERSION : '') || '2023-06-01',
    maxTokens: readPositiveInteger(env[`${prefix}_MAX_TOKENS`], 8192, `${prefix}_MAX_TOKENS`),
  };
}

function readSessionSecret(env, providers) {
  const firstKey = Object.values(providers).find((provider) => provider.apiKey)?.apiKey;
  return env.SESSION_SECRET || env.APP_ACCESS_CODE || firstKey || 'dev-session-secret';
}

export function loadConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const providerIds = parseProviderIds(env);
  const providers = Object.fromEntries(providerIds.map((id) => [id, readProviderConfig(id, env)]));
  const configuredProviders = Object.values(providers)
    .filter((providerConfig) => providerConfig.apiKey)
    .map((providerConfig) => providerConfig.id);
  const primaryProviderId = env.PRIMARY_PROVIDER || env.AI_PROVIDER || configuredProviders[0] || providerIds[0];
  const primary = providers[primaryProviderId] ?? providers[providerIds[0]];

  return {
    env: isProduction ? 'production' : 'development',
    isProduction,
    host: env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'),
    port: readPort(env.PORT),
    accessCode: env.APP_ACCESS_CODE || '',
    security: {
      sessionSecret: readSessionSecret(env, providers),
      sessionMaxAgeMs: readPositiveInteger(env.SESSION_MAX_AGE_HOURS, 12, 'SESSION_MAX_AGE_HOURS') * 60 * 60 * 1000,
      dailyMeetingLimit: readPositiveInteger(env.DAILY_MEETING_LIMIT, 80, 'DAILY_MEETING_LIMIT'),
    },
    ai: primary,
    roundtable: {
      providerIds,
      configuredProviders,
      roleProviders: parseRoleProviders(env.ROLE_PROVIDERS, providerIds),
    },
    providers,
    openai: providers.openai,
    claude: providers.claude,
  };
}
