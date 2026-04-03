# KPR ERP CAP - Go-Live Checklist

## 1. Current Completion Status

### Core delivery status

- Frontend: builds successfully with Vite.
- Backend: starts successfully and connects to PostgreSQL.
- API wiring: core student/faculty/admin feature flows are connected to backend APIs.
- Persistence: major modules now store data in PostgreSQL (including `service_requests` and `ndc_achievements`).

### Important note

- Backend code still contains some legacy in-memory fallback branches in a few controllers, but runtime now fails if PostgreSQL is unavailable (no silent memory fallback startup). In normal startup with DB available, app runs in PostgreSQL mode.

## 2. Environment Variables

Configure backend `.env` with at least:

- `PORT=5000`
- `JWT_SECRET=your-secret`
- `PG_HOST=localhost`
- `PG_PORT=5432`
- `PG_USER=postgres`
- `PG_PASSWORD=postgres`
- `PG_DATABASE=kpr_erp`
- `PG_SSL=false`

Optional (real email delivery):

- `GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com` (backend)
- `VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com` (frontend)

Google Sign-In uses these client IDs for token verification and client initialization.

## 3. Install and Run

### Backend

1. `cd college-erp-cap/backend`
2. `npm install`
3. `npm run dev`

Expected startup indicators:

- `Connected to PostgreSQL`
- `Database schema initialized`
- `Backend running on http://localhost:<port>`

### Frontend

1. `cd college-erp-cap/frontend`
2. `npm install`
3. `npm run dev`

Build validation:

- `npm run build`

## 4. Health and DB Validation

### Backend health endpoint

- `GET /api/health`

Expected response shape:

- `status: "ok"`
- `database: "postgres"`
- `schema.users: true`
- `schema.serviceRequests: true`
- `schema.ndcAchievements: true`

## 5. API Connectivity Smoke Tests

Verify these key paths end-to-end with a valid token:

- Auth:
  - `POST /api/auth/login`
- Service requests:
  - `POST /api/services/requests`
  - `GET /api/services/requests`
  - `PATCH /api/services/requests/:requestId/status`
- NDC achievements:
  - `POST /api/ndc-achievements`
  - `GET /api/ndc-achievements`
  - `PATCH /api/ndc-achievements/:achievementId/status`

## 6. Frontend Module Smoke Tests

Verify role-wise pages and actions:

- Student:
  - Hostel applications/stay permission submit + view history
  - Bonafide submit
  - NDC create/upload
- Faculty:
  - Approve/reject bonafide, hostel, NDC
  - Service request approval page loads API data
- Admin:
  - View approval pages and dashboards
  - User management and department/course management screens

## 7. Security and Quality Follow-ups (Recommended)

- Run `npm audit fix` in backend and frontend.
- Configure production Google OAuth consent/app settings before go-live.
- Add automated API smoke tests for auth + request lifecycle.
- Remove legacy fallback branches from controllers in a cleanup pass (optional but recommended for long-term maintainability).

## 8. Final Verdict

Project is in a production-ready state for core DB/API-backed flows, with frontend/backend packaging and runtime checks in place.

Remaining non-blockers are operational hardening tasks (Google OAuth production setup and deeper auth/API smoke coverage).
