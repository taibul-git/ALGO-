import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { inputCls, Pagination, StatusBadge } from '../../components/ui';
import { Search } from 'lucide-react';

export default function RunningAccounts() {
  const [data, setData] = useState({ rows: [], total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    api.get('/running-accounts', { params: { search, page, pageSize: 15 } }).then((res) => setData(res.data));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const update = async (id, field, value) => {
    await api.patch(`/running-accounts/${id}`, { [field]: value });
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Running Accounts</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Currently active client accounts across all subscription types.</p>
      </div>

      <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input className={`${inputCls} pl-9`} placeholder="Search Telegram name, account info…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border)]">
              <th className="px-4 py-3">Telegram Name</th>
              <th className="px-4 py-3">Account Info</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">VPS No.</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-panel-hover)]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{r.telegram_name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] max-w-xs truncate" title={r.account_information}>{r.account_information || '—'}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{r.subscription || '—'}</td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={r.vps_no || ''}
                    onBlur={(e) => { if (e.target.value !== (r.vps_no || '')) update(r.id, 'vps_no', e.target.value); }}
                    className="w-24 px-2 py-1 text-sm text-[var(--text-primary)] bg-transparent border border-transparent hover:border-[var(--border)] focus:border-[#3ECF8E] rounded"
                  />
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-[var(--text-faint)] max-w-[160px] truncate" title={r.source_tab}>{r.source_tab}</td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--text-faint)]">No running accounts found.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>
    </div>
  );
}
