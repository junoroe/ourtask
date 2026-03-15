import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';
import { getUserBadges } from '../../../lib/badges';

// GET /api/badges — get current user's badges (or ?user_id=X for public profile)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('user_id');

    if (targetUserId) {
      const badges = await getUserBadges(parseInt(targetUserId));
      return NextResponse.json({ badges });
    }

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getUserBadges(user.id);

    // Also get all available badges for progress display
    const allBadges = await query('SELECT slug, name, description, icon, category, threshold FROM badges ORDER BY category, threshold');

    return NextResponse.json({ badges, all_badges: allBadges.rows });
  } catch (error: any) {
    console.error('Badges error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
