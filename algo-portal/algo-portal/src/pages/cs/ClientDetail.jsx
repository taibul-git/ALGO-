import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge, Field, inputCls } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { ACCOUNT_TYPE_OPTIONS, ALGO_PLAN_OPTIONS, CLIENT_NATURE_OPTIONS } from './ClientsList';

const DROPDOWN_FIELDS = { account_type: ACCOUNT_TYPE_OPTIONS, algo_plan: ALGO_PLAN_OPTIONS, client_nature: CLIENT_NATURE_OPTIONS };

const EDITABLE_FIELDS = [
  ['telegram_name', 'Telegram Name'], ['client_nature', 'Client Nature'], ['trading_platform', 'Trading Platform'],
  ['trading_account_number', 'Trading Account Number'], ['account_password', 'Account Password'],
  ['server_name', 'Server Name'], ['server_id', 'Server ID'], ['account_balance', 'Account Balance'],
  ['account_type', 'Account Type'], ['fixed_lot_size', 'Fixed Lot Size'], ['algo_plan', 'Algo Plan'],
];

export default function ClientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [noteText, setNoteText] = useState('');
  const [tab, setTab] = useState('issues');

  const load = useCallback(() => {
    api.get(`/clients/${id}`).then((res) => { setClient(res.data); setForm(res.data); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const canEdit = user.role === 'admin' || user.role === 'cs';

  const save = async () => {
    const changed = {};
    for (const [f] of EDITABLE_FIELDS) if (form[f] !== client[f]) changed[f] = form[f];
    if (Object.keys(changed).length) await api.patch(`/clients/${id}`, changed);
    setEditing(false);
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.post('/notes', { entity_type: 'client', entity_id: Number(id), note_text: noteText });
    setNoteText('');
    load();
  };

  if (!client) return <div className="text-[#5C6773] text-sm">Loading…</div>;

  return (
    <div>
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-[#77828E] hover:text-[#C3CBD3] mb-4">
        <ArrowLeft size={15} /> Back to clients
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF2]">{client.telegram_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={client.status} />
            <span className="text-sm text-[#5C6773]">Account #{client.trading_account_number || '—'}</span>
          </div>
        </div>
        {canEdit && (
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(client); }} className="px-4 py-2 text-sm rounded-lg border border-[#1F2933] text-[#9AA5B1]">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm rounded-lg bg-[#3ECF8E] text-[#04231A] font-medium">Save changes</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm rounded-lg border border-[#1F2933] text-[#9AA5B1] hover:bg-[#171E26]">Edit details</button>
          )
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
            <h3 className="font-medium text-[#E8EDF2] mb-4">Customer information</h3>
            <div className="grid grid-cols-2 gap-x-4">
              {EDITABLE_FIELDS.map(([f, label]) => (
                editing ? (
                  <Field key={f} label={label}>
                    {DROPDOWN_FIELDS[f] ? (
                      <select className={inputCls} value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })}>
                        <option value="">— Select —</option>
                        {DROPDOWN_FIELDS[f].map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className={inputCls} value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                    )}
                  </Field>
                ) : (
                  <div key={f} className="mb-3">
                    <div className="text-xs text-[#5C6773]">{label}</div>
                    <div className="text-sm text-[#E8EDF2]">{client[f] || '—'}</div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="bg-[#12181F] rounded-xl border border-[#1F2933]">
            <div className="flex border-b border-[#1F2933]">
              {['issues', 'setups', 'activity'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-[#3ECF8E] text-[#3ECF8E]' : 'border-transparent text-[#77828E]'}`}>
                  {t} {t === 'issues' && `(${client.issues.length})`} {t === 'setups' && `(${client.setups.length})`}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === 'issues' && (
                <div className="space-y-3">
                  {client.issues.map((i) => (
                    <div key={i.id} className="border border-[#1F2933] rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#C3CBD3]">{i.category || 'Uncategorized'}</span>
                        <StatusBadge status={i.status} />
                      </div>
                      <p className="text-sm text-[#9AA5B1] mt-1 whitespace-pre-line">{i.details}</p>
                      {i.remarks && <p className="text-xs text-[#5C6773] mt-1">Remarks: {i.remarks}</p>}
                    </div>
                  ))}
                  {!client.issues.length && <p className="text-sm text-[#5C6773]">No issues logged.</p>}
                </div>
              )}
              {tab === 'setups' && (
                <div className="space-y-3">
                  {client.setups.map((s) => (
                    <Link key={s.id} to={`/setups/${s.id}`} className="block border border-[#1F2933] rounded-lg p-3 hover:border-[#3ECF8E]/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#C3CBD3] capitalize">{s.plan_type.replace('_', ' ')}</span>
                        <StatusBadge status={s.setup_status} />
                      </div>
                      <p className="text-xs text-[#5C6773] mt-1">Source: {s.source_tab}</p>
                    </Link>
                  ))}
                  {!client.setups.length && <p className="text-sm text-[#5C6773]">No setup record linked yet.</p>}
                </div>
              )}
              {tab === 'activity' && (
                <div className="space-y-2">
                  {client.activity.map((a) => (
                    <div key={a.id} className="text-sm text-[#9AA5B1] flex justify-between">
                      <span>{a.user_name || 'System'} {a.action.replace('_', ' ')} {a.field_changed ? `· ${a.field_changed}` : ''}</span>
                      <span className="text-xs text-[#5C6773]">{a.created_at}</span>
                    </div>
                  ))}
                  {!client.activity.length && <p className="text-sm text-[#5C6773]">No activity yet.</p>}
                </div>
              )}
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
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {client.notes.map((n) => (
                <div key={n.id} className="text-sm border-b border-[#1F2933] pb-2">
                  <p className="text-[#C3CBD3]">{n.note_text}</p>
                  <p className="text-xs text-[#5C6773] mt-1">{n.author_name || 'Unknown'} · {n.created_at}</p>
                </div>
              ))}
              {!client.notes.length && <p className="text-sm text-[#5C6773]">No notes yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
