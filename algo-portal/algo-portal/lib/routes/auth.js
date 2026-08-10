import express from 'express';
import bcrypt from 'bcryptjs';
import { dbAll, dbGet, dbRun, logActivity } from '../db.js';
import { signToken, requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = await dbGet('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await dbAll('SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

router.post('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'username, password, full_name, role are required' });
  }
  if (!['admin', 'cs', 'setup'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin, cs, or setup' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const rows = await dbRun(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?) RETURNING id',
      [username, hash, full_name, role]
    );
    const id = rows[0].id;
    await logActivity({ userId: req.user.id, entityType: 'user', entityId: id, action: 'created' });
    res.status(201).json({ id });
  } catch (e) {
    if (String(e).includes('duplicate key') || String(e).includes('unique')) return res.status(409).json({ error: 'Username already exists' });
    console.error(e);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { full_name, role, is_active, password } = req.body;
  const existing = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates = [];
  const values = [];
  if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
  if (role !== undefined) { updates.push('role = ?'); values.push(role); }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
  if (password) { updates.push('password_hash = ?'); values.push(bcrypt.hashSync(password, 10)); }
  updates.push('updated_at = NOW()');

  if (updates.length === 1) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await dbRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  await logActivity({ userId: req.user.id, entityType: 'user', entityId: req.params.id, action: 'updated' });
  res.json({ ok: true });
});

export default router;
