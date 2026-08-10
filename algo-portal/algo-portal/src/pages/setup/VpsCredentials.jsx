import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal, Field, inputCls } from '../../components/ui';
import { Plus, Eye, EyeOff } from 'lucide-react';

const EMPTY = { vps_name: '', username: '', address: '', password: '', remarks: '' };

export default function VpsCredentials() {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});

  const load = () => api.get('/vps').then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vps', form);
      setModalOpen(false); setForm(EMPTY); load();
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">VPS Credentials</h1>
          <p className="text-slate-500 text-sm mt-1">VPS inventory used to host client Algo instances.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add VPS
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
              <th className="px-4 py-3">VPS Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{v.vps_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{v.username || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{v.address || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>{revealed[v.id] ? (v.password || '—') : '••••••••'}</span>
                    <button onClick={() => setRevealed({ ...revealed, [v.id]: !revealed[v.id] })} className="text-slate-400 hover:text-slate-600">
                      {revealed[v.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={v.remarks}>{v.remarks || '—'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No VPS records yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add VPS credential">
        <form onSubmit={handleSubmit}>
          <Field label="VPS Name"><input className={inputCls} value={form.vps_name} onChange={(e) => setForm({ ...form, vps_name: e.target.value })} /></Field>
          <Field label="Username"><input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Password"><input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Remarks"><input className={inputCls} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <button disabled={saving} className="w-full mt-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white font-medium py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Saving…' : 'Add VPS'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
