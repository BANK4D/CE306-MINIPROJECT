import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import type { Announcement, CommentItem } from '../types/index.js';

class RealtimeService {
  private io: SocketIOServer | null = null;

  public initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, { cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] } });
    this.io.on('connection', (socket) => {
      socket.emit('connected', { time: new Date().toISOString(), message: 'DPU Real-time Service Connected' });
    });
    return this.io;
  }

  private emit(event: string, payload: unknown) {
    this.io?.emit(event, payload);
  }

  public broadcastAnnouncementCreated(announcement: Announcement) {
    this.emit('announcement:created', announcement);
  }

  public broadcastAnnouncementUpdated(announcement: Announcement) {
    this.emit('announcement:updated', announcement);
  }

  public broadcastAnnouncementDeleted(id: number) {
    this.emit('announcement:deleted', { id });
  }

  public broadcastAckChanged(payload: { announcementId: number; ackCount: number }) {
    this.emit('announcement:ack', payload);
  }

  public broadcastRegistrationChanged(payload: { announcementId: number; seatsTaken: number; seatsMax: number | null }) {
    this.emit('announcement:registered', payload);
  }

  public broadcastCommentAdded(announcementId: number, comment: CommentItem, updatedAnnouncement?: Announcement) {
    this.emit('comment:new', { announcementId, comment, updatedAnnouncement });
  }

  public broadcastAttendeeCheckedIn(payload: {
    announcementId: number;
    userId: string;
    checkedIn: boolean;
    checkedInAt: string | null;
    name: string;
  }) {
    this.emit('attendance:checkedin', payload);
  }
}

export const realtimeService = new RealtimeService();
