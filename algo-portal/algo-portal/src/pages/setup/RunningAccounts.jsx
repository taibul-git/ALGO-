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
        <h1 className="text-2xl font-semibold text-[#E8EDF2]">Running Accounts</h1>
        <p className="text-[#77828E] text-sm mt-1">Currently active client accounts across all subscription types.</p>
      </div>

      <div className="bg-[#12181F] rounded-xl border border-[#1F2933]">
        <div className="p-4 border-b border-[#1F2933]">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6773]" />
            <input className={`${inputCls} pl-9`} placeholder="Search Telegram name, account info…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#77828E] uppercase border-b border-[#1F2933]">
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
              <tr key={r.id} className="border-b border-[#1F2933] hover:bg-[#171E26]">
                <td className="px-4 py-3 font-medium text-[#E8EDF2]">{r.telegram_name}</td>
                <td className="px-4 py-3 text-[#9AA5B1] max-w-xs truncate" title={r.account_information}>{r.account_information || '—'}</td>
                <td className="px-4 py-3 text-[#9AA5B1]">{r.subscription || '—'}</td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={r.vps_no || ''}
                    onBlur={(e) => { if (e.target.value !== (r.vps_no || '')) update(r.id, 'vps_no', e.target.value); }}
                    className="w-24 px-2 py-1 text-sm text-[#E8EDF2] bg-transparent border border-transparent hover:border-[#1F2933] focus:border-[#3ECF8E] rounded"
                  />
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-[#5C6773] max-w-[160px] truncate" title={r.source_tab}>{r.source_tab}</td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-[#5C6773]">No running accounts found.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>
    </div>
  );
}
