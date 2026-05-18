import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { loadDotEnv } from './env.js';

loadDotEnv();
const config = loadConfig();
const app = await createApp({ config });

app.listen(config.port, config.host, () => {
  const shownHost = config.host === '0.0.0.0' ? '127.0.0.1' : config.host;
  console.log(`AI 圆桌会议室运行中：http://${shownHost}:${config.port}`);
});
