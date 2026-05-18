import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const SHARES_DIR = 'server/shares';

export async function saveShare({ rootDir, meeting }) {
  const id = randomUUID();
  const filePath = path.join(rootDir, SHARES_DIR, `${id}.json`);
  const data = JSON.stringify({
    ...meeting,
    sharedAt: new Date().toISOString(),
  });
  
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data, 'utf-8');
  
  return id;
}

export async function getShare({ rootDir, id }) {
  // Validate ID format to prevent directory traversal
  if (!/^[a-z0-9-]{36}$/i.test(id)) {
    throw new Error('Invalid share ID format');
  }
  
  const filePath = path.join(rootDir, SHARES_DIR, `${id}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
