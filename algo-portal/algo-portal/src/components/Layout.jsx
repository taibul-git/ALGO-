import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, MessageSquareWarning, Wrench, Server,
  Activity, ShieldCheck, LogOut, Radio
} from 'lucide-react';

const NAV = {
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients (CS)', icon: Users },
    { to: '/issues', label: 'Issues (CS)', icon: MessageSquareWarning },
    { to: '/setups', label: 'Setups', icon: Wrench },
    { to: '/running', label: 'Running Accounts', icon: Radio },
    { to: '/vps', label: 'VPS Credentials', icon: Server },
    { to: '/users', label: 'Team & Roles', icon: ShieldCheck },
  ],
  cs: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/issues', label: 'Issues', icon: MessageSquareWarning },
  ],
  setup: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/setups', label: 'Setups', icon: Wrench },
    { to: '/running', label: 'Running Accounts', icon: Radio },
    { to: '/vps', label: 'VPS Credentials', icon: Server },
  ],
};

const ROLE_LABEL = { admin: 'Administrator', cs: 'CS Team', setup: 'Setup Team' };
const ROLE_BADGE = { admin: 'bg-[#E8A33D]/15 text-[#E8A33D]', cs: 'bg-[#4FA8E8]/15 text-[#4FA8E8]', setup: 'bg-[#3ECF8E]/15 text-[#3ECF8E]' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];

  return (
    <div className="min-h-screen flex bg-[#0B0F14]">
      <aside className="w-64 shrink-0 bg-[#0B0F14] text-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg width="30" height="30" viewBox="0 0 30 30" className="shrink-0">
              <line x1="9" y1="6" x2="9" y2="24" stroke="#3ECF8E" strokeWidth="2" />
              <rect x="6" y="11" width="6" height="9" fill="#3ECF8E" />
              <path d="M17 20 L23 8 M23 8 L18 9 M23 8 L22 13" stroke="#3ECF8E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="font-semibold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SureShotFX</div>
              <div className="text-[11px] text-[#5C6773] leading-tight">Algo ops desk</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-[#3ECF8E]/15 text-[#7EE8B0]' : 'text-[#5C6773] hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
              {user.full_name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{user.full_name}</div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${ROLE_BADGE[user.role]}`}>{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#5C6773] hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
