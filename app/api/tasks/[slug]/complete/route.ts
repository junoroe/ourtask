import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { getCurrentUser } from '../../../../../lib/auth';
import { notifyTaskCompleted } from '../../../../../lib/email';

// POST /api/tasks/[slug]/complete — mark task as completed (owner only)
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let { photo_after_url } = body;

    // Validate photo_after_url is a local upload path
    if (photo_after_url && !/^\/uploads\/\d+-[a-f0-9]+\.(jpg|png|webp)$/.test(photo_after_url)) {
      photo_after_url = null;
    }

    const taskResult = await query(
      'SELECT id, user_id, status FROM tasks WHERE slug = $1',
      [params.slug]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the task creator can mark it complete' }, { status: 403 });
    }

    if (task.status === 'completed') {
      return NextResponse.json({ error: 'Task is already completed' }, { status: 400 });
    }

    await query(
      `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP, photo_after_url = COALESCE($1, photo_after_url)
       WHERE id = $2`,
      [photo_after_url || null, task.id]
    );

    // Update creator stats
    await query('UPDATE users SET tasks_completed = tasks_completed + 1 WHERE id = $1', [user.id]);

    // Mark all confirmed volunteers as completed
    await query(
      "UPDATE volunteers SET status = 'completed' WHERE task_id = $1 AND status = 'confirmed'",
      [task.id]
    );

    // Notify volunteers (async)
    notifyTaskCompleted(task.id).catch(err =>
      console.error('Completion notification error:', err.message)
    );

    return NextResponse.json({ success: true, message: 'Task completed! 🎉 Thank you for making a difference!' });
  } catch (error: any) {
    console.error('Complete task error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
