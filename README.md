# Nexus OS — Task Management MVP

A clean, reliable, and secure personal task manager built with React 18, TypeScript, Vite, Tailwind CSS, Zustand, Node 20, Express 5, and MongoDB.

---

## 🚀 MVP Scope

The core MVP is a hardened, personal task manager:
- **Authentication:**
  - Secure Email & Password signup with 6-digit email OTP verification.
  - Google OAuth redirect flow with single-use, 60-second one-time authorization code exchange.
  - Normalized lowercase emails, 8-character password enforcement, and secure JWT authentication.
- **Tasks Management:**
  - Full CRUD operations with optimistic updates and automatic rollback with error toasts on network/server rejection.
  - List View and Kanban Board with touch-friendly mobile status menus.
  - Priority levels (`P1`, `P2`, `P3`, `P4`), due dates, tags, and deep/shallow energy levels.
  - Subtasks with progress indicators and completion toggles.
  - Recurring tasks (`daily`, `weekly`, `monthly`).
- **Dashboard:**
  - High-level task summary (Today's Plan, Workload bar, High Priority P1 tasks, Completed stats).
  - Quick action shortcuts (Create Task, Focus Mode Horizon).
  - Pure read-only summary reading directly from central store with zero re-fetching loops.
- **Profile & Account Management:**
  - Update display name.
  - Change password (including setting a first password for Google-only users).
  - Cascade account deletion (permanently cleans up user record and all associated tasks).
- **Public Legal Pages:**
  - Landing page, Privacy Policy, and Terms of Service (required for Google OAuth verification).

*Out-of-scope modules (Orders, Habits, Notes, Calendar blocks, Socket.io, AI parsing) are cleanly hidden from the MVP interface.*

---

## 🛠️ Architecture & Tech Stack

- **Frontend (`/frontend-app`):**
  - **Framework:** React 18, TypeScript, Vite 5.
  - **Styling:** Tailwind CSS 3, Lucide icons.
  - **State Management:** Zustand (with granular selectors and optimistic rollback handling).
  - **Animations:** Framer Motion (with parent `AnimatePresence` for modal & palette exits).
  - **Routing:** React Router v6 (layout route pattern with `<Outlet />` under `<ProtectedRoute>`).
- **Backend (`/backend`):**
  - **Runtime & Server:** Node.js 20, Express 5 (ES modules).
  - **Database:** MongoDB via Mongoose 9 (supports local MongoDB, Atlas, or in-memory fallback for local dev).
  - **Security:**
    - Helmet HTTP security headers.
    - CORS origin restriction.
    - Rate limiting (`express-rate-limit`): 300 req/15min globally, 50 req/15min on auth endpoints.
    - Mass-assignment protection via explicit field whitelisting.
    - AES-256-GCM encryption for third-party tokens at rest.
    - Synchronous `jwt.sign` and strict `JWT_SECRET` verification (refuses to boot if missing).
    - Database-first startup flow (connects to MongoDB before listening on port).

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Local backend port | `5005` |
| `JWT_SECRET` | Secret key for signing JWTs (**Required**, no fallback) | `your_strong_jwt_secret` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/smart-productivity` |
| `FRONTEND_URL` | Frontend origin for CORS and OAuth redirects | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL for OAuth redirects | `http://localhost:5005` |
| `TOKEN_ENCRYPTION_KEY` | AES-256 key for encrypting tokens at rest | `your_token_encryption_key_32_chars` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `your-google-client-secret` |
| `GOOGLE_CALLBACK_URL` | Google Sign-In redirect URI | `http://localhost:5005/api/auth/google/callback` |
| `GOOGLE_REDIRECT_URI` | Google Drive redirect URI | `http://localhost:5005/api/drive/callback` |
| `SMTP_HOST` | SMTP server for OTP emails (e.g. Gmail) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP app password | `your-app-password` |
| `EMAIL_FROM` | Sender display name & email | `"Nexus OS" <noreply@nexus-os.com>` |

### Frontend (`frontend-app/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API Base URL | `http://localhost:5005/api` |
| `VITE_ENABLE_DRIVE` | Toggle Google Drive backup UI (`true`/`false`) | `false` |

---

## 🏃 Run & Build Commands

### 1. Installation
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-app
npm install
```

### 2. Local Development
```bash
# Terminal 1: Start Backend (Port 5005)
cd backend
npm start

# Terminal 2: Start Frontend (Port 5173)
cd frontend-app
npm run dev
```

### 3. Verification & Testing
```bash
# Run Backend Security Acceptance Suite
node backend/test/security_acceptance.js

# Run Local Date & Timezone Tests
node backend/test/date_and_rollback.test.js

# Type-check and Bundle Frontend
npm --prefix frontend-app run build
```

---

## 🚢 Deployment Notes

### Deploying Backend on Render
1. Create a new **Web Service** pointing to the repository.
2. Root Directory: `backend`
3. Runtime: `Node` (Node 20+)
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables:
   - `JWT_SECRET` (generate a strong random secret)
   - `MONGO_URI` (MongoDB Atlas connection string)
   - `FRONTEND_URL` (your deployed Vercel domain e.g. `https://your-app.vercel.app`)
   - `TOKEN_ENCRYPTION_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - SMTP credentials if sending verification emails.
7. *Sleeping Server Handling:* Render's free tier spins down after inactivity. The frontend includes a waking server detector (>3.5s) that alerts the user with an animated status banner.

### Deploying Frontend on Vercel
1. Import the repository into Vercel.
2. Root Directory: `frontend-app`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
   - `VITE_ENABLE_DRIVE`: `false` (or `true` once Google Drive API consent screen is approved)
7. SPA routing is automatically handled via `frontend-app/vercel.json`.
