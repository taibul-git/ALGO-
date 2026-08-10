import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { inputCls, Pagination, StatusBadge } from '../../components/ui';
import { Search } from 'lucide-react';

const PLAN_TYPES = ['lifetime', 'one_month', 'broker_trial', 'broker_lifetime'];
const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked'];

export default function SetupsList() {
  const [data, setData] = useState({ rows: [], total: 0 });
  const [search, setSearch] = useState('');
  const [planType, setPlanType] = useState('');
  const [setupStatus, setSetupStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    api.get('/setups', { params: { search, plan_type: planType, setup_status: setupStatus, page, pageSize: 15 } }).then((res) => setData(res.data));
  }, [search, planType, setupStatus, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Setups</h1>
        <p className="text-slate-500 text-sm mt-1">Auto-synced from the CS Portal — update setup-specific fields here without touching customer identity data.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search Telegram name, account #, VPS…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className={inputCls + ' max-w-[170px]'} value={planType} onChange={(e) => { setPlanType(e.target.value); setPage(1); }}>
            <option value="">All plan types</option>
            {PLAN_TYPES.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
          </select>
          <select className={inputCls + ' max-w-[170px]'} value={setupStatus} onChange={(e) => { setSetupStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
              <th className="px-4 py-3">Telegram Name</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">VPS No.</th>
              <th className="px-4 py-3">Activation</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.telegram_name}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{s.plan_type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{s.vps_no || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.activation_date || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.expire_date || s.vps_expire_date || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.setup_status} /></td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate" title={s.source_tab}>{s.source_tab}</td>
                <td className="px-4 py-3 text-right"><Link to={`/setups/${s.id}`} className="text-[#2FB3A6] hover:underline font-medium">View</Link></td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No setups found.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>
    </div>
  );
}
