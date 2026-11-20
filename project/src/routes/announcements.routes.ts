import { Router } from 'express';
import { db, getAllAnnouncements, getAnnouncementById, getRegisteredUsers } from '../database/db.js';
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

// All announcement endpoints require authentication
announcementsRouter.use(requireAuth);

// Non-GET requests require CSRF protection
announcementsRouter.use((request, response, next) => {
  if (request.method === 'GET') return next();
  return requireCsrf(request, response, next);
});

// GET all announcements
announcementsRouter.get('/', (request: RequestWithUser, response) => {
  const userId = request.user?.id ?? 'anonymous';
  const announcements = getAllAnnouncements(userId);
  response.json(announcements);
});

// GET single announcement
announcementsRouter.get('/:id', (request: RequestWithUser, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }
  const announcement = getAnnouncementById(id, request.user?.id);
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');
  response.json(announcement);
});

// POST create announcement (Teacher only)
announcementsRouter.post('/', requireTeacher, (request: RequestWithUser, response) => {
  const {
    title,
    aiSummary,
    content,
    category,
    target,
    pinned = false,
    hasPdf = false,
    eventDate = null,
    seatsMax = null,
  } = request.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
    return apiError(response, 400, 'หัวข้อประกาศต้องมีความยาว 1-200 ตัวอักษร');
  }
  if (typeof content !== 'string' || content.length > 50000) {
    return apiError(response, 400, 'รายละเอียดประกาศไม่ถูกต้องหรือยาวเกินกำหนด');
  }
  if (!categories.has(category) || !targets.has(target)) {
    return apiError(response, 400, 'หมวดหมู่หรือกลุ่มเป้าหมายไม่ถูกต้อง');
  }
  if (typeof pinned !== 'boolean' || typeof hasPdf !== 'boolean') {
    return apiError(response, 400, 'ค่าปักหมุดหรือไฟล์แนบไม่ถูกต้อง');
  }
  if (eventDate !== null && (typeof eventDate !== 'string' || eventDate.length > 80)) {
    return apiError(response, 400, 'วันจัดกิจกรรมไม่ถูกต้อง');
  }
  if (seatsMax !== null && (!Number.isInteger(seatsMax) || seatsMax < 1 || seatsMax > 100000)) {
    return apiError(response, 400, 'จำนวนที่นั่งไม่ถูกต้อง');
  }

  const summary =
    typeof aiSummary === 'string' && aiSummary.trim()
      ? aiSummary.trim().slice(0, 500)
      : `สรุปอัตโนมัติ: ${title.trim()}`;

  const result = db.prepare(`
    INSERT INTO announcements (
      title, ai_summary, content, category, target, created_at, pinned,
      has_pdf, event_date, seats_max, seats_taken, ack_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
  `).run(
    title.trim(),
    summary,
    content,
    category,
    target,
    new Date().toISOString(),
    Number(pinned),
    Number(hasPdf),
    eventDate,
    seatsMax
  );

  const announcement = getAnnouncementById(Number(result.lastInsertRowid), request.user!.id);
  if (announcement) {
    // Real-time broadcast!
    realtimeService.broadcastAnnouncementCreated(announcement);
  }

  return response.status(201).json(announcement);
});

// PUT edit announcement (Teacher only)
announcementsRouter.put('/:id', requireTeacher, (request: RequestWithUser, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(id);
  if (!existing) return apiError(response, 404, 'ไม่พบประกาศที่ต้องการแก้ไข');

  const {
    title,
    aiSummary,
    content,
    category,
    target,
    pinned = false,
    hasPdf = false,
    eventDate = null,
    seatsMax = null,
  } = request.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
    return apiError(response, 400, 'หัวข้อประกาศต้องมีความยาว 1-200 ตัวอักษร');
  }
  if (typeof content !== 'string' || content.length > 50000) {
    return apiError(response, 400, 'รายละเอียดประกาศไม่ถูกต้อง');
  }
  if (!categories.has(category) || !targets.has(target)) {
    return apiError(response, 400, 'หมวดหมู่หรือกลุ่มเป้าหมายไม่ถูกต้อง');
  }

  const summary =
    typeof aiSummary === 'string' && aiSummary.trim()
      ? aiSummary.trim().slice(0, 500)
      : `สรุปอัตโนมัติ: ${title.trim()}`;

  db.prepare(`
    UPDATE announcements
    SET title = ?, ai_summary = ?, content = ?, category = ?, target = ?,
        pinned = ?, has_pdf = ?, event_date = ?, seats_max = ?
    WHERE id = ?
  `).run(
    title.trim(),
    summary,
    content,
    category,
    target,
    Number(pinned),
    Number(hasPdf),
    eventDate,
    seatsMax,
    id
  );

  const updated = getAnnouncementById(id, request.user!.id);
  if (updated) {
    realtimeService.broadcastAnnouncementUpdated(updated);
  }

  return response.json(updated);
});

