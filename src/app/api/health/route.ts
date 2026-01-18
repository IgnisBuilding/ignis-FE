import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ignis-fire-safety',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
