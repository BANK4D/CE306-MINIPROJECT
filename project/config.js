import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectEnvPath = path.join(projectDirectory, '.env');

if (existsSync(projectEnvPath)) dotenv.config({ path: projectEnvPath });
