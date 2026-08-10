import express from 'express';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { search = '', status, page = 1, pageSize = 25 } = req.query;
  const where = []; const params = [];
  if (search) { where.push('(telegram_name ILIKE ? OR account_information ILIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (await dbGet(`SELECT COUNT(*)::int as c FROM running_accounts ${whereSql}`, params)).c;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = await dbAll(`SELECT * FROM running_accounts ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, Number(pageSize), offset]);
  res.json({ total, page: Number(page), pageSize: Number(pageSize), rows });
});

router.patch('/:id', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM running_accounts WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const allowed = ['subscription', 'note', 'status', 'vps_no', 'running_number'];
  const updates = []; const values = [];
  for (const f of allowed) {
    if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
      updates.push(`${f} = ?`); values.push(req.body[f]);
      await logActivity({ userId: req.user.id, entityType: 'running_account', entityId: req.params.id, action: 'updated', fieldChanged: f, oldValue: existing[f], newValue: req.body[f] });
    }
  }
  if (!updates.length) return res.json(existing);
  updates.push('updated_at = NOW()');
  values.push(req.params.id);
  await dbRun(`UPDATE running_accounts SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json(await dbGet('SELECT * FROM running_accounts WHERE id = ?', [req.params.id]));
});

export default router;
