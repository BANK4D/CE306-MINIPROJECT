export type Role = 'student' | 'teacher';
export type Category = 'academic' | 'scholarship' | 'activity' | 'general';
export type Target = 'all' | 'student' | 'teacher';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  picture: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: number;
  announcementId: number;
  author: string;
  text: string;
  isTeacher: boolean;
  createdAt: string;
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

export interface Session {
  tokenHash: string;
  userId: string;
  csrfToken: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: Role;
}
