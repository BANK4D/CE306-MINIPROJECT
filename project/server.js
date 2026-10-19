import './config.js';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database/db.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(currentDirectory, '..');
const app = express();
const port = Number(process.env.PORT ?? 3000);
if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo-only sign-in must not be exposed in production.');
}
const sessionCookieName = 'dpu-session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const categories = new Set(['academic', 'scholarship', 'activity', 'general']);
const targets = new Set(['all', 'student', 'teacher']);

app.use(express.json({ limit: '100kb' }));

function parseCookies(header = '') {
  const cookies = new Map();
  for (const cookie of header.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    const name = cookie.slice(0, separator).trim();
    const value = cookie.slice(separator + 1).trim();
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      continue;
    }
  }
  return cookies;
}

function setCookie(response, name, value, maxAgeSeconds, options = {}) {
  const fields = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (options.clear) fields.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  response.append('Set-Cookie', fields.join('; '));
}

function createOpaqueToken() {
  return randomBytes(32).toString('hex');
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createSession(response, userId) {
  const token = createOpaqueToken();
  const csrfToken = createOpaqueToken();
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + sessionLifetimeMs).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(createdAt);
  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(hashToken(token), userId, csrfToken, expiresAt, createdAt);
  setCookie(response, sessionCookieName, token, sessionLifetimeMs / 1000);
  return csrfToken;
}

function getSession(request) {
  const token = parseCookies(request.headers.cookie).get(sessionCookieName);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare(`
    SELECT
      users.id, users.name, users.picture, users.role,
      sessions.token_hash AS tokenHash, sessions.csrf_token AS csrfToken
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
      AND sessions.expires_at > ?
      AND users.id IN ('demo-student', 'demo-teacher')
  `).get(hashToken(token), new Date().toISOString()) ?? null;
}

