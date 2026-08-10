import express from 'express';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const rows = await dbAll('SELECT * FROM vps_credentials ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const b = req.body;
  const rows = await dbRun(
    'INSERT INTO vps_credentials (vps_name, username, address, password, remarks, source_tab) VALUES (?,?,?,?,?,?) RETURNING *',
    [b.vps_name || null, b.username || null, b.address || null, b.password || null, b.remarks || null, 'Setup Portal (manual entry)']
  );
  const vps = rows[0];
  await logActivity({ userId: req.user.id, entityType: 'vps', entityId: vps.id, action: 'created' });
  res.status(201).json(vps);
});

router.patch('/:id', requireAuth, requireRole('admin', 'setup'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM vps_credentials WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const allowed = ['vps_name', 'username', 'address', 'password', 'remarks'];
  const updates = []; const values = [];
  for (const f of allowed) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (!updates.length) return res.json(existing);
  updates.push('updated_at = NOW()');
  values.push(req.params.id);
  await dbRun(`UPDATE vps_credentials SET ${updates.join(', ')} WHERE id = ?`, values);
  await logActivity({ userId: req.user.id, entityType: 'vps', entityId: req.params.id, action: 'updated' });
  res.json(await dbGet('SELECT * FROM vps_credentials WHERE id = ?', [req.params.id]));
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await dbRun('DELETE FROM vps_credentials WHERE id = ?', [req.params.id]);
  await logActivity({ userId: req.user.id, entityType: 'vps', entityId: req.params.id, action: 'deleted' });
  res.json({ ok: true });
});

export default router;
