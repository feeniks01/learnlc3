import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');
  return new Redis({ url, token });
}

export async function POST(req: NextRequest) {
  try {
    const { type, pageId, pageTitle, message } = await req.json();
    if (!type || !pageId || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const redis = getRedis();
    const report = {
      id: crypto.randomUUID(),
      type,
      pageId,
      pageTitle: pageTitle || pageId,
      message,
      timestamp: new Date().toISOString(),
    };

    await redis.lpush('bug-reports', JSON.stringify(report));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Bug report error:', e);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redis = getRedis();
    const raw = await redis.lrange('bug-reports', 0, -1);
    const reports = raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r));
    return NextResponse.json(reports);
  } catch (e) {
    console.error('Bug report fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
