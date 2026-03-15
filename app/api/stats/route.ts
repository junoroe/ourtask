import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

// GET /api/stats — community impact stats
export async function GET() {
  try {
    // All-time stats
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM tasks WHERE is_approved = true) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM volunteers WHERE status IN ('confirmed', 'completed')) as total_volunteers,
        (SELECT COUNT(DISTINCT user_id) FROM volunteers) as unique_volunteers,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM organizations WHERE is_verified = true) as verified_orgs
    `);

    // Category breakdown
    const categories = await query(`
      SELECT category,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM tasks
      WHERE is_approved = true
      GROUP BY category
      ORDER BY total DESC
    `);

    // Recent completions (last 30 days)
    const recent = await query(`
      SELECT t.title, t.slug, t.category, t.completed_at, t.photo_url, t.photo_after_url,
             t.volunteers_count, u.name as creator_name
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'completed' AND t.completed_at > NOW() - INTERVAL '30 days'
      ORDER BY t.completed_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats: stats.rows[0],
      categories: categories.rows,
      recent_completions: recent.rows,
    });
  } catch (error: any) {
    console.error('Stats error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
