import express from 'express';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { search = '', plan_type, setup_status, assigned_to, page = 1, pageSize = 25 } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(telegram_name ILIKE ? OR trading_account_number ILIKE ? OR vps_no ILIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (plan_type) { where.push('plan_type = ?'); params.push(plan_type); }
  if (setup_status) { where.push('setup_status = ?'); params.push(setup_status); }
  if (assigned_to) { where.push('assigned_setup_agent_id = ?'); params.push(assigned_to); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await dbGet(`SELECT COUNT(*)::int as c FROM setups ${whereSql}`, params)).c;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = await dbAll(`
    SELECT s.*, u.full_name as assigned_agent_name FROM setups s
    LEFT JOIN users u ON u.id = s.assigned_setup_agent_id
    ${whereSql} ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `, [...params, Number(pageSize), offset]);
  res.json({ total, page: Number(page), pageSize: Number(pageSize), rows });
});

router.get('/:id', requireAuth, async (req, res) => {
  const setup = await dbGet(`
    SELECT s.*, u.full_name as assigned_agent_name FROM setups s
    LEFT JOIN users u ON u.id = s.assigned_setup_agent_id WHERE s.id = ?`, [req.params.id]);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  const notes = await dbAll(`
    SELECT n.*, u.full_name as author_name FROM notes n LEFT JOIN users u ON u.id = n.created_by
    WHERE entity_type='setup' AND entity_id=? ORDER BY n.created_at DESC`, [req.params.id]);
  const activity = await dbAll(`
    SELECT a.*, u.full_name as user_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE entity_type='setup' AND entity_id=? ORDER BY a.created_at DESC LIMIT 100`, [req.params.id]);
  // Issues belonging to the same client, so the Setup team can see and update
  // their status (Pending/Solved). Since this reads/writes the same `issues`
  // table the CS Portal uses, any change here shows up in the CS Portal instantly.
  const issues = setup.client_id
    ? await dbAll('SELECT * FROM issues WHERE client_id = ? ORDER BY created_at DESC', [setup.client_id])
    : [];
  res.json({ ...setup, notes, activity, issues });
});

router.patch('/:id', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM setups WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Setup not found' });
  const allowed = ['setup_field','setup_status','vps_no','ext_id','parameters','activation_date',
    'expire_date','vps_expire_date','note','assigned_setup_agent_id','plan_type'];
  const updates = []; const values = [];
  for (const f of allowed) {
    if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
      updates.push(`${f} = ?`); values.push(req.body[f]);
      await logActivity({ userId: req.user.id, entityType: 'setup', entityId: req.params.id, action: f === 'setup_status' ? 'status_changed' : 'updated', fieldChanged: f, oldValue: existing[f], newValue: req.body[f] });
    }
  }
  if (req.body.setup_status === 'Completed' && existing.setup_status !== 'Completed') {
    updates.push('completed_at = NOW()');
  }
  if (!updates.length) return res.json(existing);
  updates.push('updated_at = NOW()');
  values.push(req.params.id);
  await dbRun(`UPDATE setups SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json(await dbGet('SELECT * FROM setups WHERE id = ?', [req.params.id]));
});

router.post('/:id/assign', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const { agent_id } = req.body;
  const existing = await dbGet('SELECT * FROM setups WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Setup not found' });
  await dbRun('UPDATE setups SET assigned_setup_agent_id = ?, updated_at = NOW() WHERE id = ?', [agent_id, req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'setup', entityId: req.params.id, action: 'assigned', oldValue: existing.assigned_setup_agent_id, newValue: agent_id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await dbRun('DELETE FROM setups WHERE id = ?', [req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'setup', entityId: req.params.id, action: 'deleted' });
  res.json({ ok: true });
});

export default router;
