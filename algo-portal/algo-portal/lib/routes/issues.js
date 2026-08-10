import express from 'express';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { search = '', status, category, assigned_to, page = 1, pageSize = 25 } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(telegram_name ILIKE ? OR account_number ILIKE ? OR details ILIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { where.push('status = ?'); params.push(status); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (assigned_to) { where.push('assigned_to = ?'); params.push(assigned_to); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await dbGet(`SELECT COUNT(*)::int as c FROM issues ${whereSql}`, params)).c;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = await dbAll(`
    SELECT i.*, u.full_name as assigned_agent_name FROM issues i
    LEFT JOIN users u ON u.id = i.assigned_to
    ${whereSql} ORDER BY i.created_at DESC LIMIT ? OFFSET ?
  `, [...params, Number(pageSize), offset]);
  res.json({ total, page: Number(page), pageSize: Number(pageSize), rows });
});

router.post('/', requireAuth, requireRole('admin', 'cs'), async (req, res) => {
  const b = req.body;
  let clientId = b.client_id || null;
  if (!clientId && b.telegram_name) {
    const match = await dbGet('SELECT id FROM clients WHERE telegram_name = ? LIMIT 1', [b.telegram_name]);
    if (match) clientId = match.id;
  }
  const rows = await dbRun(`
    INSERT INTO issues (client_id, category, telegram_name, account_number, details, status, remarks, assigned_to, source_tab, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *
  `, [clientId, b.category || null, b.telegram_name || null, b.account_number || null, b.details || null,
      b.status || 'Pending', b.remarks || null, b.assigned_to || null, 'CS Portal (manual entry)', req.user.id]);
  const issue = rows[0];
  await logActivity({ userId: req.user.id, entityType: 'issue', entityId: issue.id, action: 'created' });
  res.status(201).json(issue);
});

router.patch('/:id', requireAuth, requireRole('admin', 'cs', 'setup'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM issues WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Issue not found' });
  const allowed = ['category', 'details', 'status', 'remarks', 'assigned_to'];
  const updates = []; const values = [];
  for (const f of allowed) {
    if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
      updates.push(`${f} = ?`); values.push(req.body[f]);
      await logActivity({ userId: req.user.id, entityType: 'issue', entityId: req.params.id, action: f === 'status' ? 'status_changed' : 'updated', fieldChanged: f, oldValue: existing[f], newValue: req.body[f] });
    }
  }
  if (!updates.length) return res.json(existing);
  updates.push('updated_at = NOW()');
  values.push(req.params.id);
  await dbRun(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json(await dbGet('SELECT * FROM issues WHERE id = ?', [req.params.id]));
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await dbRun('DELETE FROM issues WHERE id = ?', [req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'issue', entityId: req.params.id, action: 'deleted' });
  res.json({ ok: true });
});

export default router;
