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

## Local sign-in

Create an account from the sign-in screen with a name, email address, and
password of at least 8 characters. New accounts are assigned the student role;
users cannot grant themselves teacher access. Passwords are stored as salted
`scrypt` hashes, and authenticated sessions use HTTP-only cookies and CSRF
tokens.

This is a local development application, not a production-ready identity
service. The server binds to localhost and refuses to start with
`NODE_ENV=production`; do not expose it to a shared network. Teacher accounts
must be provisioned by a trusted administrator rather than through public
registration.

Set `PORT` to change the HTTP port, or `DATABASE_PATH` to choose another SQLite
file location.

## API

- `GET /api/health` — server and database status
- `GET /api/auth/me` — current session
- `POST /api/auth/register` — create a student account
- `POST /api/auth/login` — authenticate with email and password
- `POST /api/auth/logout` — end the current session
- `GET /api/announcements` — announcements and comments for the signed-in user
- `POST /api/announcements` — publish an announcement as an authorized teacher
- `PUT /api/announcements/:id/acknowledgement` — record or remove an acknowledgement
- `POST /api/announcements/:id/registration` — register for an activity
- `POST /api/announcements/:id/comments` — add a comment
