import { useEffect, useState } from 'react';
import api from '../api/client';
import { Card, StatusBadge } from '../components/ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3ECF8E', '#3E7CB1', '#C9962C', '#E0708A', '#8B7FD1', '#6BBF6B', '#E0A458', '#8C8C8C'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="text-[var(--text-faint)] text-sm">Loading dashboard…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Welcome back, {user.full_name.split(' ')[0]}</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Here's what's happening across the CS and Setup portals.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Total Clients" value={stats.totalClients} sub={`${stats.activeClients} active`} />
        <Card title="Open Issues" value={stats.pendingIssues} sub={`${stats.solvedIssues} solved`} accent="text-[#E8A33D]" />
        <Card title="Setup Records" value={stats.totalSetups} sub="across all plan types" />
        <Card title="Running Accounts" value={stats.totalRunning} sub={`${stats.totalVps} VPS instances`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-medium text-[var(--text-primary)] mb-4">Issues by category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.issuesByCategory} dataKey="count" nameKey="category" outerRadius={90} label={(d) => d.category} labelLine={{ stroke: 'var(--text-faint)' }}>
                {stats.issuesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-medium text-[var(--text-primary)] mb-4">Setups by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.setupsByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="setup_status" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="count" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-medium text-[var(--text-primary)] mb-3">Setups by plan</h3>
          <div className="space-y-2">
            {stats.setupsByPlan.map((p) => (
              <div key={p.plan_type} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] capitalize">{p.plan_type.replace('_', ' ')}</span>
                <span className="font-medium text-[var(--text-primary)]">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-medium text-[var(--text-primary)] mb-3">Recent activity</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {stats.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <StatusBadge status={a.action} />
                <div className="flex-1">
                  <span className="text-[var(--text-secondary)]">{a.user_name || 'System'}</span>{' '}
                  <span className="text-[var(--text-muted)]">{a.action.replace('_', ' ')} {a.entity_type} #{a.entity_id}</span>
                  {a.field_changed && <span className="text-[var(--text-faint)]"> · {a.field_changed}</span>}
                </div>
                <span className="text-xs text-[var(--text-faint)] whitespace-nowrap">{a.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
