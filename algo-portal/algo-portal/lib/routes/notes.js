import express from 'express';
import { dbAll, dbRun, logActivity } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { entity_type, entity_id, note_text } = req.body;
  if (!['client', 'issue', 'setup', 'running_account'].includes(entity_type)) {
    return res.status(400).json({ error: 'Invalid entity_type' });
  }
  if (!entity_id || !note_text) return res.status(400).json({ error: 'entity_id and note_text are required' });

  const rows = await dbRun('INSERT INTO notes (entity_type, entity_id, note_text, created_by) VALUES (?,?,?,?) RETURNING id', [entity_type, entity_id, note_text, req.user.id]);
  await logActivity({ userId: req.user.id, entityType: entity_type, entityId: entity_id, action: 'note_added' });
  const [note] = await dbAll(`
    SELECT n.*, u.full_name as author_name FROM notes n LEFT JOIN users u ON u.id = n.created_by WHERE n.id = ?
  `, [rows[0].id]);
  res.status(201).json(note);
});

router.get('/', requireAuth, async (req, res) => {
  const { entity_type, entity_id } = req.query;
  const notes = await dbAll(`
    SELECT n.*, u.full_name as author_name FROM notes n LEFT JOIN users u ON u.id = n.created_by
    WHERE entity_type = ? AND entity_id = ? ORDER BY n.created_at DESC
  `, [entity_type, entity_id]);
  res.json(notes);
});

export default router;