function requireAuth(request, response, next) {
  const session = getSession(request);
  if (!session) return apiError(response, 401, 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
  request.user = {
    id: session.id,
    email: session.email,
    name: session.name,
    picture: session.picture,
    role: session.role,
  };
  request.authSession = session;
  next();
}

function requireCsrf(request, response, next) {
  if (!safeEqual(request.get('X-CSRF-Token'), request.authSession.csrfToken)) {
    return apiError(response, 403, 'เซสชันไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง');
  }
  next();
}

function requireTeacher(request, response, next) {
  if (request.user.role !== 'teacher') {
    return apiError(response, 403, 'เฉพาะอาจารย์ที่ได้รับอนุญาตเท่านั้น');
  }
  next();
}

function getOrigin(request) {
  if (!request.get('Origin')) return true;
  try {
    const origin = new URL(request.get('Origin'));
    return [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
    ].includes(origin.origin);
  } catch {
    return false;
  }
}

function createOrUpdateUser({ id, name, role }) {
  const now = new Date().toISOString();
  const demoEmail = `${id}@demo.invalid`;
  db.prepare(`
    INSERT INTO users (id, email, name, picture, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      picture = excluded.picture,
      role = excluded.role,
      updated_at = excluded.updated_at
  `).run(id, demoEmail, name, null, role, now, now);
}

function getAnnouncement(id, userId = 'anonymous') {
  const announcement = db.prepare(`
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
  `).get(userId, userId, id);

  if (!announcement) return null;

  const comments = db.prepare(`
    SELECT author, text, is_teacher AS isTeacher
    FROM comments
    WHERE announcement_id = ?
    ORDER BY id
  `).all(id);

  return {
    ...announcement,
    id: Number(announcement.id),
    pinned: Boolean(announcement.pinned),
    hasPdf: Boolean(announcement.hasPdf),
    ackCount: Number(announcement.ackCount),
    seatsMax: announcement.seatsMax === null ? null : Number(announcement.seatsMax),
    seatsTaken: Number(announcement.seatsTaken),
    acknowledged: Boolean(announcement.acknowledged),
    registered: Boolean(announcement.registered),
    comments: comments.map((comment) => ({
      ...comment,
      isTeacher: Boolean(comment.isTeacher),
    })),
  };
}

function apiError(res, status, message) {
  return res.status(status).json({ error: message });
}

app.get('/api/auth/config', (_request, response) => {
  response.json({ demoEnabled: true });
});

app.get('/api/auth/me', (request, response) => {
  const session = getSession(request);
  if (!session) return response.json({ authenticated: false });
  response.json({
    authenticated: true,
    csrfToken: session.csrfToken,
    user: {
      id: session.id,
      name: session.name,
      picture: session.picture,
      role: session.role,
    },
  });
});

app.post('/api/auth/demo', (request, response) => {
  if (!getOrigin(request)) return apiError(response, 403, 'คำขอเข้าสู่ระบบไม่ถูกต้อง');

  const role = request.body?.role;
  if (!['student', 'teacher'].includes(role)) {
    return apiError(response, 400, 'เลือกบทบาททดลองไม่ถูกต้อง');
  }
  const id = `demo-${role}`;
  createOrUpdateUser({
    id,
    name: role === 'teacher' ? 'อาจารย์ทดลอง (Demo)' : 'นักศึกษาทดลอง (Demo)',
    role,
  });
  const csrfToken = createSession(response, id);
  response.status(201).json({ csrfToken });
});

app.post('/api/auth/logout', requireAuth, requireCsrf, (request, response) => {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(request.authSession.tokenHash);
  setCookie(response, sessionCookieName, '', 0, { clear: true });
  response.json({ ok: true });
});

app.get('/api/health', (_request, response) => {
  const result = db.prepare('SELECT 1 AS connected').get();
  response.json({ status: 'ok', database: result.connected === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/announcements', requireAuth, (request, response, next) => (
  request.method === 'GET' ? next() : requireCsrf(request, response, next)
));

app.get('/api/announcements', (request, response) => {
  const ids = db.prepare('SELECT id FROM announcements ORDER BY created_at DESC, id DESC').all();
  response.json(ids.map(({ id }) => getAnnouncement(id, request.user.id)));
});

app.post('/api/announcements', requireTeacher, (request, response) => {
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

  const summary = typeof aiSummary === 'string' && aiSummary.trim()
    ? aiSummary.trim().slice(0, 500)
    : `สรุปอัตโนมัติ: ${title.trim()}`;
  const result = db.prepare(`
    INSERT INTO announcements (
      title, ai_summary, content, category, target, created_at, pinned,
      has_pdf, event_date, seats_max, seats_taken
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
    seatsMax,
  );

  return response.status(201).json(getAnnouncement(result.lastInsertRowid, request.user.id));
});

app.put('/api/announcements/:id/acknowledgement', (request, response) => {
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
    `).run(announcementId, request.user.id);
    if (result.changes > 0) {
      db.prepare('UPDATE announcements SET ack_count = ack_count + 1 WHERE id = ?').run(announcementId);
    }
  } else {
    const result = db.prepare(`
      DELETE FROM acknowledgements WHERE announcement_id = ? AND user_id = ?
    `).run(announcementId, request.user.id);
    if (result.changes > 0) {
      db.prepare('UPDATE announcements SET ack_count = MAX(0, ack_count - 1) WHERE id = ?').run(announcementId);
    }
  }

  return response.json(getAnnouncement(announcementId, request.user.id));
});

app.post('/api/announcements/:id/registration', (request, response) => {
  const announcementId = Number(request.params.id);
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
    return apiError(response, 400, 'ข้อมูลการลงทะเบียนไม่ถูกต้อง');
  }

  const announcement = db.prepare(`
    SELECT category, seats_max AS seatsMax, seats_taken AS seatsTaken
    FROM announcements WHERE id = ?
  `).get(announcementId);
  if (!announcement) return apiError(response, 404, 'ไม่พบประกาศ');
  if (announcement.category !== 'activity') {
    return apiError(response, 400, 'ประกาศนี้ไม่เปิดให้ลงทะเบียน');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db.prepare(`
      SELECT 1 FROM registrations WHERE announcement_id = ? AND user_id = ?
    `).get(announcementId, request.user.id);
    if (existing) {
      db.exec('COMMIT');
      return response.json(getAnnouncement(announcementId, request.user.id));
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
    `).run(announcementId, request.user.id, new Date().toISOString());
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return response.json(getAnnouncement(announcementId, request.user.id));
});

app.post('/api/announcements/:id/comments', (request, response) => {
  const announcementId = Number(request.params.id);
  const { text } = request.body ?? {};
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) {
    return apiError(response, 400, 'รหัสประกาศไม่ถูกต้อง');
  }
  if (!db.prepare('SELECT 1 FROM announcements WHERE id = ?').get(announcementId)) {
    return apiError(response, 404, 'ไม่พบประกาศ');
  }
  if (
    typeof text !== 'string' || text.trim().length < 1 || text.length > 2000
  ) {
    return apiError(response, 400, 'ข้อความแสดงความคิดเห็นไม่ถูกต้อง');
  }

  db.prepare(`
    INSERT INTO comments (announcement_id, author, text, is_teacher, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    announcementId,
    request.user.name,
    text.trim(),
    Number(request.user.role === 'teacher'),
    new Date().toISOString(),
  );

  return response.status(201).json(getAnnouncement(announcementId, request.user.id));
});

app.use('/api', (_request, response) => {
  apiError(response, 404, 'ไม่พบ API endpoint');
});

app.use('/css', express.static(path.join(appDirectory, 'css')));
app.use('/js', express.static(path.join(appDirectory, 'js')));
app.get('/demo.html', (_request, response) => {
  response.sendFile(path.join(appDirectory, 'demo.html'));
});
app.get('/', (_request, response) => {
  response.sendFile(path.join(appDirectory, 'demo.html'));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Faculty Announcement Hub is running at http://localhost:${port}`);
  console.log(`SQLite database: ${process.env.DATABASE_PATH ?? 'database/data/announcements.sqlite'}`);
});

function shutDown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
