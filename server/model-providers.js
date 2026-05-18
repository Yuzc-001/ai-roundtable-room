import OpenAI from 'openai';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function joinClaudeMessagesUrl(baseUrl) {
  const clean = trimTrailingSlash(baseUrl || 'https://api.anthropic.com');
  if (clean.endsWith('/v1/messages')) return clean;
  return clean.endsWith('/v1') ? `${clean}/messages` : `${clean}/v1/messages`;
}

export function createOpenAICompatibleProvider(settings, { client } = {}) {
  const openai = client ?? new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || undefined,
    timeout: 60_000,
  });

  return {
    id: settings.id,
    type: 'openai',
    name: settings.name,
    model: settings.model,
    async generate({ systemPrompt, userPrompt }) {
      const completion = await openai.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: settings.maxTokens,
      });
      const message = completion.choices?.[0]?.message;
      if (message?.refusal) throw new Error(message.refusal);
      if (!message?.content) throw new Error('模型没有返回内容');
      return {
        content: message.content,
        usage: {
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    },
  };
}

export function createClaudeCompatibleProvider(settings, { fetchImpl = fetch } = {}) {
  return {
    id: settings.id,
    type: 'claude',
    name: settings.name,
    model: settings.model,
    async generate({ systemPrompt, userPrompt }) {
      const response = await fetchImpl(joinClaudeMessagesUrl(settings.baseUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': settings.apiVersion,
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: settings.maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Claude API 请求失败：${response.status} ${body.slice(0, 240)}`);
      }

      const payload = await response.json();
      if (payload.stop_reason === 'refusal') throw new Error('模型拒绝生成这场会议');
      const text = (payload.content ?? [])
        .filter((block) => block?.type === 'text' && block.text)
        .map((block) => block.text)
        .join('\n')
        .trim();

      if (!text) throw new Error('模型没有返回内容');
      return {
        content: text,
        usage: {
          inputTokens: payload.usage?.input_tokens || 0,
          outputTokens: payload.usage?.output_tokens || 0,
          totalTokens: (payload.usage?.input_tokens || 0) + (payload.usage?.output_tokens || 0),
        },
      };
    },
  };
}

export function createModelProvider(config) {
  const providers = {};
  for (const id of config.roundtable.configuredProviders) {
    const settings = config.providers[id];
    if (!settings) continue;
    providers[id] = settings.type === 'claude'
      ? createClaudeCompatibleProvider(settings)
      : createOpenAICompatibleProvider(settings);
  }

  const primary = providers[config.ai.id] ?? Object.values(providers)[0];
  return {
    defaultProvider: primary,
    providers,
    roleProviders: config.roundtable.roleProviders,
    providerIds: Object.keys(providers),
    generate: (request) => primary.generate(request),
  };
}
