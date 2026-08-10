import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add your Neon connection string to server/.env (see .env.example).');
}

const sql = neon(process.env.DATABASE_URL);

// Converts our SQLite-style "?" placeholders to Postgres "$1, $2, ..." placeholders
function toPg(query) {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
}

export async function dbAll(query, params = []) {
  return await sql.query(toPg(query), params);
}

export async function dbGet(query, params = []) {
  const rows = await sql.query(toPg(query), params);
  return rows[0];
}

// For INSERT/UPDATE/DELETE. If the query contains RETURNING, the returned rows are passed back.
export async function dbRun(query, params = []) {
  return await sql.query(toPg(query), params);
}

export async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.postgres.sql'), 'utf-8');
  // Neon's sql.query() runs one statement at a time; split on statement boundaries.
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
}

export async function logActivity({ userId, entityType, entityId, action, fieldChanged = null, oldValue = null, newValue = null }) {
  await dbRun(
    `INSERT INTO activity_log (user_id, entity_type, entity_id, action, field_changed, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, entityType, entityId, action, fieldChanged, oldValue === null ? null : String(oldValue), newValue === null ? null : String(newValue)]
  );
}
