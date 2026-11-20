import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/env.js';
import { seedDatabase } from './seed.js';
import type { Announcement, CommentItem, RegistrationRecord, User } from '../types/index.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.dirname(config.databasePath), { recursive: true });

export const db = new DatabaseSync(config.databasePath);
db.exec('PRAGMA foreign_keys = ON;');

// Apply schema
let schemaSql = '';
const candidatePaths = [
  path.join(directory, 'schema.sql'),
  path.resolve(directory, '..', '..', 'src', 'database', 'schema.sql'),
  path.resolve(directory, '..', '..', 'database', 'schema.sql'),
];

for (const p of candidatePaths) {
  try {
    schemaSql = readFileSync(p, 'utf8');
    break;
  } catch {}
}

if (!schemaSql) {
  throw new Error('schema.sql file not found in candidates: ' + candidatePaths.join(', '));
}

db.exec(schemaSql);

// Column migration check for users
const userColumns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
if (!userColumns.some(({ name }) => name === 'password_hash')) {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
}

// Column migration check for registrations (check-in feature)
const regColumns = db.prepare('PRAGMA table_info(registrations)').all() as { name: string }[];
if (!regColumns.some(({ name }) => name === 'checked_in')) {
  db.exec('ALTER TABLE registrations ADD COLUMN checked_in INTEGER NOT NULL DEFAULT 0');
}
if (!regColumns.some(({ name }) => name === 'checked_in_at')) {
  db.exec('ALTER TABLE registrations ADD COLUMN checked_in_at TEXT');
}

// Seed initial data asynchronously
seedDatabase(db).catch((err) => {
  console.error('Failed to seed database:', err);
});

export function getAnnouncementById(id: number, userId: string = 'anonymous'): Announcement | null {
  const row = db.prepare(`
    SELECT
      id, title, ai_summary AS aiSummary, content, category, target,
      created_at AS date, pinned, has_pdf AS hasPdf, event_date AS eventDate,
      ack_count AS ackCount, seats_max AS seatsMax, seats_taken AS seatsTaken,
      EXISTS (
        SELECT 1 FROM acknowledgements
        WHERE announcement_id = announcements.id AND user_id = ?
      ) AS acknowledged,
      EXISTS (
        SELECT 1 FROM registrations
        WHERE announcement_id = announcements.id AND user_id = ?
      ) AS registered
    FROM announcements
    WHERE id = ?
  `).get(userId, userId, id) as any;

  if (!row) return null;

  const comments = db.prepare(`
    SELECT id, announcement_id AS announcementId, author, text, is_teacher AS isTeacher, created_at AS createdAt
    FROM comments
    WHERE announcement_id = ?
    ORDER BY id ASC
  `).all(id) as any[];

  return {
    ...row,
    id: Number(row.id),
    pinned: Boolean(row.pinned),
    hasPdf: Boolean(row.hasPdf),
    ackCount: Number(row.ackCount),
    seatsMax: row.seatsMax === null ? null : Number(row.seatsMax),
    seatsTaken: Number(row.seatsTaken),
    acknowledged: Boolean(row.acknowledged),
    registered: Boolean(row.registered),
    comments: comments.map((c) => ({
      ...c,
      id: Number(c.id),
      announcementId: Number(c.announcementId),
      isTeacher: Boolean(c.isTeacher),
    })),
  };
}

export function getAllAnnouncements(userId: string = 'anonymous'): Announcement[] {
  const rows = db.prepare('SELECT id FROM announcements ORDER BY created_at DESC, id DESC').all() as { id: number }[];
  return rows.map(({ id }) => getAnnouncementById(id, userId)).filter((a): a is Announcement => a !== null);
}

export function getRegisteredUsers(announcementId: number): RegistrationRecord[] {
  const rows = db.prepare(`
    SELECT
      registrations.announcement_id AS announcementId,
      registrations.user_id AS userId,
      registrations.registered_at AS registeredAt,
      registrations.checked_in AS checkedIn,
      registrations.checked_in_at AS checkedInAt,
      users.name,
      users.email
    FROM registrations
    JOIN users ON users.id = registrations.user_id
    WHERE registrations.announcement_id = ?
    ORDER BY registrations.registered_at ASC
  `).all(announcementId) as any[];

  return rows.map((r) => ({
    announcementId: Number(r.announcementId),
    userId: String(r.userId),
    registeredAt: String(r.registeredAt),
    name: String(r.name),
    email: String(r.email),
    checkedIn: Boolean(r.checkedIn),
    checkedInAt: r.checkedInAt ? String(r.checkedInAt) : null,
  }));
}

export function checkInAttendee(
  announcementId: number,
  userIdOrCode: string,
  checkedIn: boolean = true
): { success: boolean; attendee?: RegistrationRecord; message: string } {
  // Can match userId directly or ticket pattern (DPU-ACT-[ID]-[HASH])
  let targetUserId = userIdOrCode.trim();

  // If ticket format: DPU-ACT-2-STUDENT...
  if (targetUserId.toUpperCase().startsWith('DPU-ACT-')) {
    const parts = targetUserId.split('-');
    const codePrefix = parts[3] || '';
    const found = db.prepare(`
      SELECT user_id AS userId FROM registrations
      WHERE announcement_id = ? AND UPPER(user_id) LIKE ?
    `).get(announcementId, `%${codePrefix.toUpperCase()}%`) as { userId: string } | undefined;

    if (found) {
      targetUserId = found.userId;
    }
  }

  const existing = db.prepare(`
    SELECT 1 FROM registrations WHERE announcement_id = ? AND user_id = ?
  `).get(announcementId, targetUserId);

  if (!existing) {
    return { success: false, message: 'ไม่พบข้อมูลการลงทะเบียนในกิจกรรมนี้' };
  }

  const now = checkedIn ? new Date().toISOString() : null;
  db.prepare(`
    UPDATE registrations
    SET checked_in = ?, checked_in_at = ?
    WHERE announcement_id = ? AND user_id = ?
  `).run(checkedIn ? 1 : 0, now, announcementId, targetUserId);

  const updatedUsers = getRegisteredUsers(announcementId);
  const attendee = updatedUsers.find((u) => u.userId === targetUserId);

  return {
    success: true,
    attendee,
    message: checkedIn ? 'เช็คชื่อเข้างานสำเร็จ' : 'ยกเลิกการเช็คชื่อแล้ว',
  };
}
