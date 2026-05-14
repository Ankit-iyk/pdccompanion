import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Mail, Lock, AlertCircle, User, Shield, Stethoscope, HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

// ── Constants ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { label: 'Doctor',    email: 'doctor@pdcompanion.com',     pass: 'Doctor@123',    role: 'doctor'    },
  { label: 'Caretaker', email: 'caretaker1@pdcompanion.com', pass: 'Care@123',      role: 'caretaker' },
  { label: 'Patient',   email: 'patient1@pdcompanion.com',   pass: 'Patient@123',   role: 'patient'   },
];

const ROLES = [
  { value: 'doctor',    label: 'Doctor',    icon: Stethoscope,   desc: 'Full system access'       },
  { value: 'caretaker', label: 'Caretaker', icon: HeartHandshake,desc: 'Patient monitoring'        },
  { value: 'patient',   label: 'Patient',   icon: User,          desc: 'Personal health view'      },
];

// ── Input field ───────────────────────────────────────────────────────────────
function InputField({ icon: Icon, label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-xs text-slate-400 font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                     placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-blue-500/5
                     transition-all duration-200 hover:border-white/20"
        />
      </div>
    </div>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-semibold text-white text-sm
                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing…
        </span>
      ) : label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode]         = useState('login');   // 'login' | 'signup'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('doctor');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, register } = useAuth();
  const navigate            = useNavigate();

  // Switch mode and clear error
  const switchMode = (m) => { setMode(m); setError(''); };

  // Fill demo credentials
  const fillDemo = (d) => {
    setEmail(d.email);
    setPassword(d.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        await register({ name, email, password, role });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || (mode === 'login' ? 'Invalid credentials.' : 'Registration failed. Email may already be in use.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Left — Branding panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden border-r border-white/5">
        {/* Ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.35)' }}>
            <Activity className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">PDCompanion</h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Smart IoT + AI monitoring platform for Parkinson's disease — connecting patients, caretakers, and clinicians.
          </p>

          {/* Feature chips */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: '📡', label: 'Real-time Telemetry' },
              { icon: '🧠', label: 'AI Predictions' },
              { icon: '🚨', label: 'SOS Alerts' },
            ].map(({ icon, label }) => (
              <div key={label} className="glass-card p-3 border border-white/5 text-center">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Role preview */}
          <div className="space-y-2 text-left">
            {ROLES.map(({ value, label, icon: Icon, desc }) => (
              <div key={value} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-300">{label}</p>
                  <p className="text-xs text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right — Auth form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">PDCompanion</h2>
          </div>

          {/* Glass card */}
          <div className="glass-card border border-white/10 overflow-hidden" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

            {/* Tab toggle */}
            <div className="flex border-b border-white/5">
              {(['login', 'signup']).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 relative ${
                    mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                  {/* Active underline */}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-all duration-300 ${
                    mode === m ? 'opacity-100' : 'opacity-0'
                  }`} />
                </button>
              ))}
            </div>

            {/* Form body */}
            <div className="p-6 lg:p-8">
              {/* Greeting */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'login' ? 'Welcome back' : 'Join PDCompanion'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {mode === 'login'
                    ? 'Sign in to access your monitoring dashboard'
                    : 'Create your account to get started'}
                </p>
              </div>

              {/* Demo credentials (login only) */}
              {mode === 'login' && (
                <div className="mb-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Quick demo access:</p>
                  <div className="flex gap-2 flex-wrap">
                    {DEMO_USERS.map((d) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => fillDemo(d)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-blue-400 transition-all duration-150 font-medium"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auth form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name — signup only */}
                {mode === 'signup' && (
                  <InputField
                    icon={User} label="Full Name" type="text"
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Priya Sharma" required
                  />
                )}

                <InputField
                  icon={Mail} label="Email Address" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pdcompanion.com" required
                />

                <InputField
                  icon={Lock} label="Password" type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />

                {/* Role selector — signup only */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-2 block">Select Your Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 ${
                            role === value
                              ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-sm'
                              : 'bg-white/3 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {ROLES.find((r) => r.value === role)?.desc}
                    </p>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <SubmitButton
                  loading={loading}
                  label={mode === 'login' ? 'Sign In' : 'Create Account'}
                />
              </form>

              {/* Toggle hint */}
              <p className="text-center text-xs text-slate-600 mt-5">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              {/* HIPAA badge */}
              <div className="flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-white/5">
                <Shield className="w-3.5 h-3.5 text-slate-600" />
                <p className="text-xs text-slate-600">HIPAA-compliant · End-to-end encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
