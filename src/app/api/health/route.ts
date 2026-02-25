import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  logger.info('Health check endpoint called');
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
