import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import type { Announcement, CommentItem } from '../types/index.js';

class RealtimeService {
  private io: SocketIOServer | null = null;

  public initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    this.io.on('connection', (socket) => {
      // Send welcome / ping
      socket.emit('connected', {
        time: new Date().toISOString(),
        message: 'DPU Real-time Service Connected',
      });

      socket.on('disconnect', () => {
        // user disconnected
      });
    });

    return this.io;
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public broadcastAnnouncementCreated(announcement: Announcement) {
    if (!this.io) return;
    this.io.emit('announcement:created', announcement);
  }

  public broadcastAnnouncementUpdated(announcement: Announcement) {
    if (!this.io) return;
    this.io.emit('announcement:updated', announcement);
  }

  public broadcastAnnouncementDeleted(id: number) {
    if (!this.io) return;
    this.io.emit('announcement:deleted', { id });
  }

  public broadcastAckChanged(payload: { announcementId: number; ackCount: number }) {
    if (!this.io) return;
    this.io.emit('announcement:ack', payload);
  }

  public broadcastRegistrationChanged(payload: { announcementId: number; seatsTaken: number; seatsMax: number | null }) {
    if (!this.io) return;
    this.io.emit('announcement:registered', payload);
  }

  public broadcastCommentAdded(announcementId: number, comment: CommentItem, updatedAnnouncement?: Announcement) {
    if (!this.io) return;
    this.io.emit('comment:new', { announcementId, comment, updatedAnnouncement });
  }

  public broadcastAttendeeCheckedIn(payload: {
    announcementId: number;
    userId: string;
    checkedIn: boolean;
    checkedInAt: string | null;
    name: string;
  }) {
    if (!this.io) return;
    this.io.emit('attendance:checkedin', payload);
  }
}

export const realtimeService = new RealtimeService();
