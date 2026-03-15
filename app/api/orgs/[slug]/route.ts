import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

// GET /api/orgs/[slug] — get org details with their tasks
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const orgResult = await query(
      `SELECT o.id, o.name, o.slug, o.description, o.website, o.logo_url,
              o.category, o.is_verified, o.verified_at, o.created_at,
              COUNT(DISTINCT om.id) as member_count
       FROM organizations o
       LEFT JOIN org_members om ON om.org_id = o.id
       WHERE o.slug = $1
       GROUP BY o.id`,
      [params.slug]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = orgResult.rows[0];

    // Get org's tasks
    const tasks = await query(
      `SELECT t.id, t.title, t.slug, t.category, t.status, t.latitude, t.longitude,
              t.address, t.event_date, t.volunteers_needed, t.volunteers_count,
              t.photo_url, t.photo_after_url, t.created_at, t.completed_at,
              u.name as creator_name
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.org_id = $1 AND t.is_approved = true
       ORDER BY t.created_at DESC`,
      [org.id]
    );

    return NextResponse.json({ organization: org, tasks: tasks.rows });
  } catch (error: any) {
    console.error('Get org error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
