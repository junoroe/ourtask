import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { getCurrentUser } from '../../../../../lib/auth';
import { notifyVolunteerJoined } from '../../../../../lib/email';

// POST /api/tasks/[slug]/volunteer — join a task
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const message = body.message?.substring(0, 500) || null;

    // Get task
    const taskResult = await query(
      `SELECT id, user_id, volunteers_needed, volunteers_count, status FROM tasks WHERE slug = $1 AND is_approved = true`,
      [params.slug]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];

    if (task.status === 'completed' || task.status === 'cancelled') {
      return NextResponse.json({ error: 'This task is no longer accepting volunteers' }, { status: 400 });
    }

    if (task.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot volunteer for your own task' }, { status: 400 });
    }

    // Check if already volunteered
    const existing = await query(
      'SELECT id, status FROM volunteers WHERE task_id = $1 AND user_id = $2',
      [task.id, user.id]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'confirmed') {
      return NextResponse.json({ error: 'You have already volunteered for this task' }, { status: 400 });
    }

    // Insert or re-activate volunteer
    if (existing.rows.length > 0) {
      await query('UPDATE volunteers SET status = $1, message = $2 WHERE id = $3', ['confirmed', message, existing.rows[0].id]);
    } else {
      await query(
        'INSERT INTO volunteers (task_id, user_id, message) VALUES ($1, $2, $3)',
        [task.id, user.id, message]
      );
    }

    // Update count
    await query(
      'UPDATE tasks SET volunteers_count = (SELECT COUNT(*) FROM volunteers WHERE task_id = $1 AND status = $2) WHERE id = $1',
      [task.id, 'confirmed']
    );

    // Update user stats
    await query('UPDATE users SET volunteer_count = volunteer_count + 1 WHERE id = $1', [user.id]);

    // Send notification to task creator (async, don't block response)
    notifyVolunteerJoined(task.id, user.name, message).catch(err => 
      console.error('Notification error:', err.message)
    );

    return NextResponse.json({ success: true, message: "You're in! 🎉" });
  } catch (error: any) {
    console.error('Volunteer error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[slug]/volunteer — leave a task
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskResult = await query('SELECT id FROM tasks WHERE slug = $1', [params.slug]);
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskId = taskResult.rows[0].id;

    await query(
      'UPDATE volunteers SET status = $1 WHERE task_id = $2 AND user_id = $3',
      ['cancelled', taskId, user.id]
    );

    await query(
      'UPDATE tasks SET volunteers_count = (SELECT COUNT(*) FROM volunteers WHERE task_id = $1 AND status = $2) WHERE id = $1',
      [taskId, 'confirmed']
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Leave task error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
