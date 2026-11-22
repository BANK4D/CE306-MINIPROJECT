import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// src/config (or dist/config) -> project root
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: path.resolve(projectRoot, process.env.DATABASE_PATH ?? 'database/data/announcements.sqlite'),
  sessionCookieName: 'dpu-session',
  sessionLifetimeMs: 7 * 24 * 60 * 60 * 1000,
  passwordHashLength: 64,
  uploadsDirectory: path.resolve(projectRoot, process.env.UPLOADS_PATH ?? 'database/uploads'),
  maxUploadBytes: 10 * 1024 * 1024,
  maxAttachmentsPerPost: 10,
  appDirectory: path.resolve(projectRoot, '..'),
  projectRoot,
};
