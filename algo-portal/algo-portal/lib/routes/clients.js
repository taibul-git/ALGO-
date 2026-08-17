import express from 'express';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const PLAN_MAP = {
  'broker trial': 'broker_trial',
  'trial': 'broker_trial',
  'broker lifetime': 'broker_lifetime',
  'lifetime': 'lifetime',
  'life time': 'lifetime',
  'one month': 'one_month',
  '1 month': 'one_month',
  'monthly': 'one_month',
};

function inferPlanType(algoPlan, clientNature) {
  const s = `${algoPlan || ''} ${clientNature || ''}`.toLowerCase();
  for (const key of Object.keys(PLAN_MAP)) {
    if (s.includes(key)) return PLAN_MAP[key];
  }
  return 'one_month';
}

router.get('/', requireAuth, async (req, res) => {
  const { search = '', status, assigned_to, page = 1, pageSize = 25 } = req.query;
  const where = [];
  const params = [];

  if (search) {
    where.push('(telegram_name ILIKE ? OR trading_account_number ILIKE ? OR server_name ILIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) { where.push('status = ?'); params.push(status); }
  if (assigned_to) { where.push('assigned_cs_agent_id = ?'); params.push(assigned_to); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await dbGet(`SELECT COUNT(*)::int as c FROM clients ${whereSql}`, params)).c;

  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = await dbAll(`
    SELECT c.*, u.full_name as assigned_agent_name
    FROM clients c
    LEFT JOIN users u ON u.id = c.assigned_cs_agent_id
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(pageSize), offset]);

  res.json({ total, page: Number(page), pageSize: Number(pageSize), rows });
});

router.get('/:id', requireAuth, async (req, res) => {
  const client = await dbGet(`
    SELECT c.*, u.full_name as assigned_agent_name FROM clients c
    LEFT JOIN users u ON u.id = c.assigned_cs_agent_id
    WHERE c.id = ?`, [req.params.id]);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const issues = await dbAll('SELECT * FROM issues WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]);
  const setups = await dbAll('SELECT * FROM setups WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]);
  const notes = await dbAll(`
    SELECT n.*, u.full_name as author_name FROM notes n
    LEFT JOIN users u ON u.id = n.created_by
    WHERE entity_type='client' AND entity_id=? ORDER BY n.created_at DESC`, [req.params.id]);
  const activity = await dbAll(`
    SELECT a.*, u.full_name as user_name FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE entity_type='client' AND entity_id=? ORDER BY a.created_at DESC LIMIT 100`, [req.params.id]);

  res.json({ ...client, issues, setups, notes, activity });
});

router.post('/', requireAuth, requireRole('admin', 'cs'), async (req, res) => {
  const b = req.body;
  if (!b.telegram_name) return res.status(400).json({ error: 'telegram_name is required' });

  const clientRows = await dbRun(`
    INSERT INTO clients (
      client_nature, telegram_name, trading_platform, trading_account_number,
      account_password, server_name, server_id, account_balance, account_type,
      use_note_if_prop_firm, fixed_lot_size, algo_plan, client_info_note, subscription,
      status, assigned_cs_agent_id, source_tab, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *
  `, [
    b.client_nature || null, b.telegram_name, b.trading_platform || null, b.trading_account_number || null,
    b.account_password || null, b.server_name || null, b.server_id || null, b.account_balance || null,
    b.account_type || null, b.use_note_if_prop_firm || null, b.fixed_lot_size || null, b.algo_plan || null,
    b.client_info_note || null, b.subscription || null, b.status || 'active',
    b.assigned_cs_agent_id || null, 'CS Portal (manual entry)', req.user.id
  ]);
  const client = clientRows[0];
  await logActivity({ userId: req.user.id, entityType: 'client', entityId: client.id, action: 'created' });

  // AUTOMATION: mirror into Setup Portal automatically
  const planType = inferPlanType(b.algo_plan, b.client_nature);
  const setupRows = await dbRun(`
    INSERT INTO setups (
      client_id, plan_type, client_nature, telegram_name, trading_platform, trading_account_number,
      account_password, server_name, server_id, account_balance, account_type, fixed_lot_size, algo_plan,
      setup_status, source_tab, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id
  `, [
    client.id, planType, b.client_nature || null, b.telegram_name, b.trading_platform || null,
    b.trading_account_number || null, b.account_password || null, b.server_name || null, b.server_id || null,
    b.account_balance || null, b.account_type || null, b.fixed_lot_size || null, b.algo_plan || null,
    'Not Started', 'Auto-synced from CS Portal', req.user.id
  ]);
  await logActivity({ userId: req.user.id, entityType: 'setup', entityId: setupRows[0].id, action: 'auto_created_from_client', newValue: `client_id=${client.id}` });

  res.status(201).json(client);
});

const SHARED_FIELDS = ['telegram_name', 'trading_platform', 'trading_account_number', 'account_password', 'server_name', 'server_id', 'account_balance', 'account_type', 'fixed_lot_size', 'algo_plan', 'client_nature'];

router.patch('/:id', requireAuth, requireRole('admin', 'cs'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Client not found' });

  const allowed = ['client_nature','telegram_name','trading_platform','trading_account_number','account_password',
    'server_name','server_id','account_balance','account_type','use_note_if_prop_firm','fixed_lot_size','algo_plan',
    'client_info_note','subscription','status','assigned_cs_agent_id'];

  const updates = [];
  const values = [];
  const sharedChanges = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined && req.body[field] !== existing[field]) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
      await logActivity({ userId: req.user.id, entityType: 'client', entityId: req.params.id, action: 'updated', fieldChanged: field, oldValue: existing[field], newValue: req.body[field] });
      if (SHARED_FIELDS.includes(field)) sharedChanges[field] = req.body[field];
    }
  }
  if (!updates.length) return res.json(existing);

  updates.push('updated_at = NOW()');
  values.push(req.params.id);
  await dbRun(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, values);

  if (Object.keys(sharedChanges).length) {
    // If the plan-defining fields changed, also recompute the Setup's plan_type
    // classification (lifetime / one_month / broker_trial / broker_lifetime),
    // not just copy the raw text — this used to only happen at creation time.
    if (sharedChanges.algo_plan !== undefined || sharedChanges.client_nature !== undefined) {
      const merged = { ...existing, ...sharedChanges };
      sharedChanges.plan_type = inferPlanType(merged.algo_plan, merged.client_nature);
    }
    const setupUpdates = Object.keys(sharedChanges).map(f => `${f} = ?`).join(', ');
    const setupValues = [...Object.values(sharedChanges), req.params.id];
    await dbRun(`UPDATE setups SET ${setupUpdates}, updated_at = NOW() WHERE client_id = ?`, setupValues);
  }

  const updated = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.post('/:id/assign', requireAuth, requireRole('admin', 'cs'), async (req, res) => {
  const { agent_id } = req.body;
  const existing = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Client not found' });
  await dbRun('UPDATE clients SET assigned_cs_agent_id = ?, updated_at = NOW() WHERE id = ?', [agent_id, req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'client', entityId: req.params.id, action: 'assigned', oldValue: existing.assigned_cs_agent_id, newValue: agent_id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'client', entityId: req.params.id, action: 'deleted' });
  res.json({ ok: true });
});

export default router;
