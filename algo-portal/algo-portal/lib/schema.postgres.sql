-- ============================================================
-- ALGO PORTAL DATABASE SCHEMA (PostgreSQL / Neon version)
-- ============================================================

CREATE TABLE IF NOT EXISTS _seed_status (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  detail TEXT,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','cs','setup')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_nature TEXT,
  telegram_name TEXT NOT NULL,
  trading_platform TEXT,
  trading_account_number TEXT,
  account_password TEXT,
  server_name TEXT,
  server_id TEXT,
  account_balance TEXT,
  account_type TEXT,
  use_note_if_prop_firm TEXT,
  fixed_lot_size TEXT,
  algo_plan TEXT,
  client_info_note TEXT,
  subscription TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  assigned_cs_agent_id INTEGER REFERENCES users(id),
  source_tab TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_tg ON clients(telegram_name);
CREATE INDEX IF NOT EXISTS idx_clients_acct ON clients(trading_account_number);

CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  category TEXT,
  telegram_name TEXT,
  account_number TEXT,
  details TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Solved')),
  remarks TEXT,
  assigned_to INTEGER REFERENCES users(id),
  source_tab TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issues_client ON issues(client_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

CREATE TABLE IF NOT EXISTS setups (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('lifetime','one_month','broker_trial','broker_lifetime')),
  client_nature TEXT,
  telegram_name TEXT,
  trading_platform TEXT,
  trading_account_number TEXT,
  account_password TEXT,
  server_name TEXT,
  server_id TEXT,
  account_balance TEXT,
  account_type TEXT,
  fixed_lot_size TEXT,
  algo_plan TEXT,
  client_information TEXT,
  note TEXT,
  setup_field TEXT,
  setup_status TEXT DEFAULT 'Not Started' CHECK (setup_status IN ('Not Started','In Progress','Completed','Blocked')),
  vps_no TEXT,
  ext_id TEXT,
  parameters TEXT,
  activation_date TEXT,
  expire_date TEXT,
  vps_expire_date TEXT,
  completed_at TIMESTAMPTZ,
  assigned_setup_agent_id INTEGER REFERENCES users(id),
  source_tab TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_setups_client ON setups(client_id);
CREATE INDEX IF NOT EXISTS idx_setups_plan ON setups(plan_type);
CREATE INDEX IF NOT EXISTS idx_setups_status ON setups(setup_status);

CREATE TABLE IF NOT EXISTS running_accounts (
  id SERIAL PRIMARY KEY,
  setup_id INTEGER REFERENCES setups(id),
  client_id INTEGER REFERENCES clients(id),
  telegram_name TEXT,
  account_information TEXT,
  subscription TEXT,
  note TEXT,
  status TEXT,
  vps_no TEXT,
  running_number TEXT,
  is_prop_firm INTEGER DEFAULT 0,
  source_tab TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_running_client ON running_accounts(client_id);

CREATE TABLE IF NOT EXISTS vps_credentials (
  id SERIAL PRIMARY KEY,
  vps_name TEXT,
  username TEXT,
  address TEXT,
  password TEXT,
  remarks TEXT,
  source_tab TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_page (
  id SERIAL PRIMARY KEY,
  telegram_name TEXT,
  plan_type TEXT,
  status TEXT,
  activation_date TEXT,
  expire_date TEXT,
  vps_expire_date TEXT,
  source_tab TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client','issue','setup','running_account')),
  entity_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
-- Links a Setup to a specific VPS credential record, so the VPS Credentials
-- page can show a live count of how many setups are assigned to each VPS.
ALTER TABLE setups ADD COLUMN IF NOT EXISTS vps_id INTEGER REFERENCES vps_credentials(id);
CREATE INDEX IF NOT EXISTS idx_setups_vps ON setups(vps_id);
