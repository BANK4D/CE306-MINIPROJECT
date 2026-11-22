import express, { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';
import { checkInAttendee, db, getAllAnnouncements, getAnnouncementById, getRegisteredUsers } from '../database/db.js';
import {
  apiError,
  requireAuth,
  requireCsrf,
  requireTeacher,
  type RequestWithUser,
} from '../middlewares/auth.middleware.js';
import { realtimeService } from '../services/realtime.service.js';
import type { Category, Target } from '../types/index.js';

export const announcementsRouter = Router();

const categories = new Set<string>(['academic', 'scholarship', 'activity', 'general']);
const targets = new Set<string>(['all', 'student', 'teacher']);

function parseId(value: unknown): number {
  const id = Number(value);
  return Number.isSafeInteger(id) && id >= 1 ? id : 0;
}

// Shared validation for create (POST) and edit (PUT). Returns the clean fields or an error message.
function parseAnnouncementBody(body: any) {
  const { title, aiSummary, content, category, target, pinned = false, hasPdf = false, eventDate = null, seatsMax = null } = body ?? {};
  let error = '';
  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) error = 'หัวข้อประกาศต้องมีความยาว 1-200 ตัวอักษร';
  else if (typeof content !== 'string' || content.length > 50000) error = 'รายละเอียดประกาศไม่ถูกต้องหรือยาวเกินกำหนด';
  else if (!categories.has(category) || !targets.has(target)) error = 'หมวดหมู่หรือกลุ่มเป้าหมายไม่ถูกต้อง';
  else if (typeof pinned !== 'boolean' || typeof hasPdf !== 'boolean') error = 'ค่าปักหมุดหรือไฟล์แนบไม่ถูกต้อง';
  else if (eventDate !== null && (typeof eventDate !== 'string' || eventDate.length > 80)) error = 'วันจัดกิจกรรมไม่ถูกต้อง';
  else if (seatsMax !== null && (!Number.isInteger(seatsMax) || seatsMax < 1 || seatsMax > 100000)) error = 'จำนวนที่นั่งไม่ถูกต้อง';
  if (error) return { error };

  const summary =
    typeof aiSummary === 'string' && aiSummary.trim() ? aiSummary.trim().slice(0, 500) : `สรุปอัตโนมัติ: ${title.trim()}`;
  return { values: [title.trim(), summary, content, category, target, Number(pinned), Number(hasPdf), eventDate, seatsMax] as const };
}

// All announcement endpoints require authentication
announcementsRouter.use(requireAuth);

// Non-GET requests require CSRF protection
announcementsRouter.use((request, response, next) => {
  if (request.method === 'GET') return next();
  return requireCsrf(request, response, next);
});

// GET all announcements
announcementsRouter.get('/', (request: RequestWithUser, response) => {
  response.json(getAllAnnouncements(request.user!.id, request.user!.role));
});

// GET single announcement
announcementsRouter.get('/:id', (request: RequestWithUser, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }
  const announcement = getAnnouncementById(id, request.user!.id);
  if (!announcement || (announcement.target === 'teacher' && request.user!.role !== 'teacher')) return apiError(response, 404, 'ไม่พบประกาศ');
  response.json(announcement);
});

// POST create announcement (Teacher only)
announcementsRouter.post('/', requireTeacher, (request: RequestWithUser, response) => {
  const { error, values } = parseAnnouncementBody(request.body);
  if (!values) return apiError(response, 400, error);

  const [title, summary, content, category, target, pinned, hasPdf, eventDate, seatsMax] = values;
  const result = db.prepare(`
    INSERT INTO announcements (
      title, ai_summary, content, category, target, created_at, pinned,
      has_pdf, event_date, seats_max, seats_taken, ack_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
  `).run(title, summary, content, category, target, new Date().toISOString(), pinned, hasPdf, eventDate, seatsMax);

  const announcement = getAnnouncementById(Number(result.lastInsertRowid), request.user!.id);
  if (announcement) realtimeService.broadcastAnnouncementCreated(announcement);
  return response.status(201).json(announcement);
});

