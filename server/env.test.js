import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { loadDotEnv } from './env.js';

const key = 'ROUND_TABLE_ENV_TEST_VALUE';
const createdDirs = [];

afterEach(async () => {
  delete process.env[key];
  await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('loadDotEnv', () => {
  test('loads env values from a file when present', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'roundtable-env-'));
    createdDirs.push(dir);
    const file = path.join(dir, '.env');
    await fs.writeFile(file, `${key}=loaded\n`);

    expect(loadDotEnv(file)).toBe(true);
    expect(process.env[key]).toBe('loaded');
  });

  test('returns false when no env file exists', () => {
    expect(loadDotEnv(path.join(os.tmpdir(), 'missing-roundtable-env-file'))).toBe(false);
  });
});
