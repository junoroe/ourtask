import { NextResponse } from 'next/server';
import { getLeaderboard } from '../../../lib/badges';

// GET /api/leaderboard
export async function GET() {
  try {
    const leaders = await getLeaderboard(50);
    return NextResponse.json({ leaderboard: leaders });
  } catch (error: any) {
    console.error('Leaderboard error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