// PUT edit announcement (Teacher only)
announcementsRouter.put('/:id', requireTeacher, (request: RequestWithUser, response) => {
  const id = parseId(request.params.id);
  if (!id) return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  if (!db.prepare('SELECT 1 FROM announcements WHERE id = ?').get(id)) {
    return apiError(response, 404, 'ไม่พบประกาศที่ต้องการแก้ไข');
  }

  const { error, values } = parseAnnouncementBody(request.body);
  if (!values) return apiError(response, 400, error);

  db.prepare(`
    UPDATE announcements
    SET title = ?, ai_summary = ?, content = ?, category = ?, target = ?,
        pinned = ?, has_pdf = ?, event_date = ?, seats_max = ?
    WHERE id = ?
  `).run(...values, id);

  const updated = getAnnouncementById(id, request.user!.id);
  if (updated) realtimeService.broadcastAnnouncementUpdated(updated);
  return response.json(updated);
});

// DELETE announcement (Teacher only)
announcementsRouter.delete('/:id', requireTeacher, (request: RequestWithUser, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(id);
  if (!existing) return apiError(response, 404, 'ไม่พบประกาศที่ต้องการลบ');

  const storedFiles = db
    .prepare('SELECT stored_name AS storedName FROM attachments WHERE announcement_id = ?')
    .all(id) as { storedName: string }[];

  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
  for (const { storedName } of storedFiles) {
    unlink(path.join(config.uploadsDirectory, storedName)).catch(() => {});
  }

  // Real-time broadcast deletion
  realtimeService.broadcastAnnouncementDeleted(id);

  return response.json({ ok: true, deletedId: id });
});

// PATCH toggle pin status (Teacher only)
announcementsRouter.patch('/:id/pin', requireTeacher, (request: RequestWithUser, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const announcement = db.prepare('SELECT pinned FROM announcements WHERE id = ?').get(id) as { pinned: number } | undefined;
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');

  db.prepare('UPDATE announcements SET pinned = ? WHERE id = ?').run(announcement.pinned === 1 ? 0 : 1, id);

  const updated = getAnnouncementById(id, request.user!.id);
  if (updated) {
    realtimeService.broadcastAnnouncementUpdated(updated);
  }

  return response.json(updated);
});

// PUT acknowledgement toggle
announcementsRouter.put('/:id/acknowledgement', (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const { acknowledged } = request.body ?? {};

  if (!announcementId) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }
  if (typeof acknowledged !== 'boolean') {
    return apiError(response, 400, 'ข้อมูลการรับทราบไม่ถูกต้อง');
  }
  if (!db.prepare('SELECT 1 FROM announcements WHERE id = ?').get(announcementId)) {
    return apiError(response, 404, 'ไม่พบประกาศ');
  }

  if (acknowledged) {
    const result = db.prepare(`
      INSERT OR IGNORE INTO acknowledgements (announcement_id, user_id)
      VALUES (?, ?)
    `).run(announcementId, request.user!.id);

    if (result.changes > 0) {
      db.prepare('UPDATE announcements SET ack_count = ack_count + 1 WHERE id = ?').run(announcementId);
    }
  } else {
    const result = db.prepare(`
      DELETE FROM acknowledgements WHERE announcement_id = ? AND user_id = ?
    `).run(announcementId, request.user!.id);

    if (result.changes > 0) {
      db.prepare('UPDATE announcements SET ack_count = MAX(0, ack_count - 1) WHERE id = ?').run(announcementId);
    }
  }

  const updated = getAnnouncementById(announcementId, request.user!.id);
  if (updated) {
    realtimeService.broadcastAckChanged({
      announcementId,
      ackCount: updated.ackCount,
    });
  }

  return response.json(updated);
});

