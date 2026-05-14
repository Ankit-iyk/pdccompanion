import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

// ── Token helpers ─────────────────────────────────────────────────────────────
function saveToken(token) { localStorage.setItem('pd_token', token); }
function clearToken()     { localStorage.removeItem('pd_token'); }

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('pd_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount (or after login)
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        clearToken();
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  // Payload: { name, email, password, role }
  const register = useCallback(async ({ name, email, password, role }) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
