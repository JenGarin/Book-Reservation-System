# Ventra

Ventra is a standalone web app for court reservations, coach hiring, sessions, and check-in workflows.

## Run Locally (Standalone)

1. Install dependencies:
   - `npm install`
2. Start the app:
   - `npm run dev`
3. Open:
   - `http://localhost:5173`
   - `http://<your-local-ip>:5173` (from other devices on same Wi-Fi)

This works as a standalone website using local app storage (no backend required for core flows).

## Access From Any Device (LAN)

To open the website on phones/tablets in the same Wi-Fi network:

1. Start the app:
   - `npm run dev`
2. Find your computer IP (example `192.168.1.20`).
3. Open from another device browser:
   - `http://192.168.1.20:5173`
4. Set QR public URL so scanned QR opens correctly on other devices:
   - `VITE_PUBLIC_BASE_URL=http://192.168.1.20:5173`

Note: Make sure Windows Firewall allows Node.js on Private networks for LAN access.

## Build and Preview

1. Create a production build:
   - `npm run build`
2. Preview the built site:
   - `npm run preview`

## Optional: Enable Supabase Social Login

By default, social login is disabled for standalone mode.

To enable it, set:
- `VITE_ENABLE_SUPABASE_AUTH=true`
- `VITE_SUPABASE_URL=<your-supabase-url>`
- `VITE_SUPABASE_ANON_KEY=<your-anon-key>`

## Optional: Use Backend API

Frontend can run in API-backed mode (for requests, notifications, and subscriptions) by setting:
- `VITE_USE_BACKEND_API=true`
- `VITE_API_BASE_URL=<your-api-base-url>` (example: `http://localhost:54321/functions/v1/server/api/v1`)

For true multi-device shared bookings/data, enable backend API mode so all devices read/write the same data source.

## Backend Completion Notes

The backend now includes:
- full role-based booking lifecycle (`pending -> confirmed/cancelled/completed/no_show`)
- coach profile + verification workflow
- notifications with unread count and mark-read endpoints
- training session join/leave flows
- receipt endpoint per booking: `GET /api/v1/bookings/:id/receipt`
- public QR receipt endpoint: `GET /api/v1/public/receipts/:token`
- payment status workflow endpoint: `POST /api/v1/bookings/:id/payment`
- payment checkout endpoint (player/admin/staff):
  - `POST /api/v1/payments/checkout` with `{ "bookingId": "...", "method": "maya|gcash" }`
- payment transaction query endpoints:
  - `GET /api/v1/payments` (own payments; admin/staff can query all)
  - `GET /api/v1/payments/:id` (own payment detail; admin/staff can query any)
  - `POST /api/v1/payments/:id/retry` (owner/admin/staff; retries failed/expired/cancelled transaction)
- payment webhook endpoint:
  - `POST /api/v1/payments/webhook` (provider callback)
  - webhook event dedupe supported via `eventId` / `id` / `data.id` to avoid duplicate side effects
- stale payment session operations endpoint (admin/staff):
  - `POST /api/v1/admin/payments/expire-stale`
  - body: `{"dryRun":true|false,"olderThanMinutes":180,"referenceNow":"<iso-optional>"}`
- payment health metrics endpoint (admin/staff):
  - `GET /api/v1/admin/payments/health?days=7`
  - returns status distribution, retry/stale-expired counts, rates, and mismatch counters
- payment deadline management endpoint (admin/staff):
  - `POST /api/v1/bookings/:id/payment-deadline`
  - modes: `{"clear": true}` or `{"ttlMinutes": 45}` or `{"dueAt":"<iso>"}` (exactly one)
- unpaid payment-deadline monitoring endpoint (admin/staff):
  - `GET /api/v1/admin/bookings/unpaid-monitor?status=all|overdue|at_risk&windowMinutes=120&referenceNow=<iso>`
- payment reconciliation endpoint (admin/staff):
  - `GET /api/v1/admin/payments/reconciliation?issueType=paid_tx_booking_unpaid|booking_paid_without_paid_tx|confirmed_unpaid_without_tx|orphan_tx_booking_missing&page=1&limit=20`
  - `GET /api/v1/admin/payments/reconciliation/export?format=json|csv&issueType=...`
  - `POST /api/v1/admin/payments/reconciliation/resolve` with body:
    - `{"issueType":"paid_tx_booking_unpaid","bookingId":"...","dryRun":true|false}`
    - `{"issueType":"booking_paid_without_paid_tx","bookingId":"...","dryRun":true|false}`
    - `{"issueType":"confirmed_unpaid_without_tx","bookingId":"...","dryRun":true|false}`
    - `{"issueType":"orphan_tx_booking_missing","txId":"...","dryRun":true|false}`
  - `POST /api/v1/admin/payments/reconciliation/resolve/bulk` with body:
    - `{"dryRun":true|false,"items":[{"issueType":"...","bookingId":"..."},{"issueType":"...","txId":"..."}]}`
  - `POST /api/v1/admin/payments/reconciliation/resolve/by-filter` with body:
    - `{"issueType":"paid_tx_booking_unpaid|booking_paid_without_paid_tx|confirmed_unpaid_without_tx|orphan_tx_booking_missing","maxItems":20,"dryRun":true|false}`
