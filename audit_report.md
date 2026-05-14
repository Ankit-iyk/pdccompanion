# PDCompanion — Codebase Audit & Improvement Plan

## Architecture Summary
Clean, modular Node.js + React stack. Fundamentally sound. No major rewrites needed.

---

## 🔴 Critical Issues (Fix Immediately)

### 1. `alertService.js` — Alert storm on every simulator tick
**Problem:** `checkTelemetryAlerts` writes to DB and fires Socket.IO events on EVERY qualifying tick. With 3 patients × 30 ticks/min, a single high-HR episode generates hundreds of DB rows in minutes.  
**Fix:** Add per-patient cooldown (minimum 60s between same-type alerts).

### 2. `useAlerts.js` — Missing filter on `new_alert` injection
**Problem:** `useAlerts('all')` and `useAlerts('PD001')` both receive ALL new_alert events. Patient-specific pages incorrectly display other patients' alerts in real-time.  
**Fix:** Filter incoming socket alerts by `patientId` when not 'all'.

### 3. `AlertsPage.jsx` — `PATCH /api/alerts/undefined/resolve` seen in server logs
**Problem:** `resolve(alert.id)` is called where `id` is undefined — the alert objects injected via Socket.IO have no `id` until DB confirms. Calling resolve on `undefined` causes a 200 response but does nothing.  
**Fix:** Disable resolve button if `!alert.id`.

### 4. `SocketContext.jsx` — No reconnect config on Socket.IO client
**Problem:** If backend restarts mid-demo, the frontend never reconnects automatically (uses `websocket` transport only, no polling fallback).  
**Fix:** Add `reconnectionAttempts`, `reconnectionDelay`, and allow polling fallback.

---

## 🟡 Stability Issues (Fix Before Demo)

### 5. `mockSimulator.js` — No simulator interval cleanup / memory leak
**Problem:** `setInterval` reference is never stored or cleared. If server restarts (`node --watch`), a new interval stacks on top of the old one → double telemetry events.  
**Fix:** Store interval ref, clear before creating new one. Export a `stopSimulator` function.

### 6. `server.js` — CORS hardcoded to single origin
**Problem:** In production (Render + Vercel), the origin changes. Currently only `config.clientUrl` is allowed.  
**Fix:** Support comma-separated `CLIENT_URL` list or array for multi-origin CORS.

### 7. `telemetryController.js` — No rate limiting on `POST /api/telemetry`
**Problem:** Anyone (or malformed hardware) can flood the telemetry endpoint with unlimited requests.  
**Fix:** Add simple in-memory rate limiter (express-rate-limit).

### 8. Backend `.env` — `SUPABASE_SERVICE_KEY` is now in git history
**Problem:** The key was temporarily committed before `.gitignore` was set. Should be rotated.  
**Note:** Informational only — user must rotate key in Supabase dashboard.

---

## 🟢 Polish Issues (Demo Quality)

### 9. Frontend — No "Last updated X sec ago" indicator
Patients could go stale during a demo without any visual indicator.

### 10. Frontend — No patient status badge (Stable / Warning / Critical)
Currently only showing raw numbers. A "Critical" badge has more demo impact.

### 11. Frontend — Emergency demo trigger button missing
Hackathon judges benefit from a one-click "trigger fall event" for live demo.

### 12. Frontend — Skeleton loading states missing
Pages flash empty before data loads. Skeleton loaders look more polished.

### 13. `index.css` — Missing `animate-fade-in` definition
`.page-enter { @apply animate-fade-in; }` references a Tailwind `animate-fade-in` class that only exists if defined in `tailwind.config.js`. If not defined → silent failure.

---

## Prioritized Fix Order

| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | `services/alertService.js` | Alert cooldown map | Prevents DB flood |
| 2 | `hooks/useAlerts.js` | Filter socket alerts by patientId | Fixes wrong alerts on detail page |
| 3 | `pages/AlertsPage.jsx` | Guard resolve button | Fixes undefined ID 200 no-op |
| 4 | `context/SocketContext.jsx` | Reconnect config + polling fallback | Demo reliability |
| 5 | `services/mockSimulator.js` | Interval cleanup | Prevents double-emit on hot reload |
| 6 | `server.js` | Multi-origin CORS + Socket.IO production config | Deployment readiness |
| 7 | `tailwind.config.js` | Add `animate-fade-in` keyframe | UI polish |
| 8 | `index.css` | Add skeleton animation, pulse, status badge styles | Demo polish |
| 9 | `components/PatientCard.jsx` | Add status badge + last updated | Demo polish |
| 10 | `pages/Dashboard.jsx` | Add emergency demo trigger | Hackathon demo |

---

## Deployment Checklist

### Backend (Render)
- [ ] Set all env vars in Render dashboard (PORT auto-set, don't override)
- [ ] Set `CLIENT_URL` to Vercel URL
- [ ] Set `NODE_ENV=production`
- [ ] Rotate `SUPABASE_SERVICE_KEY` (currently in git history)
- [ ] Set `ENABLE_SIMULATOR=true` for demo

### Frontend (Vercel)
- [ ] Set `VITE_SOCKET_URL` to Render backend URL
- [ ] Set `VITE_API_URL` if not using proxy
- [ ] Verify `vite.config.js` proxy only applies in `dev` mode