// DELETE announcement (Teacher only)
announcementsRouter.delete('/:id', requireTeacher, (request: RequestWithUser, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(id);
  if (!existing) return apiError(response, 404, 'ไม่พบประกาศที่ต้องการลบ');

  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);

  // Real-time broadcast deletion
  realtimeService.broadcastAnnouncementDeleted(id);

  return response.json({ ok: true, deletedId: id });
});

// PATCH toggle pin status (Teacher only)
announcementsRouter.patch('/:id/pin', requireTeacher, (request: RequestWithUser, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const announcement = db.prepare('SELECT pinned FROM announcements WHERE id = ?').get(id) as { pinned: number } | undefined;
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');

  const newPinned = announcement.pinned === 1 ? 0 : 1;
  db.prepare('UPDATE announcements SET pinned = ? WHERE id = ?').run(newPinned, id);

  const updated = getAnnouncementById(id, request.user!.id);
  if (updated) {
    realtimeService.broadcastAnnouncementUpdated(updated);
  }

  return response.json(updated);
});

// PUT acknowledgement toggle
announcementsRouter.put('/:id/acknowledgement', (request: RequestWithUser, response) => {
  const announcementId = Number(request.params.id);
  const { acknowledged } = request.body ?? {};

  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
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
  const announcementId = Number(request.params.id);
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
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
  const announcementId = Number(request.params.id);
  const { text } = request.body ?? {};

  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
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
  const announcementId = Number(request.params.id);
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
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
  const announcementId = Number(request.params.id);
  const { code, userId, checkedIn = true } = request.body ?? {};

  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const targetIdentifier = typeof code === 'string' && code.trim() ? code.trim() : typeof userId === 'string' ? userId.trim() : '';
  if (!targetIdentifier) {
    return apiError(response, 400, 'กรุณาระบุรหัสตั๋วหรือรหัสนักศึกษา');
  }

  const { checkInAttendee } = require('../database/db.js');
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
  const announcementId = Number(request.params.id);
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }

  const announcement = db.prepare('SELECT title FROM announcements WHERE id = ?').get(announcementId) as any;
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');

  const registeredUsers = getRegisteredUsers(announcementId);

  // UTF-8 BOM for Thai Excel compatibility
  let csvContent = '\uFEFFลำดับ,ชื่อ-นามสกุล,อีเมล,วันเวลาที่ลงทะเบียน,สถานะเข้างาน,เวลาที่เช็คชื่อ\n';
  registeredUsers.forEach((u, index) => {
    const status = u.checkedIn ? 'เช็คชื่อเข้างานแล้ว' : 'ยังไม่เช็คชื่อ';
    const checkinTime = u.checkedInAt ? new Date(u.checkedInAt).toLocaleString('th-TH') : '-';
    csvContent += `"${index + 1}","${u.name.replace(/"/g, '""')}","${u.email}","${new Date(u.registeredAt).toLocaleString('th-TH')}","${status}","${checkinTime}"\n`;
  });

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="dpu_activity_${announcementId}_roster.csv"`);
  return response.send(csvContent);
});

// GET ticket verification details (for user's QR ticket)
announcementsRouter.get('/:id/ticket', (request: RequestWithUser, response) => {
  const announcementId = Number(request.params.id);
  const userId = request.user!.id;

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