// POST register for activity
announcementsRouter.post('/:id/registration', (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  if (!announcementId) {
    return apiError(response, 400, 'ข้อมูลการลงทะเบียนไม่ถูกต้อง');
  }

  const announcement = db.prepare(`
    SELECT category, seats_max AS seatsMax, seats_taken AS seatsTaken
    FROM announcements WHERE id = ?
  `).get(announcementId) as { category: Category; seatsMax: number | null; seatsTaken: number } | undefined;

  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');
  if (announcement.category !== 'activity') {
    return apiError(response, 400, 'ประกาศนี้ไม่เปิดให้ลงทะเบียน');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db.prepare(`
      SELECT 1 FROM registrations WHERE announcement_id = ? AND user_id = ?
    `).get(announcementId, request.user!.id);

    if (existing) {
      db.exec('COMMIT');
      return response.json(getAnnouncementById(announcementId, request.user!.id));
    }

    const updated = db.prepare(`
      UPDATE announcements
      SET seats_taken = seats_taken + 1
      WHERE id = ? AND (seats_max IS NULL OR seats_taken < seats_max)
    `).run(announcementId);

    if (updated.changes === 0) {
      db.exec('ROLLBACK');
      return apiError(response, 409, 'กิจกรรมเต็มแล้ว');
    }

    db.prepare(`
      INSERT INTO registrations (announcement_id, user_id, registered_at)
      VALUES (?, ?, ?)
    `).run(announcementId, request.user!.id, new Date().toISOString());

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const updatedPost = getAnnouncementById(announcementId, request.user!.id);
  if (updatedPost) {
    realtimeService.broadcastRegistrationChanged({
      announcementId,
      seatsTaken: updatedPost.seatsTaken,
      seatsMax: updatedPost.seatsMax,
    });
  }

  return response.json(updatedPost);
});

// POST comment on announcement
announcementsRouter.post('/:id/comments', (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const { text } = request.body ?? {};

  if (!announcementId) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }
  if (!db.prepare('SELECT 1 FROM announcements WHERE id = ?').get(announcementId)) {
    return apiError(response, 404, 'ไม่พบประกาศ');
  }
  if (typeof text !== 'string' || text.trim().length < 1 || text.length > 2000) {
    return apiError(response, 400, 'ข้อความแสดงความคิดเห็นไม่ถูกต้อง');
  }

  const now = new Date().toISOString();
  const isTeacher = Number(request.user!.role === 'teacher');
  const result = db.prepare(`
    INSERT INTO comments (announcement_id, author, text, is_teacher, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(announcementId, request.user!.name, text.trim(), isTeacher, now);

  const commentItem = {
    id: Number(result.lastInsertRowid),
    announcementId,
    author: request.user!.name,
    text: text.trim(),
    isTeacher: Boolean(isTeacher),
    createdAt: now,
  };

  const updatedAnnouncement = getAnnouncementById(announcementId, request.user!.id);
  realtimeService.broadcastCommentAdded(announcementId, commentItem, updatedAnnouncement ?? undefined);

  return response.status(201).json(updatedAnnouncement);
});

// GET registered students for an activity (Teacher only)
announcementsRouter.get('/:id/registrations', requireTeacher, (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  if (!announcementId) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const announcement = db.prepare('SELECT title, category FROM announcements WHERE id = ?').get(announcementId) as any;
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');

  const registeredUsers = getRegisteredUsers(announcementId);
  return response.json({
    announcementId,
    title: announcement.title,
    registeredUsers,
  });
});

// POST check-in attendee by ticket code or user ID (Teacher only)
announcementsRouter.post('/:id/checkin', requireTeacher, (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const { code, userId, checkedIn = true } = request.body ?? {};

  if (!announcementId) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const targetIdentifier = typeof code === 'string' && code.trim() ? code.trim() : typeof userId === 'string' ? userId.trim() : '';
  if (!targetIdentifier) {
    return apiError(response, 400, 'กรุณาระบุรหัสตั๋วหรือรหัสนักศึกษา');
  }

  const result = checkInAttendee(announcementId, targetIdentifier, Boolean(checkedIn));

  if (!result.success) {
    return apiError(response, 404, result.message);
  }

  if (result.attendee) {
    realtimeService.broadcastAttendeeCheckedIn({
      announcementId,
      userId: result.attendee.userId,
      name: result.attendee.name,
      checkedIn: result.attendee.checkedIn,
      checkedInAt: result.attendee.checkedInAt,
    });
  }

  const updatedRoster = getRegisteredUsers(announcementId);
  return response.json({
    ok: true,
    message: result.message,
    attendee: result.attendee,
    registeredUsers: updatedRoster,
  });
});

// GET export registrations to CSV (Teacher only)
announcementsRouter.get('/:id/export-csv', requireTeacher, (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  if (!announcementId) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const announcement = db.prepare('SELECT title FROM announcements WHERE id = ?').get(announcementId) as any;
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');

  const registeredUsers = getRegisteredUsers(announcementId);

  // UTF-8 BOM for Thai Excel compatibility
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const th = (iso: string) => new Date(iso).toLocaleString('th-TH');
  const rows = registeredUsers.map((u, i) =>
    [i + 1, u.name, u.email, th(u.registeredAt), u.checkedIn ? 'เช็คชื่อเข้างานแล้ว' : 'ยังไม่เช็คชื่อ', u.checkedInAt ? th(u.checkedInAt) : '-'].map(cell).join(',')
  );
  const csvContent = ['\uFEFFลำดับ,ชื่อ-นามสกุล,อีเมล,วันเวลาที่ลงทะเบียน,สถานะเข้างาน,เวลาที่เช็คชื่อ', ...rows].join('\n') + '\n';

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="dpu_activity_${announcementId}_roster.csv"`);
  return response.send(csvContent);
});

