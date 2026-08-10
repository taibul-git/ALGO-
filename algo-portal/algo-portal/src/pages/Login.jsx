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
    <div className="min-h-screen flex items-center justify-center bg-[#101828] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2FB3A6] mx-auto flex items-center justify-center font-bold text-xl text-[#101828]">A</div>
          <h1 className="mt-4 text-xl font-semibold text-white">Algo Portal</h1>
          <p className="text-sm text-slate-400 mt-1">CS &amp; Setup CRM — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-xl">
          {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
          <label className="block mb-3">
            <span className="block text-xs font-medium text-slate-600 mb-1">Username</span>
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label className="block mb-5">
            <span className="block text-xs font-medium text-slate-600 mb-1">Password</span>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2FB3A6] hover:bg-[#279e93] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          Demo accounts — admin / Admin@123 · cs_agent1 / CsAgent@123 · setup_agent1 / SetupAgent@123
        </p>
      </div>
    </div>
  );
}
