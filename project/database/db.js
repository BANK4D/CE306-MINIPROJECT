import '../config.js';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { seedDatabase } from './seed.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(directory, 'data', 'announcements.sqlite');

mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(readFileSync(path.join(directory, 'schema.sql'), 'utf8'));
const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some(({ name }) => name === 'password_hash')) {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
}
seedDatabase(db);
