# Faculty Announcement Hub

The application is organized by file type: the page is in `../demo.html`, its
styles are in `../css/`, browser code is in `../js/`, and the Express server
and SQLite database are in this project directory.

## Requirements

- Node.js 22.5 or newer
- npm

## Run locally

From this directory:

```powershell
npm install
npm start
```

Open <http://localhost:3000>. The server creates
`database/data/announcements.sqlite`, applies `database/schema.sql`, and seeds
the initial announcements on first startup. Existing database contents are
preserved on subsequent starts.

For development with automatic server restarts, run `npm run dev`. To initialize
the database without starting the web server, run `npm run db:init`.

## Local demo sign-in

Email and Google sign-in have been removed for now. Choose a demo student or
demo teacher at the sign-in screen; no email address or external account is
requested. Demo sessions are stored in SQLite and use HTTP-only cookies and
CSRF tokens.

The teacher option exists only to preview announcement management. It is not a
verified staff account or secure authorization system. The server binds to
localhost and refuses to start with `NODE_ENV=production`; do not expose this
demo login to a shared network.

The `.env.example` file now contains only the local port and SQLite path.
Previously configured Google OAuth values are ignored by the application and
can be removed from your local `.env` file if desired.

Set `PORT` to change the HTTP port, or `DATABASE_PATH` to choose another SQLite
file location.

## API

- `GET /api/health` — server and database status
- `GET /api/auth/config` and `GET /api/auth/me` — demo sign-in options and current session
- `POST /api/auth/demo` — create a local demo session
- `POST /api/auth/logout` — end the current session
- `GET /api/announcements` — announcements and comments for the signed-in user
- `POST /api/announcements` — publish an announcement as the local demo teacher
- `PUT /api/announcements/:id/acknowledgement` — record or remove an acknowledgement
- `POST /api/announcements/:id/registration` — register for an activity
- `POST /api/announcements/:id/comments` — add a comment
