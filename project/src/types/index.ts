export type Role = 'student' | 'teacher';
export type Category = 'academic' | 'scholarship' | 'activity' | 'general';
export type Target = 'all' | 'student' | 'teacher';

export interface CommentItem {
  id: number;
  announcementId: number;
  author: string;
  text: string;
  isTeacher: boolean;
  createdAt: string;
}

export interface AttachmentItem {
  id: number;
  announcementId: number;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface Announcement {
  id: number;
  title: string;
  aiSummary: string;
  content: string;
  category: Category;
  target: Target;
  date: string;
  pinned: boolean;
  hasPdf: boolean;
  eventDate: string | null;
  ackCount: number;
  seatsMax: number | null;
  seatsTaken: number;
  acknowledged: boolean;
  registered: boolean;
  comments: CommentItem[];
  attachments: AttachmentItem[];
}

export interface RegistrationRecord {
  announcementId: number;
  userId: string;
  registeredAt: string;
  name: string;
  email: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: Role;
}
