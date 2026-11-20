import { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { db } from '../database/db.js';
import {
  apiError,
  createSession,
  getSession,
  hashPassword,
  requireAuth,
  requireCsrf,
  setCookie,
  verifyPassword,
  type RequestWithUser,
} from '../middlewares/auth.middleware.js';
import { config } from '../config/env.js';

export const authRouter = Router();

authRouter.get('/me', (request, response) => {
  const session = getSession(request);
  if (!session) return response.json({ authenticated: false });

  response.json({
    authenticated: true,
    csrfToken: session.csrfToken,
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
    },
  });
});

authRouter.post('/register', async (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body?.password;

  if (name.length < 2 || name.length > 80) {
    return apiError(response, 400, 'กรุณากรอกชื่อ 2-80 ตัวอักษร');
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError(response, 400, 'กรุณากรอกอีเมลให้ถูกต้อง');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return apiError(response, 400, 'รหัสผ่านต้องมีความยาว 8-128 ตัวอักษร');
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, picture, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, 'student', ?, ?)
    `).run(id, email, passwordHash, name, now, now);
  } catch (error: any) {
    if (error.code === 'ERR_SQLITE_ERROR' && error.message?.includes('UNIQUE constraint failed: users.email')) {
      return apiError(response, 409, 'อีเมลนี้ลงทะเบียนแล้ว');
    }
    throw error;
  }

  const csrfToken = createSession(response, id);
  response.status(201).json({ csrfToken });
});

authRouter.post('/login', async (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body?.password;

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length > 128) {
    return apiError(response, 400, 'กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง');
  }

  const user = db.prepare(`
    SELECT id, password_hash AS passwordHash
    FROM users
    WHERE email = ?
  `).get(email) as { id: string; passwordHash: string } | undefined;

  const fallbackHash = `${randomBytes(16).toString('hex')}:${randomBytes(64).toString('hex')}`;
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? fallbackHash);

  if (!user || !user.passwordHash || !passwordMatches) {
    return apiError(response, 401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  const csrfToken = createSession(response, user.id);
  response.json({ csrfToken });
});

// Demo Login for quick testing of Teacher / Student roles
authRouter.post('/demo-login', async (request, response) => {
  const role = request.body?.role === 'teacher' ? 'teacher' : 'student';
  const targetEmail = role === 'teacher' ? 'teacher@dpu.ac.th' : 'student@dpu.ac.th';

  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(targetEmail) as { id: string } | undefined;

  if (!user) {
    // If not found, create demo account
    const id = `${role}-demo-id`;
    const passwordHash = await hashPassword('password123');
    const now = new Date().toISOString();
    const name = role === 'teacher' ? 'อ.ดร. สมเกียรติ วิจิตรบรรจง (อาจารย์)' : 'ธนบดี หมื่นไกรทอง (นักศึกษา)';

    db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, name, picture, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
    `).run(id, targetEmail, passwordHash, name, role, now, now);

    user = { id };
  }

  const csrfToken = createSession(response, user.id);
  response.json({ csrfToken });
});

authRouter.post('/logout', requireAuth, requireCsrf, (request: RequestWithUser, response) => {
  if (request.authSession?.tokenHash) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(request.authSession.tokenHash);
  }
  setCookie(response, config.sessionCookieName, '', 0, { clear: true });
  response.json({ ok: true });
});
