/**
 * One-time migration script: MongoDB → SQLite
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27017 npx ts-node --project tsconfig.json scripts/migrate-from-mongodb.ts
 *
 * The script connects to MongoDB, reads all platforms, games, and audit logs,
 * then inserts them into the SQLite database at ./data/vglog.db.
 *
 * Run once locally before deploying to Railway.
 */

import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'vglog.db');

// Ensure data dir
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Init SQLite (schema already created by lib/db.ts logic — replicate here)
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS platforms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform_id TEXT REFERENCES platforms(id),
    platform_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','completed','upcoming')),
    is_rog_ally_x INTEGER NOT NULL DEFAULT 0,
    is_game_pass INTEGER NOT NULL DEFAULT 0,
    estimated_hours REAL,
    release_year INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_playing_now INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    completed_hours REAL,
    days_to_complete INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    details TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
`);

function toId(v: unknown): string {
  if (v instanceof ObjectId) return v.toHexString();
  return String(v);
}

function toISO(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  // ── Platforms ────────────────────────────────────────────────────────────
  const platformsDb = client.db('vglog_games');
  const mongoPlatforms = await platformsDb.collection('platforms').find({}).toArray();
  console.log(`Migrating ${mongoPlatforms.length} platforms…`);

  const insertPlatform = sqlite.prepare('INSERT OR IGNORE INTO platforms (id, name) VALUES (?, ?)');
  const insertAllPlatforms = sqlite.transaction(() => {
    for (const p of mongoPlatforms) {
      insertPlatform.run(toId(p._id), p.name);
    }
  });
  insertAllPlatforms();

  // ── Games ────────────────────────────────────────────────────────────────
  const mongoGames = await platformsDb.collection('games').find({}).toArray();
  console.log(`Migrating ${mongoGames.length} games…`);

  const insertGame = sqlite.prepare(`
    INSERT OR IGNORE INTO games
      (id, name, platform_id, platform_name, status, is_rog_ally_x, is_game_pass,
       estimated_hours, release_year, sort_order, is_playing_now, start_date, end_date,
       completed_hours, days_to_complete, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertAllGames = sqlite.transaction(() => {
    for (const g of mongoGames) {
      insertGame.run(
        toId(g._id), g.name,
        g.platformId ?? toId(g.platformId),
        g.platformName ?? '',
        g.status ?? 'pending',
        g.isROGAllyX ? 1 : 0,
        g.isGamePass ? 1 : 0,
        g.estimatedHours ?? null,
        g.releaseYear ?? null,
        g.order ?? 0,
        g.isPlayingNow ? 1 : 0,
        toISO(g.startDate),
        toISO(g.endDate),
        g.completedHours ?? null,
        g.daysToComplete ?? null,
        toISO(g.createdAt) ?? new Date().toISOString(),
        toISO(g.updatedAt) ?? new Date().toISOString(),
      );
    }
  });
  insertAllGames();

  // ── Audit Logs ────────────────────────────────────────────────────────────
  const logsDb = client.db('vglog_logs');
  const mongoLogs = await logsDb.collection('auditLogs').find({}).toArray();
  console.log(`Migrating ${mongoLogs.length} audit logs…`);

  const insertLog = sqlite.prepare(`
    INSERT OR IGNORE INTO audit_logs (id, action, entity, entity_id, timestamp, details)
    VALUES (?,?,?,?,?,?)
  `);
  const insertAllLogs = sqlite.transaction(() => {
    for (const l of mongoLogs) {
      insertLog.run(
        toId(l._id), l.action, l.entity, l.entityId ?? '',
        toISO(l.timestamp) ?? new Date().toISOString(),
        JSON.stringify(l.details ?? {}),
      );
    }
  });
  insertAllLogs();

  await client.close();

  const pCount = (sqlite.prepare('SELECT COUNT(*) as c FROM platforms').get() as { c: number }).c;
  const gCount = (sqlite.prepare('SELECT COUNT(*) as c FROM games').get() as { c: number }).c;
  const lCount = (sqlite.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as { c: number }).c;

  console.log('✓ Migration complete!');
  console.log(`  Platforms: ${pCount}`);
  console.log(`  Games:     ${gCount}`);
  console.log(`  Logs:      ${lCount}`);

  sqlite.close();
}

main().catch(err => { console.error(err); process.exit(1); });
