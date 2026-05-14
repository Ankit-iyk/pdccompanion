import { Router } from 'express';
import { getPatients, getPatientById } from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getPatients);
router.get('/:id', getPatientById);

export default router;
