import { NextResponse } from 'next/server';
import { runAllProfiles } from '../../../../services/orchestrator';

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-api-key');
  const secret = process.env.PIPELINE_SECRET;

  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runAllProfiles();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Pipeline run error:', error);
    return NextResponse.json({ error: 'Pipeline execution failed' }, { status: 500 });
  }
}
