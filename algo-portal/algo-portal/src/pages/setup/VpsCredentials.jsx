import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal, Field, inputCls } from '../../components/ui';
import { Plus, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';

const EMPTY = { vps_name: '', username: '', address: '', password: '', remarks: '' };

export default function VpsCredentials() {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

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

  const startEdit = (v) => {
    setEditingId(v.id);
    setEditForm({ vps_name: v.vps_name || '', username: v.username || '', address: v.address || '', password: v.password || '', remarks: v.remarks || '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY); };

  const saveEdit = async (id) => {
    await api.patch(`/vps/${id}`, editForm);
    setEditingId(null);
    load();
  };

  const cellInput = (field, type = 'text') => (
    <input
      type={type}
      className="w-full text-sm text-[var(--text-primary)] bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/40"
      value={editForm[field]}
      onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">VPS Credentials</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">VPS inventory used to host client Algo instances.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add VPS
        </button>
      </div>

      <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border)]">
              <th className="px-4 py-3">VPS Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3">Assigned Setups</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const isEditing = editingId === v.id;
              return (
                <tr key={v.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-panel-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{isEditing ? cellInput('vps_name') : (v.vps_name || '—')}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{isEditing ? cellInput('username') : (v.username || '—')}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{isEditing ? cellInput('address') : (v.address || '—')}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {isEditing ? cellInput('password') : (
                      <div className="flex items-center gap-2">
                        <span>{revealed[v.id] ? (v.password || '—') : '••••••••'}</span>
                        <button onClick={() => setRevealed({ ...revealed, [v.id]: !revealed[v.id] })} className="text-[var(--text-faint)] hover:text-[var(--text-muted)]">
                          {revealed[v.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] max-w-xs truncate" title={v.remarks}>{isEditing ? cellInput('remarks') : (v.remarks || '—')}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-panel-hover)] text-[var(--text-muted)]" title="Auto-counted from Setup records — not manually editable">
                      {v.assigned_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => saveEdit(v.id)} className="text-[#3ECF8E] hover:text-[#2FAD79]" title="Save"><Check size={16} /></button>
                        <button onClick={cancelEdit} className="text-[var(--text-faint)] hover:text-[var(--text-muted)]" title="Cancel"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(v)} className="text-[var(--text-faint)] hover:text-[#3ECF8E]" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--text-faint)]">No VPS records yet.</td></tr>}
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
          <button disabled={saving} className="w-full mt-2 bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] font-medium py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Saving…' : 'Add VPS'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
