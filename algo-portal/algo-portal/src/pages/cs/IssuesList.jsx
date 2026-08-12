import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { Modal, Field, inputCls, Pagination, StatusBadge } from '../../components/ui';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
  const [editingIssue, setEditingIssue] = useState(null); // null = adding new, object = editing existing
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);

  // Notes (shown only while editing an existing issue)
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(() => {
    api.get('/issues', { params: { search, status, page, pageSize: 15 } }).then((res) => setData(res.data));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/auth/agents').then((res) => setAgents(res.data)); }, []);

  const assignIssue = async (issue, agentId) => {
    await api.patch(`/issues/${issue.id}`, { assigned_to: agentId || null });
    load();
  };

  const openAddModal = () => {
    setEditingIssue(null);
    setForm(EMPTY);
    setNotes([]);
    setNoteText('');
    setModalOpen(true);
  };

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setForm({
      category: issue.category || 'Other',
      telegram_name: issue.telegram_name || '',
      account_number: issue.account_number || '',
      details: issue.details || '',
      status: issue.status || 'Pending',
      remarks: issue.remarks || '',
    });
    setNoteText('');
    setModalOpen(true);
    api.get('/notes', { params: { entity_type: 'issue', entity_id: issue.id } }).then((res) => setNotes(res.data));
  };

  const closeModal = () => { setModalOpen(false); setEditingIssue(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingIssue) {
        await api.patch(`/issues/${editingIssue.id}`, form);
      } else {
        await api.post('/issues', form);
      }
      closeModal(); setForm(EMPTY); setPage(1); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (issue) => {
    if (!window.confirm(`Delete this issue for "${issue.telegram_name || 'this client'}"? This cannot be undone.`)) return;
    await api.delete(`/issues/${issue.id}`);
    load();
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !editingIssue) return;
    setAddingNote(true);
    try {
      const res = await api.post('/notes', { entity_type: 'issue', entity_id: editingIssue.id, note_text: noteText });
      setNotes([res.data, ...notes]);
      setNoteText('');
    } finally { setAddingNote(false); }
  };

  const toggleStatus = async (issue) => {
    await api.patch(`/issues/${issue.id}`, { status: issue.status === 'Pending' ? 'Solved' : 'Pending' });
    load();
  };

  const canAdd = user.role === 'admin' || user.role === 'cs';
  const canDelete = user.role === 'admin' || user.role === 'cs';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Issues</h1>
          <p className="text-slate-500 text-sm mt-1">Client requests and issue tracking.</p>
        </div>
        {canAdd && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
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
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                <td className="px-4 py-3">
                  <select
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2FB3A6]/40"
                    value={i.assigned_to || ''}
                    onChange={(e) => assignIssue(i, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => toggleStatus(i)} className="text-[#2FB3A6] hover:underline text-xs font-medium whitespace-nowrap">
                      Mark {i.status === 'Pending' ? 'Solved' : 'Pending'}
                    </button>
                    {canAdd && (
                      <button onClick={() => openEditModal(i)} className="text-slate-400 hover:text-[#2FB3A6]" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(i)} className="text-slate-400 hover:text-red-500" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No issues found.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={15} total={data.total} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingIssue ? 'Edit issue' : 'Log new issue'}>
        <form onSubmit={handleSubmit}>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Telegram Name"><input className={inputCls} value={form.telegram_name} onChange={(e) => setForm({ ...form, telegram_name: e.target.value })} /></Field>
          <Field label="Current Trading Account Number"><input className={inputCls} value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
          <Field label="Details"><textarea rows={4} className={inputCls} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></Field>

          {editingIssue && (
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Solved">Solved</option>
              </select>
            </Field>
          )}

          <Field label="Remarks (if any)"><input className={inputCls} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>

          <button disabled={saving} className="w-full mt-2 bg-[#2FB3A6] hover:bg-[#279e93] text-white font-medium py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Saving…' : editingIssue ? 'Save changes' : 'Log issue'}
          </button>
        </form>

        {editingIssue && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-medium text-slate-600 mb-2">NOTE</h4>
            <form onSubmit={submitNote} className="mb-3">
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Write a note about this issue…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button disabled={addingNote || !noteText.trim()} className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                {addingNote ? 'Adding…' : 'Add note'}
              </button>
            </form>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="text-sm border-b border-slate-50 pb-2">
                  <p className="text-slate-700 whitespace-pre-line">{n.note_text}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.author_name || 'Unknown'} · {n.created_at}</p>
                </div>
              ))}
              {!notes.length && <p className="text-sm text-slate-400">No notes yet.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
