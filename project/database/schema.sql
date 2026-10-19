CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  ai_summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'scholarship', 'activity', 'general')),
  target TEXT NOT NULL CHECK (target IN ('all', 'student', 'teacher')),
  created_at TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  has_pdf INTEGER NOT NULL DEFAULT 0 CHECK (has_pdf IN (0, 1)),
  event_date TEXT,
  ack_count INTEGER NOT NULL DEFAULT 0 CHECK (ack_count >= 0),
  seats_max INTEGER CHECK (seats_max IS NULL OR seats_max >= 0),
  seats_taken INTEGER NOT NULL DEFAULT 0 CHECK (seats_taken >= 0)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  is_teacher INTEGER NOT NULL DEFAULT 0 CHECK (is_teacher IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acknowledgements (
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  registered_at TEXT NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  name TEXT NOT NULL,
  picture TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_announcement_id
  ON comments(announcement_id, id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions(expires_at);
