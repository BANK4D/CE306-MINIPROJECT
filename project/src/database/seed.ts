import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import type { DatabaseSync } from 'node:sqlite';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export const initialAnnouncements = [
  {
    title: 'แจ้งกำหนดการสอบปลายภาค ภาคการศึกษาที่ 1/2569',
    aiSummary: 'สอบวันที่ 1–15 พ.ย. 2569 เช็คห้องสอบได้ที่ระบบ REG และต้องแต่งกายชุดนักศึกษา',
    content: 'ขอให้นักศึกษาทุกชั้นปีตรวจสอบตารางสอบปลายภาคและห้องสอบผ่านระบบบริการการศึกษา (REG) หากพบวิชาสอบซ้อนให้แจ้งฝ่ายทะเบียนภายในสัปดาห์นี้ พร้อมทั้งเตรียมบัตรนักศึกษาเข้าห้องสอบ',
    category: 'academic',
    target: 'student',
    date: new Date().toISOString(),
    pinned: true,
    hasPdf: true,
    ackCount: 128,
    eventDate: '20261101T090000Z/20261101T120000Z',
    comments: [
      {
        author: 'ธนบดี (นศ.)',
        text: 'สามารถนำเครื่องคิดเลขเข้าห้องสอบวิชาวิศวกรรมได้ไหมครับ?',
        isTeacher: false,
      },
      {
        author: 'อ. ผู้ดูแลระบบ',
        text: 'อนุญาตเฉพาะรุ่นที่ไม่มีฟังก์ชันบันทึกโปรแกรมครับ ดูรายชื่อรุ่นในไฟล์แนบได้เลย',
        isTeacher: true,
      },
    ],
  },
  {
    title: 'Tech Workshop: การพัฒนา Web Application ยุคใหม่ & AI',
    aiSummary: 'อบรมฟรีวันที่ 25 ต.ค. 2569 รับจำนวนจำกัด 50 ที่นั่ง ได้รับชั่วโมงกิจกรรม 3 ชม.',
    content: 'ขอเชิญนักศึกษาเข้าร่วมอบรมเชิงปฏิบัติการ พัฒนาเว็บแอปพลิเคชันและฐานข้อมูล พร้อมรับเกียรติบัตรและชั่วโมงกิจกรรมเมื่อสแกน QR Code หน้างาน โดยวิทยากรผู้เชี่ยวชาญจากอุตสาหกรรมซอฟต์แวร์',
    category: 'activity',
    target: 'student',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    pinned: false,
    hasPdf: false,
    ackCount: 64,
    seatsMax: 50,
    seatsTaken: 42,
    eventDate: '20261025T090000Z/20261025T160000Z',
  },
  {
    title: 'เปิดรับสมัครทุนเรียนดีและทุนนวัตกรรม ประจำปี 2569',
    aiSummary: 'สำหรับนักศึกษาเกรดเฉลี่ย 3.25 ขึ้นไป หรือมีผลงานแข่งขัน ยื่นเอกสารได้ถึงสิ้นเดือนนี้',
    content: 'คณะเปิดรับสมัครคัดเลือกนักศึกษาเพื่อรับทุนการศึกษาประจำปี ผู้สนใจสามารถดูรายละเอียดเอกสารที่ต้องใช้ในไฟล์แนบ และส่งใบสมัครที่ห้องสำนักงานคณะ ได้ตั้งแต่วันนี้จนถึงสิ้นเดือน',
    category: 'scholarship',
    target: 'student',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    pinned: false,
    hasPdf: true,
    ackCount: 89,
    eventDate: '20261030T090000Z/20261030T160000Z',
  },
  {
    title: '[ภายใน] ขอเชิญประชุมคณาจารย์เพื่อทบทวนเกณฑ์มาตรฐานหลักสูตร',
    aiSummary: 'ประชุมคณาจารย์วันศุกร์นี้ เวลา 13:30 น. ณ ห้องประชุมคณะ พร้อมส่งรายงาน มคอ.',
    content: 'ขอเชิญคณาจารย์ทุกท่านเข้าร่วมประชุมประจำเดือน เพื่อสรุปผลการเรียนการสอนและเตรียมความพร้อมการตรวจประเมินคุณภาพการศึกษาของหลักสูตรวิศวกรรมคอมพิวเตอร์',
    category: 'general',
    target: 'teacher',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    pinned: true,
    hasPdf: true,
    ackCount: 19,
  },
];

export async function seedDatabase(db: DatabaseSync): Promise<void> {
  // 1. Seed demo accounts if missing
  const existingUsers = (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count;
  if (existingUsers === 0) {
    const teacherPasswordHash = await hashPassword('password123');
    const studentPasswordHash = await hashPassword('password123');
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, picture, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
    `);

    insertUser.run(
      'teacher-demo-id',
      'teacher@dpu.ac.th',
      teacherPasswordHash,
      'อ.ดร. สมเกียรติ วิจิตรบรรจง (อาจารย์)',
      'teacher',
      now,
      now
    );

    insertUser.run(
      'student-demo-id',
      'student@dpu.ac.th',
      studentPasswordHash,
      'ธนบดี หมื่นไกรทอง (นักศึกษา)',
      'student',
      now,
      now
    );
  }

  // 2. Seed announcements if missing
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM announcements').get() as { count: number };
  if (countRow.count > 0) return;

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (
      title, ai_summary, content, category, target, created_at, pinned,
      has_pdf, event_date, ack_count, seats_max, seats_taken
    ) VALUES (
      @title, @aiSummary, @content, @category, @target, @date, @pinned,
      @hasPdf, @eventDate, @ackCount, @seatsMax, @seatsTaken
    )
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (announcement_id, author, text, is_teacher, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const announcement of initialAnnouncements) {
      const result = insertAnnouncement.run({
        title: announcement.title,
        aiSummary: announcement.aiSummary,
        content: announcement.content,
        category: announcement.category,
        target: announcement.target,
        date: announcement.date,
        pinned: announcement.pinned ? 1 : 0,
        hasPdf: announcement.hasPdf ? 1 : 0,
        eventDate: announcement.eventDate ?? null,
        ackCount: announcement.ackCount,
        seatsMax: (announcement as any).seatsMax ?? null,
        seatsTaken: (announcement as any).seatsTaken ?? 0,
      });

      for (const comment of (announcement as any).comments ?? []) {
        insertComment.run(
          result.lastInsertRowid,
          comment.author,
          comment.text,
          comment.isTeacher ? 1 : 0,
          new Date().toISOString()
        );
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
