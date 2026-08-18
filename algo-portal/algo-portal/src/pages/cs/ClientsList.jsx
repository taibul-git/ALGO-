import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Modal, Field, inputCls, Pagination, StatusBadge } from '../../components/ui';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EMPTY = {
  client_nature: '', telegram_name: '', trading_platform: '', trading_account_number: '',
  account_password: '', server_name: '', server_id: '', account_balance: '', account_type: '',
  use_note_if_prop_firm: '', fixed_lot_size: '', algo_plan: ''
};

export const ACCOUNT_TYPE_OPTIONS = ['PERSONAL ACCOUNT', 'PROP-FIRM'];
export const ALGO_PLAN_OPTIONS = ['ALGO LIFETIME', 'ALGO 1 MONTH', 'BROKER LIFETIME'];
export const CLIENT_NATURE_OPTIONS = ['New Client', 'Account Replace', 'Plan Upgrade', 'Auto-renewal'];

export default function ClientsList() {
  const { user } = useAuth();
  const [data, setData] = useState({ rows: [], total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/clients', { params: { search, page, pageSize: 15 } }).then((res) => setData(res.data));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/clients', form);
      setModalOpen(false);
      setForm(EMPTY);
      setPage(1);
      load();
    } finally {
      setSaving(false);
    }
  };

  const canAdd = user.role === 'admin' || user.role === 'cs';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Clients</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">All customer records — adding a client here automatically creates a linked Setup record.</p>
        </div>
        {canAdd && (
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add client
          </button>
        )}
      </div>

      <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search by Telegram name, account #, server…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border)]">
              <th className="px-4 py-3">Telegram Name</th>
              <th className="px-4 py-3">Account #</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Server</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-panel-hover)]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.telegram_name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.trading_account_number || '—'}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.algo_plan || '—'}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.server_name || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/clients/${c.id}`} className="text-[#3ECF8E] hover:underline font-medium">View</Link>
                </td>
              </tr>
            ))}
            {!data.rows.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--text-faint)]">No clients found.</td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add new client" wide>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4">
          <Field label="Telegram Name *"><input required className={inputCls} value={form.telegram_name} onChange={(e) => setForm({ ...form, telegram_name: e.target.value })} /></Field>
          <Field label="Client Nature">
            <select className={inputCls} value={form.client_nature} onChange={(e) => setForm({ ...form, client_nature: e.target.value })}>
              <option value="">— Select —</option>
              {CLIENT_NATURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Trading Platform"><input className={inputCls} value={form.trading_platform} onChange={(e) => setForm({ ...form, trading_platform: e.target.value })} placeholder="MT4 / MT5" /></Field>
          <Field label="Trading Account Number"><input className={inputCls} value={form.trading_account_number} onChange={(e) => setForm({ ...form, trading_account_number: e.target.value })} /></Field>
          <Field label="Account Password"><input className={inputCls} value={form.account_password} onChange={(e) => setForm({ ...form, account_password: e.target.value })} /></Field>
          <Field label="Server Name"><input className={inputCls} value={form.server_name} onChange={(e) => setForm({ ...form, server_name: e.target.value })} /></Field>
          <Field label="Server ID"><input className={inputCls} value={form.server_id} onChange={(e) => setForm({ ...form, server_id: e.target.value })} /></Field>
          <Field label="Account Balance"><input className={inputCls} value={form.account_balance} onChange={(e) => setForm({ ...form, account_balance: e.target.value })} /></Field>
          <Field label="Account Type">
            <select className={inputCls} value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
              <option value="">— Select —</option>
              {ACCOUNT_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Use Note If Prop Firm"><input className={inputCls} value={form.use_note_if_prop_firm} onChange={(e) => setForm({ ...form, use_note_if_prop_firm: e.target.value })} /></Field>
          <Field label="Fixed Lot Size"><input className={inputCls} value={form.fixed_lot_size} onChange={(e) => setForm({ ...form, fixed_lot_size: e.target.value })} /></Field>
          <Field label="Algo Plan">
            <select className={inputCls} value={form.algo_plan} onChange={(e) => setForm({ ...form, algo_plan: e.target.value })}>
              <option value="">— Select —</option>
              {ALGO_PLAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <div className="col-span-2 mt-2">
            <button disabled={saving} className="w-full bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Create client & sync to Setup Portal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
