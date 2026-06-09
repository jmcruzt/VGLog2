import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500').all() as Record<string, unknown>[];
  const logs = rows.map(r => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    timestamp: r.timestamp,
    details: JSON.parse(r.details as string),
  }));
  return NextResponse.json({ success: true, data: logs, error: null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, entity, entityId, details } = body;
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, action, entity, entityId, now, JSON.stringify(details ?? {}));
  return NextResponse.json({ success: true, data: { id }, error: null });
}