- unified booking status transition endpoint (admin/staff):
  - `PATCH /api/v1/bookings/:id/status`
  - allowed transitions: `pending -> confirmed|cancelled`, `confirmed -> cancelled|completed|no_show`
- booking timeline endpoint:
  - `GET /api/v1/bookings/:id/timeline?order=asc|desc`
  - returns synthetic `booking_created` event + all booking audit actions with actor details
- temporary slot holds (to reduce reservation race conflicts):
  - `POST /api/v1/bookings/holds` (create 1-30 min hold; default 10)
  - `GET /api/v1/bookings/holds/me` (list current user's active holds)
  - `DELETE /api/v1/bookings/holds/:id` (release hold)
  - booking create now rejects slots held by another user and consumes your own overlapping hold
- reservation history endpoint with active/past split + counters:
  - `GET /api/v1/bookings/history?view=active|past|all`
  - defaults to done-only past history (`completed`), with optional `includeNoShow=true` and `includeCancelled=true`
- coach application pipeline:
  - `POST /api/v1/coach/applications` (player applies)
  - `GET /api/v1/coach/applications/me` (player status tracking)
  - `GET /api/v1/coach/applications` (coach inbox)
  - `POST /api/v1/coach/applications/:id/approve`
  - `POST /api/v1/coach/applications/:id/reject`
  - `GET /api/v1/coach/students` (approved students list)
- session auto-enrollment support by sport:
  - `GET /api/v1/coach/sessions/eligible-students?sport=...` or `?courtId=...`
  - `POST /api/v1/coach/sessions` auto-adds approved students matching session sport
- coach attendance tracking and reporting:
  - `GET /api/v1/coach/sessions/:id/attendance`
  - `POST /api/v1/coach/sessions/:id/attendance`
  - `GET /api/v1/coach/reports/attendance`
- admin/staff attendance analytics:
  - `GET /api/v1/analytics/attendance/overview`
  - `GET /api/v1/analytics/coaches/:coachId/attendance`
  - `GET /api/v1/analytics/courts/:courtId/attendance`
- audit logs:
  - `GET /api/v1/admin/audit-logs` (admin/staff, filter + pagination)
  - `GET /api/v1/admin/audit-logs/export` (admin/staff, `format=json|csv`)
  - `POST /api/v1/admin/audit-logs/purge` (admin only, supports dry-run)

For absolute QR/receipt targets across devices, set:
- `PUBLIC_APP_BASE_URL=http://<your-ip-or-domain>`
- optional strict auth hardening:
  - `AUTH_REQUIRE_BEARER=true` (rejects header-only `x-user-id` auth and requires `Authorization: Bearer ...`)
- optional rate limiting hardening:
  - `RATE_LIMIT_AUTH_LOGIN_MAX`, `RATE_LIMIT_AUTH_LOGIN_WINDOW_SEC`
  - `RATE_LIMIT_AUTH_SIGNUP_MAX`, `RATE_LIMIT_AUTH_SIGNUP_WINDOW_SEC`
  - `RATE_LIMIT_AUTH_OAUTH_START_MAX`, `RATE_LIMIT_AUTH_OAUTH_START_WINDOW_SEC`
  - `RATE_LIMIT_BOOKING_CREATE_MAX`, `RATE_LIMIT_BOOKING_CREATE_WINDOW_SEC`
  - `RATE_LIMIT_PAYMENT_CHECKOUT_MAX`, `RATE_LIMIT_PAYMENT_CHECKOUT_WINDOW_SEC`
  - `RATE_LIMIT_PAYMENT_WEBHOOK_MAX`, `RATE_LIMIT_PAYMENT_WEBHOOK_WINDOW_SEC`

## Database Setup (Supabase)

This project now includes a relational schema for users, courts, bookings, plans, subscriptions, and notifications.

Use one of these:
- `supabase_schema.sql` (run directly in Supabase SQL Editor)
- `supabase/migrations/20260222_init_ventra_relational.sql` (for migration workflow)

After running schema SQL, your DB will include seeded records:
- Users: `admin-1`, `staff-1`, `coach-1`, `player-1`
- Courts: `c1`, `c2`, `c3`
- Plans: `m1`, `m2`
