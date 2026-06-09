export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToPlatform } from '@/lib/db';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function GET() {
  const client = await db();
  const { rows } = await client.execute('SELECT * FROM platforms ORDER BY name ASC');
  return ok(rows.map(rowToPlatform));
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return err('name is required');
  const client = await db();
  const { rows: existing } = await client.execute({ sql: 'SELECT id FROM platforms WHERE name = ?', args: [name.trim()] });
  if (existing.length > 0) return err(`Platform "${name}" already exists`, 409);
  const id = randomUUID();
  const now = new Date().toISOString();
  await client.batch([
    { sql: 'INSERT INTO platforms (id, name) VALUES (?, ?)', args: [id, name.trim()] },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'CREATE', 'Platform', id, now, JSON.stringify({ name: name.trim() })] },
  ], 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [id] });
  return ok(rowToPlatform(rows[0]));
}
