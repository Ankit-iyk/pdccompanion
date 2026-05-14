import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../utils/validator.js';

const router = Router();

router.post('/register',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  register
);

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  login
);

router.get('/me', authenticate, getMe);

export default router;
