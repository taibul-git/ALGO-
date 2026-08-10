# Algo Portal — CS & Setup CRM

A web-based replacement for the ALGO CS Sheet and ALGO Setup Sheet Google Sheets workflow.

Single flat project: React (Vite) frontend at the root, a serverless API in `/api`, Postgres (Neon)
as the database. Vercel auto-detects everything — no Build Command, no Root Directory, no vercel.json.
**Data import happens by visiting one link in your browser — no terminal required.**

---

## 1. What this replaces

| Old Google Sheets workflow | New portal |
|---|---|
| ALGO CS Sheet (client intake, issue tracking, status page) | **CS Portal** — Clients, Issues |
| ALGO Setup Sheet (19 tabs) | **Setup Portal** — Setups, Running Accounts, VPS Credentials |
| Manual copy from CS sheet to Setup sheet | **Automatic** — creating a client instantly creates a linked Setup record, and shared fields stay synced. |

---

## 2. The 3 steps to get this live

**Step 1 — Get the code onto GitHub**
Upload every file in this folder to your GitHub repo (replace whatever was there before), via GitHub's website "Add file → Upload files" — no git commands needed.

**Step 2 — Connect a database, one click, inside Vercel**
In your Vercel project: **Storage tab → Create Database → Neon (Postgres) → Connect** to your project. Vercel adds the `DATABASE_URL` environment variable for you automatically — nothing to copy or paste.

**Step 3 — Load your data by visiting one link**
Once the deploy finishes, open this in your browser (use your real project URL):
```
https://your-project.vercel.app/api/setup
```
This one page creates every database table and imports your 725 clients, 1,543 issues, and everything else, automatically. When it says "Setup complete", click through to the portal and log in with:

`admin` / `Admin@123` (change this password afterward via **Team & Roles**)

Reloading `/api/setup` again is safe — it detects existing data and won't duplicate anything.

**That's it.** No terminal, no `.env` file, no npm commands required for deployment.

---

## 3. Project structure

```
algo-portal/
├── src/                  React frontend (Vite)
├── public/
├── index.html
├── api/
│   ├── index.js            the entire backend API, as one Vercel serverless function
│   └── setup.js             the one-click "create tables + import data" endpoint
├── lib/                   backend code, imported by the two files above
│   ├── app.js                 Express app (routes, middleware)
│   ├── local-server.js        local dev entrypoint (npm run server)
│   ├── db.js                   Neon/Postgres connection + query helpers
│   ├── schema.postgres.sql      database schema
│   ├── seed-data.json           your migrated sheet data, bundled directly into the app
│   ├── middleware/auth.js       JWT auth + role guards
│   ├── routes/                  one file per resource
│   └── seed/
│       ├── seedLogic.js          the import logic (used by api/setup.js)
│       └── import.js             optional CLI version, for local use only
├── data/
│   ├── raw/                 original CSV exports (source of truth for seed-data.json)
│   └── IMPORT_REPORT.txt
└── package.json
```

---

## 4. Running it locally (optional — only if you want to test before deploying)

```bash
npm install
cp .env.example .env        # DATABASE_URL + JWT_SECRET
npm run server               # backend on http://localhost:4000
```
In a second terminal: `npm run dev` (frontend on http://localhost:5173). Then visit `http://localhost:4000/api/setup` once to seed your local database.

---

## 5. Data migration — what was imported and how

Your workbooks had **4 real entity types across 23 tabs**, not the 2 flat sheets originally described. Nothing was dropped — every tab with unique data was imported and tagged with its source tab. Full detail in `data/IMPORT_REPORT.txt`.

| Entity | Imported |
|---|---|
| Clients | 725 |
| Issues | 1,543 |
| Setups | 1,251 |
| Running Accounts | 192 |
| VPS Credentials | 24 |
| Status Page snapshot | 737 (reference table) |

Two tabs (`Algo Signal Providers`, `Sheet16`) were left out — they looked like scratch notes, not structured records.

**Going forward: no new data should be entered into the old Google Sheets.** The portal is authoritative from this point on.

---

## 6. Security checklist before real usage

- [ ] Change all three default passwords via the admin **Team & Roles** page
- [ ] Set a `JWT_SECRET` environment variable in Vercel (a long random string) — the app runs without one, but sessions are more secure with a real secret
- [ ] Vercel serves everything over HTTPS by default
- [ ] VPS Credentials and client account passwords are stored in plaintext in this MVP, matching how they were stored in the sheets — ask if you want field-level encryption added
- [ ] For backup: `pg_dump $DATABASE_URL > backup.sql` periodically, or use Neon's built-in backup/branching features

---

## 7. Features included

- Secure login (JWT), role-based access (Admin / CS / Setup)
- Dashboard with live stats: client counts, issue breakdown, setup status/plan breakdown, recent activity
- Search, filter, sort, and pagination on every list view
- Full add/edit on clients, issues, and setups
- Automatic CS → Setup sync on client creation and on edit of shared fields
- Assignment system, status tracking, activity history, notes
- Responsive layout, clean modern UI

## 8. Built for future expansion

New entity types are a new table in `schema.postgres.sql` + a route file in `lib/routes` + a page in `src/pages` — the existing patterns (search/filter/pagination, notes, activity log) are reusable, not one-off code.
