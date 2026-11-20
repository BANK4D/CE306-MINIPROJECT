import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'package.json')) && existsSync(path.join(dir, 'database'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return path.resolve(startDir, '..');
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = findProjectRoot(currentDir);
const envPath = path.join(projectRoot, '.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(projectRoot, 'database', 'data', 'announcements.sqlite'),
  sessionCookieName: 'dpu-session',
  sessionLifetimeMs: 7 * 24 * 60 * 60 * 1000,
  passwordHashLength: 64,
  appDirectory: path.resolve(projectRoot, '..'),
  projectRoot,
};
