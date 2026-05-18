import fs from 'node:fs';
import path from 'node:path';

export function loadDotEnv(filePath = path.resolve(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) return false;
  process.loadEnvFile(filePath);
  return true;
}
