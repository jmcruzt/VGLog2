/**
 * One-time migration script: MongoDB → Turso
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27017 TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... \
 *     npx ts-node --project tsconfig.json scripts/migrate-from-mongodb.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import { createClient } from '@libsql/client';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL) { console.error('TURSO_URL is required'); process.exit(1); }

const turso = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });

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
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();

  // Schema
  await turso.executeMultiple(`
    CREATE TABLE IF NOT EXISTS platforms (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, platform_id TEXT, platform_name TEXT NOT NULL,
      status TEXT NOT NULL, is_rog_ally_x INTEGER NOT NULL DEFAULT 0, is_game_pass INTEGER NOT NULL DEFAULT 0,
      estimated_hours REAL, release_year INTEGER, sort_order INTEGER NOT NULL DEFAULT 0,
      is_playing_now INTEGER NOT NULL DEFAULT 0, start_date TEXT, end_date TEXT,
      completed_hours REAL, days_to_complete INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, action TEXT NOT NULL, entity TEXT NOT NULL,
      entity_id TEXT NOT NULL, timestamp TEXT NOT NULL, details TEXT NOT NULL
    );
  `);

  const platformsDb = mongo.db('vglog_games');

  // Platforms
  const mongoPlatforms = await platformsDb.collection('platforms').find({}).toArray();
  console.log(`Migrating ${mongoPlatforms.length} platforms...`);
  for (const p of mongoPlatforms) {
    await turso.execute({ sql: 'INSERT OR IGNORE INTO platforms (id, name) VALUES (?, ?)', args: [toId(p._id), p.name] });
  }

  // Games
  const mongoGames = await platformsDb.collection('games').find({}).toArray();
  console.log(`Migrating ${mongoGames.length} games...`);
  for (const g of mongoGames) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO games
        (id, name, platform_id, platform_name, status, is_rog_ally_x, is_game_pass,
         estimated_hours, release_year, sort_order, is_playing_now, start_date, end_date,
         completed_hours, days_to_complete, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        toId(g._id), g.name,
        g.platformId ? toId(g.platformId) : null,
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
      ],
    });
  }

  // Audit logs
  const logsDb = mongo.db('vglog_logs');
  const mongoLogs = await logsDb.collection('auditLogs').find({}).toArray();
  console.log(`Migrating ${mongoLogs.length} audit logs...`);
  for (const l of mongoLogs) {
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?,?,?,?,?,?)',
      args: [toId(l._id), l.action, l.entity, l.entityId ?? '', toISO(l.timestamp) ?? new Date().toISOString(), JSON.stringify(l.details ?? {})],
    });
  }

  await mongo.close();

  const { rows: [p] } = await turso.execute('SELECT COUNT(*) as c FROM platforms');
  const { rows: [g] } = await turso.execute('SELECT COUNT(*) as c FROM games');
  const { rows: [l] } = await turso.execute('SELECT COUNT(*) as c FROM audit_logs');
  console.log('Migration complete!');
  console.log(`  Platforms: ${p.c}`);
  console.log(`  Games:     ${g.c}`);
  console.log(`  Logs:      ${l.c}`);
}

main().catch(err => { console.error(err); process.exit(1); });
