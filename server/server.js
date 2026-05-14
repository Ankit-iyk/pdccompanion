import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';

import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocketHandler } from './websocket/socketHandler.js';
import { startMockSimulator, triggerDemoFall } from './services/mockSimulator.js';
import { initMQTT } from './mqtt/subscriber.js';
import { setIO } from './controllers/telemetryController.js';

import authRoutes       from './routes/auth.js';
import patientRoutes    from './routes/patients.js';
import telemetryRoutes  from './routes/telemetry.js';
import alertRoutes      from './routes/alerts.js';
import predictionRoutes from './routes/predictions.js';

// ── CORS: support comma-separated origins for multi-env ──────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow no-origin (e.g. curl, Postman, same-origin) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: corsOptions,
  // Production: allow both websocket and polling fallback
  transports: ['websocket', 'polling'],
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' })); // reject oversized payloads
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({
    status:    'ok',
    service:   'PDCompanion API v1.0',
    timestamp:  new Date().toISOString(),
    env:        config.nodeEnv,
    simulator:  config.simulator.enabled ? 'active' : 'disabled',
    mqtt:       config.mqtt.brokerUrl   ? 'active' : 'disabled',
    db:         !!process.env.SUPABASE_SERVICE_KEY,
  })
);

// ── Demo trigger (hackathon only) ─────────────────────────────────────────────
app.post('/api/demo/trigger-fall', (req, res) => {
  const patientId = req.body?.patientId || 'PD001';
  const data = triggerDemoFall(io, patientId);
  res.json({ success: true, triggered: data });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/patients',    patientRoutes);
app.use('/api/telemetry',   telemetryRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/predictions', predictionRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Socket.IO ────────────────────────────────────────────────────────────────
initSocketHandler(io);
setIO(io);

// ── Realtime Sources ──────────────────────────────────────────────────────────
if (config.simulator.enabled) startMockSimulator(io);
initMQTT(io);

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`\n🚀 PDCompanion API  →  http://localhost:${config.port}`);
  console.log(`📡 Socket.IO ready  →  realtime telemetry active`);
  console.log(`🤖 Simulator        →  ${config.simulator.enabled ? 'ACTIVE (2s interval)' : 'disabled'}`);
  console.log(`📶 MQTT             →  ${config.mqtt.brokerUrl ? config.mqtt.brokerUrl : 'disabled'}`);
  console.log(`🗄️  Database         →  ${process.env.SUPABASE_SERVICE_KEY ? 'connected' : 'mock mode'}`);
  console.log();
});

export { io };
