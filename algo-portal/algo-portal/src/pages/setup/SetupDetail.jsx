import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge, Field, inputCls } from '../../components/ui';
import { ArrowLeft } from 'lucide-react';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked'];

export default function SetupDetail() {
  const { id } = useParams();
  const [setup, setSetup] = useState(null);
  const [form, setForm] = useState({});
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [vpsList, setVpsList] = useState([]);

  const load = useCallback(() => {
    api.get(`/setups/${id}`).then((res) => { setSetup(res.data); setForm(res.data); });
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/vps').then((res) => setVpsList(res.data)); }, []);

  const save = async () => {
    setSaving(true);
    const fields = ['setup_field', 'setup_status', 'vps_id', 'ext_id', 'parameters', 'activation_date', 'expire_date', 'vps_expire_date', 'note'];
    const changed = {};
    for (const f of fields) if (form[f] !== setup[f]) changed[f] = form[f];
    try {
      if (Object.keys(changed).length) await api.patch(`/setups/${id}`, changed);
      load();
    } finally { setSaving(false); }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.post('/notes', { entity_type: 'setup', entity_id: Number(id), note_text: noteText });
    setNoteText(''); load();
  };

  const toggleIssueStatus = async (issue) => {
    await api.patch(`/issues/${issue.id}`, { status: issue.status === 'Pending' ? 'Solved' : 'Pending' });
    load();
  };

  if (!setup) return <div className="text-[#5C6773] text-sm">Loading…</div>;

  return (
    <div>
      <Link to="/setups" className="inline-flex items-center gap-1 text-sm text-[#77828E] hover:text-[#C3CBD3] mb-4">
        <ArrowLeft size={15} /> Back to setups
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF2]">{setup.telegram_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={setup.setup_status} />
            <span className="text-sm text-[#5C6773] capitalize">{setup.plan_type.replace('_', ' ')} plan</span>
          </div>
        </div>
        {setup.client_id && <Link to={`/clients/${setup.client_id}`} className="text-sm text-[#3ECF8E] hover:underline">View linked client →</Link>}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <h3 className="font-medium text-[#E8EDF2] mb-1">Account information (read-only — owned by CS Portal)</h3>
            <p className="text-xs text-[#5C6773] mb-4">These fields are synced from the client record and can't be edited from Setup.</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-[#5C6773]">Account #:</span> <span className="text-[#C3CBD3]">{setup.trading_account_number || '—'}</span></div>
              <div><span className="text-[#5C6773]">Platform:</span> <span className="text-[#C3CBD3]">{setup.trading_platform || '—'}</span></div>
              <div><span className="text-[#5C6773]">Server:</span> <span className="text-[#C3CBD3]">{setup.server_name || '—'}</span></div>
              <div><span className="text-[#5C6773]">Algo Plan:</span> <span className="text-[#C3CBD3]">{setup.algo_plan || '—'}</span></div>
              <div><span className="text-[#5C6773]">Fixed Lot:</span> <span className="text-[#C3CBD3]">{setup.fixed_lot_size || '—'}</span></div>
              <div><span className="text-[#5C6773]">Account Balance:</span> <span className="text-[#C3CBD3]">{setup.account_balance || '—'}</span></div>
            </div>
          </div>

          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#E8EDF2]">Setup fields</h3>
              <button onClick={save} disabled={saving} className="px-4 py-1.5 text-sm rounded-lg bg-[#3ECF8E] text-[#04231A] font-medium disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Setup Status">
                <select className={inputCls} value={form.setup_status || ''} onChange={(e) => setForm({ ...form, setup_status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="VPS No.">
                <select className={inputCls} value={form.vps_id || ''} onChange={(e) => setForm({ ...form, vps_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">— Not assigned —</option>
                  {vpsList.map((v) => <option key={v.id} value={v.id}>{v.vps_name} {v.address ? `(${v.address})` : ''}</option>)}
                </select>
              </Field>
              <Field label="ID"><input className={inputCls} value={form.ext_id || ''} onChange={(e) => setForm({ ...form, ext_id: e.target.value })} /></Field>
              <Field label="Parameters"><input className={inputCls} value={form.parameters || ''} onChange={(e) => setForm({ ...form, parameters: e.target.value })} /></Field>
              <Field label="Activation Date"><input className={inputCls} value={form.activation_date || ''} onChange={(e) => setForm({ ...form, activation_date: e.target.value })} /></Field>
              <Field label="Expire Date"><input className={inputCls} value={form.expire_date || ''} onChange={(e) => setForm({ ...form, expire_date: e.target.value })} /></Field>
              <Field label="VPS Expire Date"><input className={inputCls} value={form.vps_expire_date || ''} onChange={(e) => setForm({ ...form, vps_expire_date: e.target.value })} /></Field>
              <Field label="Setup (raw)"><input className={inputCls} value={form.setup_field || ''} onChange={(e) => setForm({ ...form, setup_field: e.target.value })} /></Field>
              <div className="col-span-2">
                <Field label="Note"><textarea rows={3} className={inputCls} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
              </div>
            </div>
            <p className="text-xs text-[#5C6773] mt-1">Source: {setup.source_tab}</p>
          </div>

          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <h3 className="font-medium text-[#E8EDF2] mb-1">Client issues</h3>
            <p className="text-xs text-[#5C6773] mb-4">Marking Resolved/Pending here updates instantly in the CS Portal too — same record, both places.</p>
            <div className="space-y-3">
              {(setup.issues || []).map((i) => (
                <div key={i.id} className="border border-[#1F2933] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#C3CBD3]">{i.category || 'Uncategorized'}</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={i.status} />
                      <button onClick={() => toggleIssueStatus(i)} className="text-[#3ECF8E] hover:underline text-xs font-medium whitespace-nowrap">
                        Mark {i.status === 'Pending' ? 'Resolved' : 'Pending'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#9AA5B1] mt-1 whitespace-pre-line">{i.details}</p>
                </div>
              ))}
              {!(setup.issues || []).length && <p className="text-sm text-[#5C6773]">No issues logged for this client.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <h3 className="font-medium text-[#E8EDF2] mb-3">Notes</h3>
            <form onSubmit={addNote} className="mb-3">
              <textarea className={inputCls} rows={3} placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button className="mt-2 w-full bg-[#1F2933] hover:bg-[#2A3540] text-[#E8EDF2] text-sm font-medium py-2 rounded-lg">Add note</button>
            </form>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {setup.notes.map((n) => (
                <div key={n.id} className="text-sm border-b border-[#1F2933] pb-2">
                  <p className="text-[#C3CBD3]">{n.note_text}</p>
                  <p className="text-xs text-[#5C6773] mt-1">{n.author_name || 'Unknown'} · {n.created_at}</p>
                </div>
              ))}
              {!setup.notes.length && <p className="text-sm text-[#5C6773]">No notes yet.</p>}
            </div>
          </div>

          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <h3 className="font-medium text-[#E8EDF2] mb-3">Activity</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {setup.activity.map((a) => (
                <div key={a.id} className="text-xs text-[#9AA5B1]">
                  <span className="text-[#E8EDF2]">{a.user_name || 'System'}</span> {a.action.replace('_', ' ')} {a.field_changed && `· ${a.field_changed}`}
                  <div className="text-[#5C6773]">{a.created_at}</div>
                </div>
              ))}
              {!setup.activity.length && <p className="text-sm text-[#5C6773]">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