// GET ticket verification details (for user's QR ticket)
announcementsRouter.get('/:id/ticket', (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const userId = request.user!.id;
  if (!announcementId) return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');

  const registration = db.prepare(`
    SELECT registered_at AS registeredAt
    FROM registrations
    WHERE announcement_id = ? AND user_id = ?
  `).get(announcementId, userId) as { registeredAt: string } | undefined;

  if (!registration) {
    return apiError(response, 404, 'ยังไม่ได้ลงทะเบียนในกิจกรรมนี้');
  }

  const announcement = db.prepare(`
    SELECT title, event_date AS eventDate, seats_max AS seatsMax
    FROM announcements WHERE id = ?
  `).get(announcementId) as any;

  return response.json({
    ticketId: `DPU-ACT-${announcementId}-${userId.slice(0, 8).toUpperCase()}`,
    announcementId,
    title: announcement.title,
    eventDate: announcement.eventDate,
    userName: request.user!.name,
    userEmail: request.user!.email,
    registeredAt: registration.registeredAt,
    verified: true,
  });
});

// ---------------------------------------------------------------------------
// Attachments (images & documents)
// ---------------------------------------------------------------------------
// The server decides the MIME type from the extension (never trusts the client)
// and SVG/HTML are deliberately not allowed to avoid script injection.
const ALLOWED_FILE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
};
const INLINE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']);

