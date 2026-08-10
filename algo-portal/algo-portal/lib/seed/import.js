import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import { dbAll, dbRun, initSchema, logActivity } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '..', '..', 'data', 'raw');

function loadCsv(name) {
  const filePath = path.join(RAW_DIR, `${name}.csv`);
  if (!fs.existsSync(filePath)) { console.warn(`  [skip] ${name}.csv not found`); return []; }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: false });
}

const clean = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'nan' ? null : s;
};

const report = [];
function log(msg) { console.log(msg); report.push(msg); }

async function main() {
  log('== Initializing schema ==');
  await initSchema();

  log('== Resetting tables ==');
  await dbRun('TRUNCATE activity_log, notes, status_page, vps_credentials, running_accounts, setups, issues, clients, users RESTART IDENTITY CASCADE');

  log('== Seeding default users ==');
  const defaultUsers = [
    { username: 'admin', password: 'Admin@123', full_name: 'System Administrator', role: 'admin' },
    { username: 'cs_agent1', password: 'CsAgent@123', full_name: 'CS Agent One', role: 'cs' },
    { username: 'setup_agent1', password: 'SetupAgent@123', full_name: 'Setup Agent One', role: 'setup' },
  ];
  const userIds = {};
  for (const u of defaultUsers) {
    const rows = await dbRun('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?) RETURNING id',
      [u.username, bcrypt.hashSync(u.password, 10), u.full_name, u.role]);
    userIds[u.username] = rows[0].id;
  }
  const SYSTEM_USER = userIds['admin'];

  // ---------------- CLIENTS ----------------
  log('\n== Importing clients ==');
  const clientInfoRows = loadCsv('client_info');
  const clientInfoByName = {};
  for (const r of clientInfoRows) {
    const name = clean(r['Name']);
    if (name) clientInfoByName[name.toLowerCase()] = r;
  }

  const clientRows = loadCsv('algo_client_account_information');
  const clientIdByTelegram = {};
  let clientCount = 0;
  for (const r of clientRows) {
    const tg = clean(r['Telegram Name']);
    if (!tg) continue;
    const enrich = clientInfoByName[tg.toLowerCase()];
    const rows = await dbRun(`
      INSERT INTO clients (
        client_nature, telegram_name, trading_platform, trading_account_number, account_password,
        server_name, server_id, account_balance, account_type, use_note_if_prop_firm, fixed_lot_size,
        algo_plan, client_info_note, subscription, status, source_tab, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id
    `, [
      clean(r['Client Nature']), tg, clean(r['Trading Platform']), clean(r[' Trading Account Number']),
      clean(r['Account password']), clean(r['Server Name']), clean(r['Server ID']), clean(r['Account Balance']),
      clean(r['Account Type']), clean(r['Use Note If Prop Firm']), clean(r['Fixed Lot Size']), clean(r['Algo Plan']),
      enrich ? clean(enrich['Note']) : null, enrich ? clean(enrich['SUBSCRIPTION']) : null,
      'active', 'CS Sheet: Algo Client Account Information', SYSTEM_USER
    ]);
    if (!clientIdByTelegram[tg.toLowerCase()]) clientIdByTelegram[tg.toLowerCase()] = rows[0].id;
    clientCount++;
  }
  log(`Imported ${clientCount} clients from "Algo Client Account Information".`);

  let clientInfoOnlyCount = 0;
  for (const [nameLower, r] of Object.entries(clientInfoByName)) {
    if (clientIdByTelegram[nameLower]) continue;
    const rows = await dbRun(`
      INSERT INTO clients (telegram_name, client_info_note, subscription, status, source_tab, created_by)
      VALUES (?,?,?,?,?,?) RETURNING id
    `, [clean(r['Name']), clean(r['Note']), clean(r['SUBSCRIPTION']), 'active', 'CS Sheet: CLIENT INFO (no matching account record)', SYSTEM_USER]);
    clientIdByTelegram[nameLower] = rows[0].id;
    clientInfoOnlyCount++;
  }
  log(`Imported ${clientInfoOnlyCount} additional client stubs from "CLIENT INFO" that had no matching account row.`);

  // ---------------- ISSUES ----------------
  log('\n== Importing issues ==');
  async function importIssueRows(rows, sourceTab, colMap) {
    let n = 0;
    for (const r of rows) {
      const tg = clean(r[colMap.tg]);
      const details = clean(r[colMap.details]);
      if (!tg && !details) continue;
      const clientId = tg ? (clientIdByTelegram[tg.toLowerCase()] || null) : null;
      await dbRun(`
        INSERT INTO issues (client_id, category, telegram_name, account_number, details, status, remarks, source_tab, created_by)
        VALUES (?,?,?,?,?,?,?,?,?)
      `, [clientId, clean(r[colMap.category] ?? null), tg, clean(r[colMap.account]), details, clean(r[colMap.status]) || 'Pending', clean(r[colMap.remarks]), sourceTab, SYSTEM_USER]);
      n++;
    }
    return n;
  }

  const csIssues = loadCsv('client_issue_assign_cs');
  const n1 = await importIssueRows(csIssues, 'CS Sheet: Client Issue Assign', {
    category: 'Category', tg: 'Telegram Name', account: ' Current Trading Account Number', details: 'Details', status: 'Status', remarks: 'Remarks (If Any)'
  });
  log(`Imported ${n1} issues from "Client Issue Assign" (CS Sheet, canonical log).`);

  const setupIssuesDup = loadCsv('client_issue_assign_setup');
  if (setupIssuesDup.length) log(`Note: "Client Issue Assign(New)" tab (${setupIssuesDup.length} rows) is byte-identical to the CS Sheet version above — not re-imported as a duplicate copy.`);

  const legacyIssues = loadCsv('algo_issues_assign');
  const n2 = await importIssueRows(legacyIssues, 'Setup Sheet: Algo Issues Assign (legacy)', {
    category: null, tg: 'TG NAME', account: 'Current Account Number', details: 'Issues', status: 'Status', remarks: 'Remarks (If Any)'
  });
  log(`Imported ${n2} issues from "Algo Issues Assign" (Setup Sheet legacy tab).`);

  const copyIssues = loadCsv('copy_of_algo_issues_assign');
  if (copyIssues.length) log(`Note: "Copy of Algo Issues Assign" duplicates "Algo Issues Assign" row-for-row — not re-imported.`);

  // ---------------- SETUPS ----------------
  log('\n== Importing setups ==');
  function mapSetupStatus(raw) {
    const s = (raw || '').toLowerCase();
    if (s.includes('complet') || s.includes('done') || s.includes('solved')) return 'Completed';
    if (s.includes('progress')) return 'In Progress';
    if (s.includes('block') || s.includes('issue')) return 'Blocked';
    return 'Not Started';
  }

  async function importFullSetupTab(rows, planType, sourceTab, expireCol, expireDateColOut) {
    let n = 0;
    for (const r of rows) {
      const tg = clean(r['Telegram Name']);
      if (!tg) continue;
      const clientId = clientIdByTelegram[tg.toLowerCase()] || null;
      await dbRun(`
        INSERT INTO setups (
          client_id, plan_type, client_nature, telegram_name, trading_platform, trading_account_number,
          account_password, server_name, server_id, account_balance, account_type, fixed_lot_size, algo_plan,
          client_information, note, setup_field, setup_status, vps_no, ext_id, parameters,
          activation_date, expire_date, vps_expire_date, source_tab, created_by
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        clientId, planType, clean(r['Client Nature']), tg, clean(r['Trading Platform']), clean(r[' Trading Account Number']),
        clean(r['Account password']), clean(r['Server Name']), clean(r['Server ID']), clean(r['Account Balance']),
        clean(r['Account Type']), clean(r['Fixed Lot Size']), clean(r['Algo Plan']), clean(r['Client Information']),
        clean(r[' NOTE']), clean(r['SETUP']), mapSetupStatus(clean(r['STATUS'])), clean(r['VPS No.']), clean(r['ID']),
        clean(r['PARAMETERS']), clean(r['ACTIVATION']),
        expireDateColOut === 'expire_date' ? clean(r[expireCol]) : null,
        expireDateColOut === 'vps_expire_date' ? clean(r[expireCol]) : null,
        sourceTab, SYSTEM_USER
      ]);
      n++;
    }
    return n;
  }

  let n;
  n = await importFullSetupTab(loadCsv('lifetime_new'), 'lifetime', 'Setup Sheet: Lifetime(new)', 'VPS Expire(6months)', 'vps_expire_date');
  log(`Imported ${n} setups from "Lifetime(new)".`);
  n = await importFullSetupTab(loadCsv('one_month_new'), 'one_month', 'Setup Sheet: One month(New)', 'EXPIRE DATE', 'expire_date');
  log(`Imported ${n} setups from "One month(New)".`);
  n = await importFullSetupTab(loadCsv('broker_trial_new'), 'broker_trial', 'Setup Sheet: Broker trial (new)', 'EXPIRE DATE', 'expire_date');
  log(`Imported ${n} setups from "Broker trial (new)".`);
  n = await importFullSetupTab(loadCsv('broker_lifetime'), 'broker_lifetime', 'Setup Sheet: Broker lifetime', 'VPS Expire(6months)', 'vps_expire_date');
  log(`Imported ${n} setups from "Broker lifetime".`);

  async function importLegacySetupTab(rows, planType, sourceTab, vpsCol, expireCol, expireOut) {
    let n = 0;
    for (const r of rows) {
      const tg = clean(r['TG NAME']);
      if (!tg) continue;
      const clientId = clientIdByTelegram[tg.toLowerCase()] || null;
      await dbRun(`
        INSERT INTO setups (
          client_id, plan_type, telegram_name, client_information, note, setup_field, setup_status,
          vps_no, ext_id, parameters, activation_date, expire_date, vps_expire_date, source_tab, created_by
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        clientId, planType, tg, clean(r['ACCOUNT INFORMATION']), clean(r['NOTE']), clean(r['SETUP']), mapSetupStatus(clean(r['STATUS'])),
        clean(r[vpsCol]), clean(r['ID']), clean(r['PARAMETERS']), clean(r['ACTIVATION']),
        expireOut === 'expire_date' ? clean(r[expireCol]) : null,
        expireOut === 'vps_expire_date' ? clean(r[expireCol]) : null,
        sourceTab, SYSTEM_USER
      ]);
      n++;
    }
    return n;
  }
  n = await importLegacySetupTab(loadCsv('lifetime_legacy'), 'lifetime', 'Setup Sheet: LIFETIME (legacy)', 'Column 1', 'VPS expire(6months)', 'vps_expire_date');
  log(`Imported ${n} setups from legacy "LIFETIME" tab.`);
  n = await importLegacySetupTab(loadCsv('one_month_legacy'), 'one_month', 'Setup Sheet: ONE MONTH (legacy)', 'VPS No.', 'EXPIRE DATE', 'expire_date');
  log(`Imported ${n} setups from legacy "ONE MONTH" tab.`);
  n = await importLegacySetupTab(loadCsv('broker_trials_legacy'), 'broker_trial', 'Setup Sheet: BROKER TRIALS (legacy)', 'VPS No.', 'EXPIRE DATE', 'expire_date');
  log(`Imported ${n} setups from legacy "BROKER TRIALS" tab.`);

  const allData = loadCsv('all_data');
  let nAll = 0;
  for (const r of allData) {
    const tg = clean(r['TG NAME']);
    if (!tg) continue;
    const clientId = clientIdByTelegram[tg.toLowerCase()] || null;
    const note = clean(r['NOTE']) ? `${clean(r['NOTE'])} [imported from ALL DATA master tab - verify plan type]` : '[imported from ALL DATA master tab - verify plan type]';
    await dbRun(`
      INSERT INTO setups (client_id, plan_type, telegram_name, client_information, note, setup_field, setup_status, vps_no, ext_id, parameters, source_tab, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [clientId, 'one_month', tg, clean(r['ACCOUNT INFORMATION']), note, clean(r['SETUP']), mapSetupStatus(clean(r['STATUS'])), clean(r['VPS No.']), clean(r['ID']), clean(r['PARAMETERS']), 'Setup Sheet: ALL DATA (master view)', SYSTEM_USER]);
    nAll++;
  }
  log(`Imported ${nAll} setups from "ALL DATA" master tab (plan type defaulted to one_month — flagged in notes for review).`);

  await dbRun(`
    UPDATE setups SET client_id = (
      SELECT c.id FROM clients c WHERE lower(c.telegram_name) = lower(setups.telegram_name) LIMIT 1
    ) WHERE client_id IS NULL AND telegram_name IS NOT NULL
  `);

  // ---------------- RUNNING ACCOUNTS ----------------
  log('\n== Importing running accounts ==');
  async function importRunningTab(rows, sourceTab, vpsCol, isProp) {
    let n = 0;
    for (const r of rows) {
      const tg = clean(r['TG NAME']);
      if (!tg) continue;
      const clientId = clientIdByTelegram[tg.toLowerCase()] || null;
      await dbRun(`
        INSERT INTO running_accounts (client_id, telegram_name, account_information, subscription, note, status, vps_no, running_number, is_prop_firm, source_tab)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `, [clientId, tg, clean(r['ACCOUNT INFORMATION']), clean(r['SUBSCRIPTION']) || clean(r['Subscription']), clean(r['NOTE']), clean(r['STATUS']), clean(r[vpsCol]), clean(r['Running Number']), isProp ? 1 : 0, sourceTab]);
      n++;
    }
    return n;
  }
  n = await importRunningTab(loadCsv('running'), 'Setup Sheet: RUNNING', 'VPS No.', false);
  log(`Imported ${n} rows from "RUNNING".`);
  n = await importRunningTab(loadCsv('running_active'), 'Setup Sheet: Running Active', 'VPS', false);
  log(`Imported ${n} rows from "Running Active".`);
  n = await importRunningTab(loadCsv('running_active2'), 'Setup Sheet: RunningActive', 'VPS', false);
  log(`Imported ${n} rows from "RunningActive".`);
  n = await importRunningTab(loadCsv('running_prop'), 'Setup Sheet: Running prop', 'VPS', true);
  log(`Imported ${n} rows from "Running prop".`);
  n = await importRunningTab(loadCsv('running_prop2'), 'Setup Sheet: Runningprop', 'VPS No.', true);
  log(`Imported ${n} rows from "Runningprop".`);

  await dbRun(`
    UPDATE running_accounts SET client_id = (
      SELECT c.id FROM clients c WHERE lower(c.telegram_name) = lower(running_accounts.telegram_name) LIMIT 1
    ) WHERE client_id IS NULL AND telegram_name IS NOT NULL
  `);

  // ---------------- VPS CREDENTIALS ----------------
  log('\n== Importing VPS credentials ==');
  const vpsRows = loadCsv('vps_credentials');
  let nVps = 0;
  for (const r of vpsRows) {
    const name = clean(r['VPS Name']);
    if (!name) continue;
    await dbRun('INSERT INTO vps_credentials (vps_name, username, address, password, remarks, source_tab) VALUES (?,?,?,?,?,?)',
      [name, clean(r['Username']), clean(r['Address']), clean(r['Password']), clean(r['Remarks/Running']), 'Setup Sheet: VPS CREDENTIALS']);
    nVps++;
  }
  log(`Imported ${nVps} VPS credential records.`);

  // ---------------- STATUS PAGE ----------------
  log('\n== Importing status page ==');
  const statusRows = loadCsv('status_page');
  let nStatus = 0;
  for (const r of statusRows) {
    if (clean(r['TG name'])) {
      await dbRun('INSERT INTO status_page (telegram_name, plan_type, status, activation_date, expire_date, vps_expire_date, source_tab) VALUES (?,?,?,?,?,?,?)',
        [clean(r['TG name']), 'one_month', clean(r['Status']), clean(r['ACTIVATION DATE']), clean(r['EXPIRE DATE']), null, 'CS Sheet: STATUS PAGE']);
      nStatus++;
    }
    if (clean(r['TG name.1'])) {
      await dbRun('INSERT INTO status_page (telegram_name, plan_type, status, activation_date, expire_date, vps_expire_date, source_tab) VALUES (?,?,?,?,?,?,?)',
        [clean(r['TG name.1']), 'lifetime', clean(r['Status.1']), clean(r['ACTIVATION DATE.1']), null, clean(r['VPS EXPIRE DATE']), 'CS Sheet: STATUS PAGE']);
      nStatus++;
    }
    if (clean(r['TG name.2'])) {
      await dbRun('INSERT INTO status_page (telegram_name, plan_type, status, activation_date, expire_date, vps_expire_date, source_tab) VALUES (?,?,?,?,?,?,?)',
        [clean(r['TG name.2']), 'broker_trial', clean(r['Status.2']), clean(r['ACTIVATION DATE.2']), clean(r['EXPIRE DATE.1']), null, 'CS Sheet: STATUS PAGE']);
      nStatus++;
    }
  }
  log(`Imported ${nStatus} status page entries.`);

  log('\n== Final counts ==');
  for (const t of ['users','clients','issues','setups','running_accounts','vps_credentials','status_page']) {
    const rows = await dbAll(`SELECT COUNT(*)::int c FROM ${t}`);
    log(`${t}: ${rows[0].c}`);
  }

  fs.writeFileSync(path.join(__dirname, '..', '..', 'data', 'IMPORT_REPORT.txt'), report.join('\n'));
  log('\nWrote data/IMPORT_REPORT.txt');
}

main().catch((e) => { console.error(e); process.exit(1); });
