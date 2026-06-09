export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { rowToPlatform } from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function GET() {
  const rows = db.prepare('SELECT * FROM platforms ORDER BY name ASC').all() as Record<string, unknown>[];
  return ok(rows.map(rowToPlatform));
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return err('name is required');

  const existing = db.prepare('SELECT id FROM platforms WHERE name = ?').get(name.trim());
  if (existing) return err(`Platform "${name}" already exists`, 409);

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO platforms (id, name) VALUES (?, ?)').run(id, name.trim());

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'CREATE', 'Platform', id, now, JSON.stringify({ name: name.trim() }));

  const row = db.prepare('SELECT * FROM platforms WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToPlatform(row));
}
