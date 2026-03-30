# KeepFresh

KeepFresh helps you track groceries and expiry dates, reduce waste, and get shopping suggestions. Users sign up, manage a virtual fridge, scan or upload receipts to extract items (via OpenAI), optionally complete the flow from a phone using a QR code, refresh AI recommendations from what you have stored, and configure email reminders before items expire.

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, TypeScript, MUI |
| Backend  | FastAPI (Python 3.11), Uvicorn |
| Database | MongoDB 7 |
| AI       | OpenAI API (receipt parsing + recommendations) |

Interactive API docs: **http://localhost:8000/docs** (when the backend is running).
Note: Customer Interview Videos are uploaded with a link in the eclass submission document

## Features (high level)

- **Auth** - Sign up / login with JWT sessions stored server-side (MongoDB `access_tokens`).
- **Fridge** - Add, edit, and delete items with names and expiry dates.
- **Receipts** - Upload a receipt image; the backend extracts grocery line items. You can open a QR code on the desktop flow so a phone can upload the photo to the same session.
- **Recommendations** - LLM-powered suggestions based on current fridge contents (cached until your items change).
- **Notifications** - Per-user email and “days before expiry” preferences; a job sends emails when SMTP is configured (or logs to the server otherwise).

## Architecture

Grocery receipt ingestion flow:

<img width="456" height="928" alt="Receipt flow diagram" src="https://github.com/user-attachments/assets/d0ea0614-7df8-449c-b219-703e6b09e3e5" />

High-level flow:

<img width="704" height="200" alt="High-level architecture" src="https://github.com/user-attachments/assets/e3727470-2351-4025-81e0-7fe45bfdd86b" />

## Repository layout

```
├── frontend/          # Next.js app
├── backend/           # FastAPI app
├── docker-compose.yml # MongoDB + backend + frontend
└── .env               # Local secrets (create from .env.example; not committed)
```

---

## Getting up and running

### Prerequisites

- **Docker** and **Docker Compose** (Docker Desktop is fine).
- An **OpenAI API key** if you want receipt OCR and recommendations to work (variable name in this project is `OPEN_API_KEY`).

### Step 1 - Clone and configure environment

```bash
git clone <repository-url>
cd <project-folder>
cp .env.example .env
```

Edit **`.env`** in the project root (same directory as `docker-compose.yml`). See [Environment variables](#environment-variables) below for every variable and how to obtain values.

### Step 2 - Build and start

From the project root:

```bash
docker compose up --build
```

First build may take a few minutes.

### Step 3 - Open the app

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost:3000 |
| Backend   | http://localhost:8000 |
| API docs  | http://localhost:8000/docs |
| MongoDB   | `mongodb://localhost:27017` (from host; containers use service name `mongodb`) |

Create an account on the signup page, then use **User home** for the fridge, receipts, QR upload, recommendations, and notification settings.

### Stop and reset data

```bash
docker compose down
```

To also remove the MongoDB volume (wipe local data):

```bash
docker compose down -v
```

---

## Environment variables

Create **`.env`** from **`.env.example`**. Variables below are read by the **backend** unless noted. Never commit real secrets.

### Required for AI features (receipts + recommendations)

| Variable | Description |
|----------|-------------|
| `OPEN_API_KEY` | OpenAI API key used by `receipt_ocr.py` and `recommendation_llm.py`. |

**How to get it:** Sign in at [platform.openai.com](https://platform.openai.com/), open **API keys**, create a new secret key, and paste it into `.env` as `OPEN_API_KEY=sk-...`. If unset, flows that call OpenAI will fail when you use those features.

### CORS and browser access

| Variable | Description |
|----------|-------------|
| `CORS_ORIGINS` | Comma-separated list of allowed web origins for the frontend, e.g. `http://localhost:3000,http://192.168.1.10:3000`. Required when the app is opened from a URL other than default localhost. |
| `DEV_HOST` | Optional. If set to your machine’s LAN hostname or IP **without** `http://` (e.g. `192.168.1.10`), the backend adds `http://<DEV_HOST>:3000` to CORS automatically in addition to `CORS_ORIGINS`. |

### JWT (sessions)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for signing JWTs. Optional for local dev; defaults to a development string in code. **Set a long random value in production.** |

### Email notifications (optional)

If any of `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` is missing, the app **does not** send real mail; it logs a `[NOTIFICATION]` line to the backend logs instead.

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname (e.g. Gmail: `smtp.gmail.com`). |
| `SMTP_PORT` | Port (default `587` with STARTTLS in code). |
| `SMTP_USER` | SMTP login, often your full email address. |
| `SMTP_PASS` | App password or SMTP token - for Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) (2FA must be on). Use the 16-character password **without spaces** in `.env`. |

### Frontend build (Docker): phone / QR / LAN testing

Next.js inlines `NEXT_PUBLIC_*` at **build** time. For `docker compose`, put these in the **project root** `.env` so Compose can pass [build args](https://docs.docker.com/compose/environment-variables/set-environment-variables/) into the frontend image:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_DEV_HOST` | Your computer’s LAN IP or hostname **only** (e.g. `192.168.1.10`) - **no** `http://` or port. Used so QR codes and API URLs point at your machine when testing from a phone. After changing it, **rebuild** the frontend: `docker compose build --no-cache frontend` (or `docker compose up --build`). |
| `NEXT_PUBLIC_API_URL` | Optional. Full backend base URL if you override the default derived from `NEXT_PUBLIC_DEV_HOST`. |
| `NEXT_PUBLIC_APP_URL` | Optional. Full frontend base URL override. |

**Local dev without Docker (`npm run dev` in `frontend/`):** put `NEXT_PUBLIC_DEV_HOST` (and optional overrides) in **`frontend/.env.local`**, then restart the dev server.

**Note:** Your laptop’s LAN IP can change when you switch Wi‑Fi or hotspot. Update `NEXT_PUBLIC_DEV_HOST` and rebuild the frontend image when it does.

---

## Testing on a phone (QR receipt upload)

1. Set `CORS_ORIGINS` (and optionally `DEV_HOST`) so your phone’s origin is allowed - e.g. include `http://<your-lan-ip>:3000`.
2. Set `NEXT_PUBLIC_DEV_HOST=<your-lan-ip>` in root `.env`, rebuild the frontend container, and restart Compose.
3. Open the app on your laptop using the same network; generate the QR from the receipt flow and scan with the phone.

---

## Development without Docker (optional)

- **Backend:** Python 3.11+, install `backend/requirements.txt`, run MongoDB locally or point `MongoClient` at your URI (the code currently uses `mongodb://mongodb:27017` for Docker; adjust for local runs).
- **Frontend:** `cd frontend && npm install && npm run dev` (listens on `0.0.0.0`). Use `frontend/.env.local` for `NEXT_PUBLIC_*`.

## Tests

**Backend (pytest):** install dependencies, then from `backend/` run:

```bash
cd backend && pytest
```

**Frontend (Playwright e2e):** from `frontend/`, run `npm install` then `npx playwright install` once (installs browsers). Playwright starts `npm run dev` automatically unless a dev server is already running (`playwright.config.ts`). Then:

```bash
cd frontend && npm run test:e2e
```

Optional: `npm run test:e2e:headed` to watch the browser, or `npm run test:e2e:report` to open the HTML report after a run.
