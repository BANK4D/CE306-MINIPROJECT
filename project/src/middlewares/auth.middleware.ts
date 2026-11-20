import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { db } from '../database/db.js';
import type { AuthenticatedUser } from '../types/index.js';

const scrypt = promisify(scryptCallback);

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  authSession?: {
    tokenHash: string;
    csrfToken: string;
  };
}

export function parseCookies(header = ''): Map<string, string> {
  const cookies = new Map<string, string>();
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

export function setCookie(
  response: Response,
  name: string,
  value: string,
  maxAgeSeconds: number,
  options: { clear?: boolean } = {}
) {
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

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, config.passwordHashLength)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = encodedHash.split(':');
  if (!saltHex || !hashHex || !/^[a-f0-9]{32}$/.test(saltHex) || !/^[a-f0-9]{128}$/.test(hashHex)) return false;
  const derivedKey = (await scrypt(password, Buffer.from(saltHex, 'hex'), config.passwordHashLength)) as Buffer;
  return timingSafeEqual(derivedKey, Buffer.from(hashHex, 'hex'));
}

export function safeEqual(left?: string, right?: string): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSession(response: Response, userId: string): string {
  const token = createOpaqueToken();
  const csrfToken = createOpaqueToken();
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + config.sessionLifetimeMs).toISOString();

  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(createdAt);
  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(hashToken(token), userId, csrfToken, expiresAt, createdAt);

  setCookie(response, config.sessionCookieName, token, config.sessionLifetimeMs / 1000);
  return csrfToken;
}

export function getSession(request: Request) {
  const token = parseCookies(request.headers.cookie).get(config.sessionCookieName);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  return (
    (db.prepare(`
      SELECT
        users.id, users.email, users.name, users.picture, users.role,
        sessions.token_hash AS tokenHash, sessions.csrf_token AS csrfToken
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
        AND users.password_hash IS NOT NULL
    `).get(hashToken(token), new Date().toISOString()) as any) ?? null
  );
}

export function requireAuth(request: RequestWithUser, response: Response, next: NextFunction) {
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

export function requireCsrf(request: RequestWithUser, response: Response, next: NextFunction) {
  if (!safeEqual(request.get('X-CSRF-Token'), request.authSession?.csrfToken)) {
    return apiError(response, 403, 'เซสชันไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง');
  }
  next();
}

export function requireTeacher(request: RequestWithUser, response: Response, next: NextFunction) {
  if (request.user?.role !== 'teacher') {
    return apiError(response, 403, 'เฉพาะอาจารย์ที่ได้รับอนุญาตเท่านั้น');
  }
  next();
}

export function apiError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}
