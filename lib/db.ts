import { createClient, type Client } from '@libsql/client';
import { rowToGame, rowToPlatform } from './mappers';

export { rowToGame, rowToPlatform };

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!_client) {
    if (!process.env.TURSO_URL) throw new Error('TURSO_URL env var is not set');
    _client = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

async function initSchema(client: Client): Promise<void> {
  await client.executeMultiple(`
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
      release_date TEXT,
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
}

async function runMigrations(client: Client): Promise<void> {
  try {
    await client.execute('ALTER TABLE games ADD COLUMN release_date TEXT');
  } catch { /* column already exists */ }
}

export async function db(): Promise<Client> {
  const client = getClient();
  if (!_initPromise) _initPromise = initSchema(client).then(() => runMigrations(client));
  await _initPromise;
  return client;
}
