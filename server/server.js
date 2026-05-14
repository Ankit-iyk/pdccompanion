import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';

import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocketHandler } from './websocket/socketHandler.js';
import { startMockSimulator } from './services/mockSimulator.js';
import { initMQTT } from './mqtt/subscriber.js';
import { setIO } from './controllers/telemetryController.js';

import authRoutes       from './routes/auth.js';
import patientRoutes    from './routes/patients.js';
import telemetryRoutes  from './routes/telemetry.js';
import alertRoutes      from './routes/alerts.js';
import predictionRoutes from './routes/predictions.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'], credentials: true },
});

// ── Middleware ─────────────────────────────────
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Health ─────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'PDCompanion API v1.0',
    timestamp: new Date().toISOString(),
    simulator: config.simulator.enabled ? 'active' : 'disabled',
    mqtt: config.mqtt.brokerUrl ? 'active' : 'disabled',
  })
);

// ── API Routes ─────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/patients',    patientRoutes);
app.use('/api/telemetry',   telemetryRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/predictions', predictionRoutes);

// ── 404 ────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler (must be last) ───────────────
app.use(errorHandler);

// ── Socket.IO ──────────────────────────────────
initSocketHandler(io);
setIO(io); // inject io into telemetry controller

// ── Realtime Sources ───────────────────────────
if (config.simulator.enabled) startMockSimulator(io);
initMQTT(io); // no-op if MQTT_BROKER_URL is not set

// ── Start ──────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`\n🚀 PDCompanion API  →  http://localhost:${config.port}`);
  console.log(`📡 Socket.IO ready  →  realtime telemetry active`);
  console.log(`🤖 Simulator        →  ${config.simulator.enabled ? 'ACTIVE (2s interval)' : 'disabled'}`);
  console.log(`📶 MQTT             →  ${config.mqtt.brokerUrl ? config.mqtt.brokerUrl : 'disabled'}`);
  console.log();
});

export { io };
