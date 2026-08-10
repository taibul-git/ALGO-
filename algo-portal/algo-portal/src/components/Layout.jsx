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
const ROLE_BADGE = { admin: 'bg-amber-100 text-amber-800', cs: 'bg-sky-100 text-sky-800', setup: 'bg-emerald-100 text-emerald-800' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];

  return (
    <div className="min-h-screen flex bg-[#F4F6F9]">
      <aside className="w-64 shrink-0 bg-[#101828] text-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#2FB3A6] flex items-center justify-center font-bold text-[#101828]">A</div>
            <div>
              <div className="font-semibold text-white leading-tight">Algo Portal</div>
              <div className="text-[11px] text-slate-400 leading-tight">CS &amp; Setup CRM</div>
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
                  isActive ? 'bg-[#2FB3A6]/15 text-[#5FD8CC]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
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
