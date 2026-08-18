import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inputCls } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] mx-auto flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 30 30">
              <line x1="9" y1="6" x2="9" y2="24" stroke="#3ECF8E" strokeWidth="2" />
              <rect x="6" y="11" width="6" height="9" fill="#3ECF8E" />
              <path d="M17 20 L23 8 M23 8 L18 9 M23 8 L22 13" stroke="#3ECF8E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SureShotFX</h1>
          <p className="text-sm text-[var(--text-faint)] mt-1">Algo ops desk — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-panel)] rounded-xl p-6 shadow-xl border border-[var(--border)]">
          {error && <div className="mb-4 text-sm text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-lg px-3 py-2">{error}</div>}
          <label className="block mb-3">
            <span className="block text-xs font-medium text-[var(--text-muted)] mb-1">Username</span>
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label className="block mb-5">
            <span className="block text-xs font-medium text-[var(--text-muted)] mb-1">Password</span>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-faint)] mt-4">
          Demo accounts — admin / Admin@123 · cs_agent1 / CsAgent@123 · setup_agent1 / SetupAgent@123
        </p>
      </div>
    </div>
  );
}
