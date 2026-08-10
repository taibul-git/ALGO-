// Visit this endpoint once, in a browser, after connecting your database.
// It creates all tables and imports your data — no terminal needed.
// Safe to reload: it will refuse to run twice.
import 'dotenv/config';
import { initSchema, dbGet, dbRun } from '../lib/db.js';
import { runSeed } from '../lib/seed/seedLogic.js';

function page(title, body, ok) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 22px; }
    .ok { color: #0f6e56; } .err { color: #a32d2d; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 13px; overflow-x: auto; white-space: pre-wrap; }
    a { color: #185fa5; }
  </style></head><body>
  <h1 class="${ok ? 'ok' : 'err'}">${title}</h1>
  ${body}
  </body></html>`;
}

export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(page('DATABASE_URL not set', `
        <p>Add <code>DATABASE_URL</code> in Vercel → Settings → Environment Variables, then reload this page.</p>
      `, false));
    }

    await initSchema();

    // Atomic lock: only the first request that successfully inserts this row proceeds.
    let lockAcquired = false;
    try {
      const rows = await dbRun(
        `INSERT INTO _seed_status (id, status) VALUES (1, 'seeding') RETURNING id`
      );
      lockAcquired = rows.length > 0;
    } catch (e) {
      lockAcquired = false; // row already exists -> someone else already ran or is running this
    }

    if (!lockAcquired) {
      const existing = await dbGet('SELECT * FROM _seed_status WHERE id = 1');
      res.setHeader('Content-Type', 'text/html');
      if (existing?.status === 'completed') {
        return res.status(200).send(page('Already set up', `
          <p>Your data was already imported on ${existing.completed_at}.</p>
          <p><a href="/">Go to the portal →</a></p>
        `, true));
      }
      return res.status(200).send(page('Setup already in progress', `
        <p>Someone triggered this a moment ago. Wait about a minute and reload this page.</p>
      `, true));
    }

    const report = await runSeed();

    await dbRun(
      `UPDATE _seed_status SET status = 'completed', completed_at = NOW(), detail = ? WHERE id = 1`,
      [report.join('\n')]
    );

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(page('Setup complete', `
      <p>Your database has been created and all your data has been imported.</p>
      <pre>${report.join('\n')}</pre>
      <p><a href="/">Go to the portal →</a></p>
      <p style="color:#888; font-size:13px;">Log in with <b>admin</b> / <b>Admin@123</b> (change this password after logging in).</p>
    `, true));
  } catch (err) {
    console.error(err);
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(page('Setup failed', `<pre>${String(err.stack || err)}</pre>`, false));
  }
}
