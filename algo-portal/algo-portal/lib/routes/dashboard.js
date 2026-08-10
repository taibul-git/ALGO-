import express from 'express';
import { dbAll, dbGet } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  const totalClients = (await dbGet('SELECT COUNT(*)::int c FROM clients')).c;
  const activeClients = (await dbGet("SELECT COUNT(*)::int c FROM clients WHERE status = 'active'")).c;

  const totalIssues = (await dbGet('SELECT COUNT(*)::int c FROM issues')).c;
  const pendingIssues = (await dbGet("SELECT COUNT(*)::int c FROM issues WHERE status = 'Pending'")).c;
  const solvedIssues = (await dbGet("SELECT COUNT(*)::int c FROM issues WHERE status = 'Solved'")).c;

  const issuesByCategory = await dbAll(`
    SELECT COALESCE(category,'Uncategorized') as category, COUNT(*)::int as count
    FROM issues GROUP BY category ORDER BY count DESC
  `);

  const totalSetups = (await dbGet('SELECT COUNT(*)::int c FROM setups')).c;
  const setupsByStatus = await dbAll(`SELECT setup_status, COUNT(*)::int as count FROM setups GROUP BY setup_status`);
  const setupsByPlan = await dbAll(`SELECT plan_type, COUNT(*)::int as count FROM setups GROUP BY plan_type`);

  const totalRunning = (await dbGet('SELECT COUNT(*)::int c FROM running_accounts')).c;
  const totalVps = (await dbGet('SELECT COUNT(*)::int c FROM vps_credentials')).c;

  const recentActivity = await dbAll(`
    SELECT a.*, u.full_name as user_name FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 20
  `);

  const clientsPerAgent = await dbAll(`
    SELECT u.full_name, COUNT(c.id)::int as count FROM users u
    LEFT JOIN clients c ON c.assigned_cs_agent_id = u.id
    WHERE u.role = 'cs' GROUP BY u.id, u.full_name
  `);

  const setupsPerAgent = await dbAll(`
    SELECT u.full_name, COUNT(s.id)::int as count FROM users u
    LEFT JOIN setups s ON s.assigned_setup_agent_id = u.id
    WHERE u.role = 'setup' GROUP BY u.id, u.full_name
  `);

  res.json({
    totalClients, activeClients,
    totalIssues, pendingIssues, solvedIssues, issuesByCategory,
    totalSetups, setupsByStatus, setupsByPlan,
    totalRunning, totalVps,
    recentActivity, clientsPerAgent, setupsPerAgent
  });
});

export default router;
