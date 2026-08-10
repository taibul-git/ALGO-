import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { Modal, Field, inputCls, Pagination, StatusBadge } from '../../components/ui';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Lot Change', 'Algo Stop', 'Algo Setup', 'Account Replace', 'Auto-renewal', 'Reactivate', 'Old client ALGO setup', 'Other'];
const EMPTY = { category: 'Other', telegram_name: '', account_number: '', details: '', status: 'Pending', remarks: '' };

export default function IssuesList() {
  const { user } = useAuth();
  const [data, setData] = useState({ rows: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/issues', { params: { search, status, page, pageSize: 15 } }).then((res) => setData(res.data));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/issues', form);
      setModalOpen(false); setForm(EMPTY); setPage(1); load();
    } finally { setSaving(false); }
  };

  const toggleStatus = async (issue) => {
    await api.patch(`/issues/${issue.id}`, { status: issue.status === 'Pending' ? 'Solved' : 'Pending' });
    load();
  };

  const canAdd = user.role === 'admin' || user.role === 'cs';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Issues</h1>
          <p className="text-slate-500 text-sm mt-1">Client requests and issue tracking.</p>
        </div>
        {canAdd && (
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Log issue
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search details, Telegram name, account #…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className={inputCls + ' max-w-[160px]'} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Solved">Solved</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Telegram Name</th>
              <th className="px-4 py-3">Account #</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50 align-top">
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{i.category || '—'}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{i.telegram_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{i.account_number || '—'}</td>
                <td className="px-4 py-3 text-slate-600 max-w-md truncate">{i.details}</td>
                <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleStatus(i)} className="text-[#2FB3A6] hover:underline text-xs font-medium whitespace-nowrap">
                    Mark {i.status === 'Pending' ? 'Solved' : 'Pending'}
                  </button>
                </td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No issues found.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log new issue">
        <form onSubmit={handleSubmit}>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Telegram Name"><input className={inputCls} value={form.telegram_name} onChange={(e) => setForm({ ...form, telegram_name: e.target.value })} /></Field>
          <Field label="Current Trading Account Number"><input className={inputCls} value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
          <Field label="Details"><textarea rows={4} className={inputCls} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></Field>
          <Field label="Remarks (if any)"><input className={inputCls} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <button disabled={saving} className="w-full mt-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white font-medium py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Saving…' : 'Log issue'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
