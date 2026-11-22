import { Router } from 'express';
import { getAllAnnouncements } from '../database/db.js';
import { requireAuth, type RequestWithUser } from '../middlewares/auth.middleware.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post('/ask', (request: RequestWithUser, response) => {
  const query = typeof request.body?.query === 'string' ? request.body.query.trim() : '';
  if (!query) {
    return response.json({
      answer: 'สวัสดีครับ สามารถพิมพ์คำค้นหา เช่น ตารางสอบ, ทุนการศึกษา, กิจกรรม หรือเรื่องที่ต้องการสอบถามได้เลยครับ',
      matches: [],
    });
  }

  const userId = request.user?.id ?? 'anonymous';
  const announcements = getAllAnnouncements(userId, request.user?.role);
  const qLower = query.toLowerCase();

  // Score matching announcements
  const scored = announcements.map((item) => {
    let score = 0;
    const titleMatch = item.title.toLowerCase().includes(qLower);
    const summaryMatch = item.aiSummary.toLowerCase().includes(qLower);
    const contentMatch = item.content.toLowerCase().includes(qLower);
    const catMatch = item.category.toLowerCase().includes(qLower);

    if (titleMatch) score += 10;
    if (summaryMatch) score += 6;
    if (contentMatch) score += 3;
    if (catMatch) score += 4;

    // Partial word checks
    const words = qLower.split(/\s+/).filter((w: string) => w.length > 1);
    for (const w of words) {
      if (item.title.toLowerCase().includes(w)) score += 4;
      if (item.aiSummary.toLowerCase().includes(w)) score += 3;
      if (item.content.toLowerCase().includes(w)) score += 1;
    }

    if (item.pinned) score += 1;

    return { item, score };
  });

  const matching = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.item);

  if (matching.length === 0) {
    // Helpful suggestions based on common questions
    let fallback = `ขออภัยครับ ไม่พบประกาศที่เกี่ยวข้องกับ "${query}" โดยตรง\n\n💡 คุณสามารถลองค้นหาคำเหล่านี้ได้ครับ:\n- "สอบ" หรือ "ตารางสอบ"\n- "ทุน" หรือ "ทุนการศึกษา"\n- "กิจกรรม" หรือ "อบรม"\n- "ประชุม"`;
    return response.json({
      answer: fallback,
      matches: [],
    });
  }

  // Build a conversational, clear answer from the top matches
  const top = matching[0]!;
  let answer = '';

  if (qLower.includes('สอบ')) {
    answer = `📅 **กำหนดการสอบ:** ${top.aiSummary}\n\nรายละเอียดเพิ่มเติม: ${top.content.slice(0, 150)}...`;
  } else if (qLower.includes('ทุน')) {
    answer = `🎓 **ทุนการศึกษา:** ${top.title}\n${top.aiSummary}\n\nผู้สนใจสามารถดูรายละเอียดและส่งใบสมัครได้ตามประกาศครับ`;
  } else if (qLower.includes('กิจกรรม') || qLower.includes('อบรม') || qLower.includes('เวิร์กชอป')) {
    answer = `🎉 **กิจกรรมน่าสนใจ:** ${top.title}\n${top.aiSummary}\n\nเปิดรับ ${top.seatsTaken ?? 0}/${top.seatsMax ?? 0} ที่นั่ง กดลงทะเบียนในการ์ดประกาศเพื่อรับบัตร QR ได้เลยครับ`;
  } else {
    answer = `📢 **ข้อมูลจากประกาศ "${top.title}":**\n${top.aiSummary}\n\n${top.content.slice(0, 140)}...`;
  }

  return response.json({
    answer,
    matches: matching.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.aiSummary,
      category: m.category,
      date: m.date,
    })),
  });
});
