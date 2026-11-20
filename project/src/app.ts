import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config/env.js';
import { db } from './database/db.js';
import { authRouter } from './routes/auth.routes.js';
import { announcementsRouter } from './routes/announcements.routes.js';
import { aiRouter } from './routes/ai.routes.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Health Check
app.get('/api/health', (_request, response) => {
  try {
    const result = db.prepare('SELECT 1 AS connected').get() as { connected: number };
    response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: result.connected === 1 ? 'connected' : 'disconnected',
      realtime: 'socket.io enabled',
    });
  } catch (error: any) {
    response.status(500).json({ status: 'error', error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/ai', aiRouter);

// 404 for unmatched API routes
app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'ไม่พบ API endpoint ที่เรียกใช้งาน' });
});

// Static files for client
app.use('/css', express.static(path.join(config.appDirectory, 'css')));
app.use('/js', express.static(path.join(config.appDirectory, 'js')));

app.get(['/', '/demo.html'], (_request, response) => {
  response.sendFile(path.join(config.appDirectory, 'demo.html'));
});

// Error handling middleware
app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error('[Internal Error]:', error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' });
});
