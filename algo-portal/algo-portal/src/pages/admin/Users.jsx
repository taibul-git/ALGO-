import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal, Field, inputCls, StatusBadge } from '../../components/ui';
import { Plus } from 'lucide-react';

const EMPTY = { username: '', password: '', full_name: '', role: 'cs' };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/auth/users').then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      setModalOpen(false); setForm(EMPTY); load();
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    await api.patch(`/auth/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team &amp; Roles</h1>
          <p className="text-slate-500 text-sm mt-1">Manage who has access to the CS and Setup portals.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add team member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{u.username}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{u.role}</td>
                <td className="px-4 py-3"><StatusBadge status={u.is_active ? 'active' : 'inactive'} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActive(u)} className="text-[#2FB3A6] hover:underline text-xs font-medium">
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add team member">
        <form onSubmit={handleSubmit}>
          <Field label="Full name"><input required className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Username"><input required className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Password"><input required type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="cs">CS Team</option>
              <option value="setup">Setup Team</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <button disabled={saving} className="w-full mt-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white font-medium py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Saving…' : 'Create user'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
