import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'vglog.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
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

  return _db;
}

// Proxy defers DB initialization to first use, so importing this module
// during Next.js build (when /data disk isn't mounted yet) doesn't fail.
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop as string);
  },
});

export default db;

// Row → Game shape mapper
export function rowToGame(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    platformId: row.platform_id as string,
    platformName: row.platform_name as string,
    status: row.status as string,
    isROGAllyX: Boolean(row.is_rog_ally_x),
    isGamePass: Boolean(row.is_game_pass),
    estimatedHours: row.estimated_hours as number | null,
    releaseYear: row.release_year as number | null,
    order: row.sort_order as number,
    isPlayingNow: Boolean(row.is_playing_now),
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    completedHours: row.completed_hours as number | null,
    daysToComplete: row.days_to_complete as number | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToPlatform(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
  };
}
