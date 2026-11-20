import { createServer } from 'node:http';
import { app } from './app.js';
import { config } from './config/env.js';
import { db } from './database/db.js';
import { realtimeService } from './services/realtime.service.js';

const httpServer = createServer(app);

// Initialize Socket.io Real-time WebSocket Service
const io = realtimeService.initialize(httpServer);

const host = process.env.HOST || '127.0.0.1';
httpServer.listen(config.port, host, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Faculty Announcement Hub (CE306 - DPU SMART CAMPUS)`);
  console.log(`📡 Server running at http://${host}:${config.port}`);
  console.log(`⚡ Real-time WebSocket: ACTIVE (Socket.io)`);
  console.log(`💾 SQLite database: ${config.databasePath}`);
  console.log(`=======================================================`);
});

function shutDown() {
  console.log('\nShutting down server...');
  httpServer.close(() => {
    try {
      db.close();
      console.log('Database connection closed.');
    } catch {}
    process.exit(0);
  });
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
