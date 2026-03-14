import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

// GET /api/tasks/[slug] — get single task with volunteers
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const result = await query(
      `SELECT t.id, t.title, t.slug, t.description, t.category, t.status,
              t.latitude, t.longitude, t.address, t.event_date,
              t.estimated_duration, t.volunteers_needed, t.volunteers_count,
              t.photo_url, t.photo_after_url, t.created_at, t.completed_at,
              u.name as creator_name, u.id as creator_id
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.slug = $1 AND t.is_approved = true`,
      [params.slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = result.rows[0];

    // Get volunteers
    const volunteers = await query(
      `SELECT v.id, v.status, v.message, v.created_at, u.name, u.id as user_id
       FROM volunteers v
       JOIN users u ON v.user_id = u.id
       WHERE v.task_id = $1 AND v.status = 'confirmed'
       ORDER BY v.created_at ASC`,
      [task.id]
    );

    return NextResponse.json({
      task,
      volunteers: volunteers.rows,
    });
  } catch (error: any) {
    console.error('Get task error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
