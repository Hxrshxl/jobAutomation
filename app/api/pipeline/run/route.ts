import { NextResponse } from 'next/server';
import { runAllProfiles } from '../../../../services/orchestrator';

// Layer 2: In-memory guard
let isRunning = false;
let startedAt: string | null = null;

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-api-key');
  const secret = process.env.PIPELINE_SECRET;

  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isRunning) {
    return NextResponse.json(
      { status: 'conflict', message: 'Pipeline already running', startedAt },
      { status: 409 }
    );
  }

  let options: any = { runType: 'full', tiers: ['all'] };
  try {
    const body = await request.json();
    if (body.runType) options.runType = body.runType;
    if (body.tiers) options.tiers = body.tiers;
  } catch (e) {
    // Ignore JSON parse error if body is empty
  }

  isRunning = true;
  startedAt = new Date().toISOString();

  try {
    const results = await runAllProfiles(options);
    return NextResponse.json(
      { status: 'started', message: 'Pipeline triggered', results },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status === 409) {
      return NextResponse.json(
        { status: 'conflict', message: error.message, startedAt: error.startedAt },
        { status: 409 }
      );
    }
    console.error('Pipeline run error:', error);
    return NextResponse.json({ error: 'Pipeline execution failed' }, { status: 500 });
  } finally {
    isRunning = false;
    startedAt = null;
  }
}