// POST upload one file (Teacher only). Body = raw file bytes,
// file name is sent in the X-File-Name header (URI-encoded).
announcementsRouter.post(
  '/:id/attachments',
  requireTeacher,
  express.raw({ type: () => true, limit: config.maxUploadBytes }),
  async (request: RequestWithUser, response) => {
    const announcementId = parseId(request.params.id);
    if (!announcementId) return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
    if (!db.prepare('SELECT 1 FROM announcements WHERE id = ?').get(announcementId)) {
      return apiError(response, 404, 'ไม่พบประกาศ');
    }

    let originalName = '';
    try {
      originalName = decodeURIComponent(request.get('X-File-Name') ?? '');
    } catch {
      return apiError(response, 400, 'ชื่อไฟล์ไม่ถูกต้อง');
    }
    originalName = path.basename(originalName).replace(/[\u0000-\u001f]/g, '').slice(0, 150);
    const extension = path.extname(originalName).toLowerCase();
    const mimeType = ALLOWED_FILE_TYPES[extension];
    if (!originalName || !mimeType) {
      return apiError(response, 400, 'รองรับเฉพาะไฟล์รูปภาพ (png, jpg, gif, webp), pdf, doc/docx, xls/xlsx, ppt/pptx และ txt');
    }

    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return apiError(response, 400, 'ไม่พบข้อมูลไฟล์');
    }

    const count = db
      .prepare('SELECT COUNT(*) AS total FROM attachments WHERE announcement_id = ?')
      .get(announcementId) as { total: number };
    if (Number(count.total) >= config.maxAttachmentsPerPost) {
      return apiError(response, 400, `แนบไฟล์ได้สูงสุด ${config.maxAttachmentsPerPost} ไฟล์ต่อประกาศ`);
    }

    mkdirSync(config.uploadsDirectory, { recursive: true });
    const storedName = `${randomBytes(16).toString('hex')}${extension}`;
    await writeFile(path.join(config.uploadsDirectory, storedName), body);

    try {
      db.prepare(`
        INSERT INTO attachments (announcement_id, original_name, stored_name, mime_type, size, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(announcementId, originalName, storedName, mimeType, body.length, new Date().toISOString());
      db.prepare('UPDATE announcements SET has_pdf = 1 WHERE id = ?').run(announcementId);
    } catch (error) {
      await unlink(path.join(config.uploadsDirectory, storedName)).catch(() => {});
      throw error;
    }

    const updated = getAnnouncementById(announcementId, request.user!.id);
    if (updated) realtimeService.broadcastAnnouncementUpdated(updated);
    return response.status(201).json(updated);
  }
);

// GET download / preview one attachment (any signed-in user)
announcementsRouter.get('/:id/attachments/:attachmentId', (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const attachmentId = parseId(request.params.attachmentId);
  if (!announcementId || !attachmentId) return apiError(response, 400, 'รหัสไฟล์ไม่ถูกต้อง');

  const row = db.prepare(`
    SELECT original_name AS name, stored_name AS storedName, mime_type AS mimeType
    FROM attachments WHERE id = ? AND announcement_id = ?
  `).get(attachmentId, announcementId) as { name: string; storedName: string; mimeType: string } | undefined;
  if (!row) return apiError(response, 404, 'ไม่พบไฟล์แนบ');

  const filePath = path.join(config.uploadsDirectory, row.storedName);
  if (!existsSync(filePath)) return apiError(response, 404, 'ไม่พบไฟล์บนเซิร์ฟเวอร์');

  const inline = INLINE_TYPES.has(row.mimeType) && request.query.download !== '1';
  response.setHeader('Content-Type', row.mimeType);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'private, max-age=3600');
  response.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(row.name)}`
  );
  return response.sendFile(filePath);
});

// DELETE one attachment (Teacher only)
announcementsRouter.delete('/:id/attachments/:attachmentId', requireTeacher, async (request: RequestWithUser, response) => {
  const announcementId = parseId(request.params.id);
  const attachmentId = parseId(request.params.attachmentId);
  if (!announcementId || !attachmentId) return apiError(response, 400, 'รหัสไฟล์ไม่ถูกต้อง');

  const row = db.prepare(
    'SELECT stored_name AS storedName FROM attachments WHERE id = ? AND announcement_id = ?'
  ).get(attachmentId, announcementId) as { storedName: string } | undefined;
  if (!row) return apiError(response, 404, 'ไม่พบไฟล์แนบ');

  db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
  await unlink(path.join(config.uploadsDirectory, row.storedName)).catch(() => {});

  const updated = getAnnouncementById(announcementId, request.user!.id);
  if (updated) realtimeService.broadcastAnnouncementUpdated(updated);
  return response.json(updated);
});
