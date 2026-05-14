import { Router } from 'express';
import { createPrediction, getPredictions } from '../controllers/predictionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/', createPrediction);
router.get('/:patientId', getPredictions);

export default router;
