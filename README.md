# PDCompanion

> Smart IoT + AI platform for real-time Parkinson's disease monitoring.

**Stack:** Node.js · Express · Supabase (PostgreSQL) · Socket.IO · React · Tailwind CSS · Recharts

---

## 📁 Project Structure

```
pdc/
├── server/     ← Node.js + Express backend
└── client/     ← React + Tailwind frontend
```

---

## ⚡ Quick Start (Local Dev)

### 1. Set up the backend

```powershell
cd pdc/server
npm install
copy .env.example .env
# Edit .env — add SUPABASE_URL and SUPABASE_SERVICE_KEY
npm run dev
```

Backend starts at **http://localhost:5000**

> 💡 The mock simulator auto-starts and generates telemetry for 3 patients every 2 seconds — **no hardware or Supabase needed to run the dashboard**.

### 2. Set up the frontend

```powershell
cd pdc/client
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

### 3. Login

Use the demo quick-fill buttons on the login page, or:

| Role      | Email                          | Password     |
|-----------|-------------------------------|--------------|
| Doctor    | doctor@pdcompanion.com        | Doctor@123   |
| Caretaker | caretaker1@pdcompanion.com    | Care@123     |
| Patient   | patient1@pdcompanion.com      | Patient@123  |

---

## 🗄️ Supabase Setup (optional — app works without it)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `server/supabase/schema.sql`
3. Add credentials to `server/.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```
4. Seed demo data:
   ```powershell
   cd server
   npm run seed
   ```

---

## 🌐 API Reference

| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| GET    | /api/health                 | ✗    | System health check      |
| POST   | /api/auth/register          | ✗    | Create account           |
| POST   | /api/auth/login             | ✗    | Login → returns JWT      |
| GET    | /api/auth/me                | ✓    | Get current user         |
| GET    | /api/patients               | ✓    | List all patients        |
| GET    | /api/patients/:id           | ✓    | Single patient + devices |
| POST   | /api/telemetry              | ✗    | Ingest device telemetry  |
| GET    | /api/telemetry/:patientId   | ✓    | Historical telemetry     |
| GET    | /api/alerts/all             | ✓    | All alerts               |
| GET    | /api/alerts/:patientId      | ✓    | Patient alerts           |
| PATCH  | /api/alerts/:id/resolve     | ✓    | Resolve alert            |
| GET    | /api/predictions/:patientId | ✓    | AI predictions           |
| POST   | /api/predictions            | ✓    | Store AI prediction      |

---

## 📡 Socket.IO Events

| Event            | Direction       | Payload                        |
|------------------|-----------------|--------------------------------|
| `join_monitoring`| client → server | —                              |
| `join_patient`   | client → server | `patientId: string`            |
| `telemetry`      | server → client | telemetry reading object       |
| `new_alert`      | server → client | alert object                   |
| `sos_alert`      | server → client | `{ patientId, alert }`         |

---

## 🔧 Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_key
ENABLE_SIMULATOR=true
```

### Frontend (`client/.env`)

```env
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Deployment

### Backend → Render

1. Push `pdc/server/` to GitHub
2. New **Web Service** → Environment: Node → Build: `npm install` → Start: `npm start`
3. Add env vars in Render dashboard

### Frontend → Vercel

1. Push `pdc/client/` to GitHub
2. Import in Vercel → Framework: **Vite**
3. Set `VITE_SOCKET_URL=https://your-render-url.onrender.com`

---

## 🤖 MQTT Integration (ESP32 Hardware)

Set in `server/.env`:
```env
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=pdcompanion/telemetry
```

ESP32 payload format:
```json
{
  "patientId": "PD001",
  "heartRate": 92,
  "tremorScore": 0.76,
  "temperature": 30.4,
  "fallDetected": false
}
```

Set `ENABLE_SIMULATOR=false` when using real hardware.

---

## 👥 Demo Patients

| ID    | Name              | Age | Stage |
|-------|-------------------|-----|-------|
| PD001 | Marcus Thompson   | 68  | II    |
| PD002 | Eleanor Rodriguez | 72  | III   |
| PD003 | James Chen        | 65  | II    |
