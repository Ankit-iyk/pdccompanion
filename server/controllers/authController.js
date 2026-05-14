import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'caretaker' } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  const ALLOWED_ROLES = ['doctor', 'patient', 'caretaker', 'admin'];
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}` });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

  const { data: existing } = await supabase
    .from('pd_users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('pd_users')
    .insert({ name, email, password_hash, role })
    .select('id, name, email, role, created_at')
    .single();

  if (error) throw new Error(error.message);

  res.status(201).json({ token: signToken(user), user });
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!supabase) {
    // Dev fallback: accept seeded demo credentials without DB
    const DEMO = {
      'doctor@pdcompanion.com':     { id: 'demo-1', name: 'Dr. Priya Sharma',   role: 'doctor',    password: 'Doctor@123' },
      'caretaker1@pdcompanion.com': { id: 'demo-2', name: 'Rahul Thompson',     role: 'caretaker', password: 'Care@123' },
      'patient1@pdcompanion.com':   { id: 'demo-3', name: 'Marcus Thompson',    role: 'patient',   password: 'Patient@123' },
    };
    const demo = DEMO[email];
    if (demo && demo.password === password) {
      const user = { id: demo.id, name: demo.name, email, role: demo.role };
      return res.json({ token: signToken(user), user });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { data: user } = await supabase
    .from('pd_users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const { password_hash, ...safeUser } = user;
  res.json({ token: signToken(safeUser), user: safeUser });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
