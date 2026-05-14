import { Router } from 'express';
import { postTelemetry, getTelemetry } from '../controllers/telemetryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST is open (ESP32 devices won't carry user JWTs)
router.post('/', postTelemetry);
router.get('/:patientId', authenticate, getTelemetry);

export default router;
