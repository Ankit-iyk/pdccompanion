import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { postTelemetry, getTelemetry } from '../controllers/telemetryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rate limit POST /api/telemetry — protects against runaway hardware or accidental floods
// 120 req/min per IP = 1 device pinging every 500ms (well above our 2s simulator rate)
const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many telemetry requests — slow down device ping rate' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // skip localhost / simulator
});

// POST is open (ESP32 devices don't carry user JWTs)
router.post('/', telemetryLimiter, postTelemetry);
router.get('/:patientId', authenticate, getTelemetry);

export default router;
