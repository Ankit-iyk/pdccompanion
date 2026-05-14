import { Router } from 'express';
import { createAlert, getAlerts, resolveAlert } from '../controllers/alertController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/', createAlert);
router.get('/:patientId', getAlerts); // patientId = 'all' for dashboard
router.patch('/:id/resolve', resolveAlert);

export default router;
