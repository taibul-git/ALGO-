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
      className="w-full text-sm text-[#E8EDF2] bg-[#0B0F14] border border-[#2A3540] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/40"
      value={editForm[field]}
      onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF2]">VPS Credentials</h1>
          <p className="text-[#77828E] text-sm mt-1">VPS inventory used to host client Algo instances.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#3ECF8E] hover:bg-[#2FAD79] text-[#04231A] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add VPS
        </button>
      </div>

      <div className="bg-[#12181F] rounded-xl border border-[#1F2933]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#77828E] uppercase border-b border-[#1F2933]">
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
                <tr key={v.id} className="border-b border-[#1F2933] hover:bg-[#171E26]">
                  <td className="px-4 py-3 font-medium text-[#E8EDF2]">{isEditing ? cellInput('vps_name') : (v.vps_name || '—')}</td>
                  <td className="px-4 py-3 text-[#9AA5B1]">{isEditing ? cellInput('username') : (v.username || '—')}</td>
                  <td className="px-4 py-3 text-[#9AA5B1]">{isEditing ? cellInput('address') : (v.address || '—')}</td>
                  <td className="px-4 py-3 text-[#9AA5B1]">
                    {isEditing ? cellInput('password') : (
                      <div className="flex items-center gap-2">
                        <span>{revealed[v.id] ? (v.password || '—') : '••••••••'}</span>
                        <button onClick={() => setRevealed({ ...revealed, [v.id]: !revealed[v.id] })} className="text-[#5C6773] hover:text-[#9AA5B1]">
                          {revealed[v.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#9AA5B1] max-w-xs truncate" title={v.remarks}>{isEditing ? cellInput('remarks') : (v.remarks || '—')}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full text-xs font-medium bg-[#171E26] text-[#9AA5B1]" title="Auto-counted from Setup records — not manually editable">
                      {v.assigned_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => saveEdit(v.id)} className="text-[#3ECF8E] hover:text-[#2FAD79]" title="Save"><Check size={16} /></button>
                        <button onClick={cancelEdit} className="text-[#5C6773] hover:text-[#9AA5B1]" title="Cancel"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(v)} className="text-[#5C6773] hover:text-[#3ECF8E]" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-[#5C6773]">No VPS records yet.</td></tr>}
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
