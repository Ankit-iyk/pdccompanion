import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bell, Brain, LogOut, Activity,
  ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useAlerts } from '../hooks/useAlerts.js';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/patients',  icon: Users,           label: 'Patients'    },
  { to: '/alerts',    icon: Bell,            label: 'Alerts'      },
  { to: '/insights',  icon: Brain,           label: 'AI Insights' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout }          = useAuth();
  const { connected, reconnecting } = useSocket() || {};
  const { unresolved }            = useAlerts();
  const navigate                  = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-navy-900 border-r border-white/5
        transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">PDCompanion</p>
            <p className="text-xs text-slate-500 leading-tight">IoT + AI Monitor</p>
          </div>
        )}
      </div>

      {/* Realtime status dot */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
          {connected
        ? <><span className="live-dot" /><span className="text-xs text-green-400">Live</span></>
        : reconnecting
          ? <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /><span className="text-xs text-amber-400">Reconnecting…</span></>
          : <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-xs text-slate-500">Offline</span></>}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5 shrink-0" />
              {label === 'Alerts' && unresolved.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {unresolved.length > 9 ? '9+' : unresolved.length}
                </span>
              )}
            </div>
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className={`border-t border-white/5 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && user && (
          <div className="px-2 py-2 mb-2">
            <p className="text-xs font-semibold text-slate-300 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-navy-700 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
