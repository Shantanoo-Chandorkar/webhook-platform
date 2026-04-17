# WebhookBin

A self-hosted webhook inspection tool. Generate a unique endpoint URL, capture every incoming HTTP request in real time, inspect headers, query parameters and body, and replay any request to a target URL of your choice.

**Author:** cshan

---

## What It Does

- Generates a unique endpoint URL that accepts any HTTP method
- Streams incoming requests to the dashboard in real time via Server-Sent Events
- Displays full request detail: headers, query parameters, body with JSON formatting
- Replays any captured request to a target URL with the original method, headers, and body
- Exports captured requests as JSON files
- Enforces per-IP rate limiting with live dashboard alerts
- Endpoints expire automatically after 24 hours with no cleanup required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, Shadcn |
| Backend | Next.js 16 (API routes) |
| Database | MongoDB (Mongoose) |
| Cache / Pub-Sub | Redis (Upstash) |
| Monorepo | npm workspaces |

---

## Project Structure

```
webhook-platform/
  apps/
    web/        Next.js frontend (port 3000)
    api/        Next.js API backend (port 3001)
```

---

## Prerequisites

- Node.js 18 or later
- A MongoDB database (MongoDB Atlas free tier works)
- A Redis instance (Upstash free tier works)

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd webhook-platform

# Install all workspace dependencies from the root
npm install
```

---

## Environment Variables

### API (`apps/api/.env.local`)

Copy from the provided example:

```bash
cp apps/api/.env.example apps/api/.env.local
```

Then fill in the values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/webhook-platform
REDIS_URL=rediss://default:<password>@<host>:<port>
API_BASE_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string (use `rediss://` for TLS, `redis://` for plain) |
| `API_BASE_URL` | Public base URL of the API server. Used to construct webhook endpoint URLs |
| `ALLOWED_ORIGINS` | Comma-separated list of frontend origins permitted by CORS |

### Web (`apps/web/.env.local`)

Create the file manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public base URL of the API server. Exposed to the browser |

---

## Running Locally

Open two terminals from the project root:

```bash
# Terminal 1 — API server (port 3001)
npm run dev:api

# Terminal 2 — Web frontend (port 3000)
npm run dev:web
```

Open `http://localhost:3000` in your browser.

---

## Troubleshooting

**Requests are not appearing in real time**

Check that `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` points to the running API server. The SSE stream connects to that URL directly from the browser.

**`ECONNREFUSED` or database connection errors on startup**

Verify `MONGODB_URI` is correct and that your IP is whitelisted in MongoDB Atlas under Network Access.

**`Redis connection failed` errors**

Verify `REDIS_URL` is correct. Upstash requires `rediss://` (with double `s`) for TLS connections. Plain `redis://` will be refused by Upstash.

**Rate limit not resetting**

Rate limit bans are stored as Redis keys with a 1-hour TTL. To clear a ban manually, delete the key `ratelimit:ban:<ip>:<endpointId>` from your Redis instance via the Upstash Data Browser or CLI.

**CORS errors in the browser**

Ensure `ALLOWED_ORIGINS` in the API environment includes the exact origin of your frontend, including the protocol and port (e.g. `http://localhost:3000`). No trailing slash.

**`window.confirm` blocked or dialogs not opening**

This should not occur in production. If testing in an environment that blocks `window.confirm`, note that the project uses Shadcn AlertDialog for all confirmations and does not call `window.confirm`.
